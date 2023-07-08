import {compare} from "./util";
export type Fonction =
// dans la phrase
    "verbes" |
    "verbe_principal" |
    "noyau" |
    "groupe_verbal" |
    "sujet" |
    "cod" | "coi" |
    "attribut_du_sujet" | "attribut_du_cod" |
    "complément_d_agent" |
    "complément_circonstanciel" |
    "complément_du_verbe_impersonnel" |
// dans le GN
    "complément_du_nom" |
    "épithète" |
    "apposition" |
    "complément_de_l_adjectif" |
// énonciatives et textuelles
    "modalisateur" |
    "auto-énonciative" |
    "connecteur" |
    "balise_textuelle"
;

// Ce type est un array de nombres, chaque nombre correspondant à la position d'un mot dans une phrase.
// Un mot est défini comme un ensemble de caractères séparés par une espace, un trait-d'union, un tiret ou une apostrophe.
export type MotsPos = number[];
// voir la fonction fonction_detaillee pour le détail de cet type
export type FonctionEnchassee = [ Fonction, number, number];

export class Phrase {
    protected verbes: MotsPos = [];
    private _phrase_cassee: string[] = [];
    // id ne peut être qu'une valeur de type Fonction, mais TS ne veut pas que je mette autre chose qu'une string...
    // Pour être sûr qu'il s'agisse bien du type Fonctions, des accesseurs sont en place.
    protected _fonctions: { [id: string] : MotsPos} = {};
    public static Separateur = "[ ,;?!.'-]";
    private static _separateur = new RegExp(Phrase.Separateur);
    
    constructor(protected phrase: string) {
        this.phrase = phrase;
        this._cassePhrase();
    }

    get contenu(): string {
        return this.phrase;
    }

    set contenu(phrase: string) {
        /* Met à jour le contenu de la phrase
         */
        this.phrase = phrase;
    }

    
    get phraseCassee(): string[] { // TEST
        return this._phrase_cassee;
    }

    get longueur(): number { // TEST
        /* Renvoie le nombre de mots,
         * pas le nombre de caractères.
         */
        return this._phrase_cassee.length;
    }

    static get separateur(): RegExp {
        return this._separateur;
    }

    fonction(i: number) : Fonction[] { // TEST
        /* Renvoie la ou les fonctions déclarées pour tel mot.
         */
        let rv:Fonction[] = [];
        if (i >= this.longueur) {
            return rv;
        }
        if (this.verbes.includes(i)) {
            rv.push("verbes");
        }
        for (const key in this._fonctions) {
            if (this._fonctions[key].includes(i)) {
                rv.push(key as Fonction);
            }
        }
        return rv;
    }

    fonction_detaillee(i: number): FonctionEnchassee[] { // TEST
        /* Cette fonction renvoie un array de fonctions valables
         * pour le mot entré.
         * Chaque élément contient le nom de la fonction,
         * le début de la fonction et la fin de la fonction
         * L'ordre correspond à l'ordre des enchassements:
         * le contenant se trouve avant le contenu // TODO partie à tester
         */
        return this.fonction(i)
            .map( x => {
                const positions = this.fonctionPos(x);
                return [x, positions[0], positions.slice(-1)[0]] as FonctionEnchassee;
            })
            .sort( (a, b) => (a[2] - a[1]) > (b[2] - b[1]) ? -1 : 1);
    }

    fonctionPos(f: Fonction): MotsPos { // TEST
        /* Renvoie les index correspondant à la fonction
         * s'ils existent
         */
        if (f == "verbes") { // TODO partie à tester
            return this.verbes;
        }
        return this._fonctions[f];
    }
    
    fonctionMots(f: Fonction): string { // TEST
        /* Similaire à fonctionPos
         * mais renvoie les mots correspondants
         */
        return this._fonctions[f]
            .map(x => this._phrase_cassee[x])
            .join(" ");
    }

    declareFonction(f: Fonction, mots: MotsPos): void { // TEST
        if (f === "verbes") {
            //  TODO partie à tester?
            this.verbes = mots;
        } else {
            this._fonctions[f] = mots.sort(
                (a,b) => a -b
            );
        }
    }

    private _cassePhrase() { // TEST
        /* Casse la phrase en mots en utilisant _separateur
         * pour séparer les mots
         */
        this._phrase_cassee = this.phrase
            .split(Phrase._separateur)
            .filter(n=>n); // retire chaines vides
    }

}

export class PhraseCorrigee extends Phrase {
    /* Cette classe est utilisée pour la correction
     * d'une phrase.
     */

    constructor(phrase: string) {
        super(phrase);
    }

    // http://choly.ca/post/typescript-json/#comment-2579491209
    toJSON(): PhraseJSON { // TEST
        // TODO enlever le superflu
        return Object.assign(this);
    }

    static reviver(key: string, value: any): any {
        return key === "" ? PhraseCorrigee.fromJSON(value) : value;
    }

    static fromJSON(json: PhraseJSON|string): PhraseCorrigee { // TEST
        // TODO vérifier la validité de la phrase
        if (typeof json === 'string') {
            return JSON.parse(json, PhraseCorrigee.reviver);
        } else {
            let phrase = Object.create(PhraseCorrigee.prototype);
            return Object.assign(phrase, json);
        }
    }

    aFonction(f: Fonction): boolean { // TEST
        /* Vrai si cette phrase contient cette fonction
         * d'après le corrigé.
         */
        const pos = this.fonctionPos(f);
        if (typeof pos === "undefined") {
            return false;
        }
        return !compare(pos,[]);
    }

    estFonction(f:Fonction, mot:MotsPos): boolean { // TEST
        /*Vrai si mot a cette fonction d'après le corrigé
         */
        const fonction_pos = this.fonctionPos(f);
        if (typeof fonction_pos === "undefined") {
            return false;
        }
        return compare(this.fonctionPos(f),mot.sort());
    }

}

export class SousPhrase extends Phrase {
    /* Représente une proposition
     * TODO
     */
}

export class PhraseEleve extends Phrase {
    /* Cette classe
     * contient la phrase sélectionnée par l'utilisateur,
     * ainsi que toutes les fonctions de la phrase trouvées
     * par l'utilisateur.
     * Elle contient en outre la correction.
     */

    constructor(phrase: string, private _corrige: PhraseCorrigee) {
        super(phrase);
        this._corrige = _corrige;
    }

    get corrige (): PhraseCorrigee {
        return this._corrige;
    }

    declare(f: Fonction, elt: MotsPos): boolean { // TEST
        /* Enregistre une fonction pour cette phrase.
         * Vrai si elt a bien cette fonction
         * d'après le corrigé
         */
        this.declareFonction(f, elt);
        return this._corrige.estFonction(f, elt);
    }

}

interface PhraseJSON {
    phrase: string;
    _fonctions: { [id: string] : MotsPos|undefined};
    verbes: MotsPos;
}

