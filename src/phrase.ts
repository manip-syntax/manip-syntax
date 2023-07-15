import {assert, compare} from "./util";
export type Fonction =
// dans la phrase
    "verbes" |
    "verbe_principal" |
    "noyau" |
    "groupe_verbal" |
    "sujet" |
    "cod" | "coi" |
    "attribut_du_sujet" | "attribut_du_cod" |
    "complement_d_agent" |
    "complement_circonstanciel" |
    "complement_du_verbe_impersonnel" |
// dans le GN
    "complement_du_nom" |
    "epithete" |
    "apposition" |
    "complement_de_l_adjectif" |
// énonciatives et textuelles
    "modalisateur" |
    "auto-enonciative" |
    "connecteur" |
    "balise_textuelle"
;

// Ce type est un array de nombres, chaque nombre correspondant à la position d'un mot dans une phrase.
// Un mot est défini comme un ensemble de caractères séparés par une espace, un trait-d'union, un tiret ou une apostrophe.
export type MotsPos = number[];
// type nécessaire pour les fonctions qui peuvent se retrouver plusieurs fois dans une phrase (comme les compléments circonstanciels)
type MultiMotsPos = MotsPos[];
// voir la fonction fonction_detaillee pour le détail de cet type
export type FonctionEnchassee = [ Fonction, number, number];

class SyntagmeAbstrait {
    /* Représente la base de toute les classes de groupes de mots
     */
    // id ne peut être qu'une valeur de type Fonction, mais TS ne veut pas que je mette autre chose qu'une string...
    // Pour être sûr qu'il s'agisse bien du type Fonction, des accesseurs sont en place.
    protected _fonctions_uniques: { [id: string] : MotsPos } = {};
    protected _fonctions_multiples: { [id: string] : MultiMotsPos } = {};
    protected _groupes_enchasses: GroupeEnchasse[] = [];
    public static Fonctions_multiples: Fonction[] = ["complement_circonstanciel", "modalisateur","auto-enonciative","connecteur","balise_textuelle"];

    get groupes_enchasses(): GroupeEnchasse[] {
        return this._groupes_enchasses;
    }

    cree_groupe_enchasse(contenu: MotsPos): GroupeEnchasse {
        const n = new GroupeEnchasse(contenu);
        this._groupes_enchasses.push(n);
        return n;
    }

    fonction(i: number) : Fonction[] { // TEST à faire
        /* Renvoie la ou les fonctions déclarées pour tel mot.
         */

        let rv:Fonction[] = [];

        for (const key in this._fonctions_uniques) {
            if (this._fonctions_uniques[key].includes(i)) {
                rv.push(key as Fonction);
            }
        }
        for (const key in this._fonctions_multiples) { // TODO partie à tester
            for (const e of this._fonctions_multiples[key]) {
                if (e.includes(i)) {
                    rv.push(key as Fonction);
                    break;
                }
            }
        }

        for (const elt of this._groupes_enchasses) {// TODO partie à tester
            const res = elt.fonction(i);
            if (res) {
                rv.push(...res);
            }
        }
        return rv;
    }

    fonction_detaillee(i: number): FonctionEnchassee[] { // TEST à faire
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

    fonctionPos(f: Fonction, numero_de_fonction: number = -1): MotsPos { // TEST à faire
        /* Renvoie les index correspondant à la fonction
         * s'ils existent
         * numero_de_fonction ne s'applique que s'il y a plusieurs fonctions dans la même phrase (par exemple des compléments circonstanciels)
         * Cette fonction renvoie un tableau vide en cas d'erreur
         */
        if (numero_de_fonction >= 0) { // TODO partie à tester
            assert(f in SyntagmeAbstrait.Fonctions_multiples,`fonctionPos:  ${f} n'est pas une fonction multiple`);
            if (! (f in this._fonctions_multiples) || numero_de_fonction >= this._fonctions_multiples[f].length) {
                return [];
            }
            return this._fonctions_multiples[f][numero_de_fonction];
        }

        if (! (f in this._fonctions_uniques)) { // TODO partie à tester
            return [];
        }
        return this._fonctions_uniques[f];
    }

    declareFonction(f: Fonction, mots: MotsPos, numero_de_fonction: number = -1): void { // TEST à faire
        /* Déclare une fonction contenant les mots correspondants
         * si numero_de_fonction est précisé, la fonction correspondante sera modifiée.
         * S'il s'agit d'une fonction multiple et qu'il n'y a pas de numero_de_fonction,
         * la fonction sera ajoutée
         * Pour ajouter une fonction à un groupe enchâssé, il faut le déclarer directement dans ce groupe
         */
        if (mots.length === 0) {
            // TODO partie à tester
            return;
        }
        mots = mots.sort(
                (a,b) => a -b
            );
        if (SyntagmeAbstrait.Fonctions_multiples.includes(f)) { // TODO partie à tester
            if (numero_de_fonction >= 0) {
                assert(f in this._fonctions_multiples,`declareFonction: ${f} n'a pas été créé.`);
                assert(numero_de_fonction <= this._fonctions_multiples[f].length, `declareFonction: ${numero_de_fonction} introuvable pour ${f}`);
                this._fonctions_multiples[f][numero_de_fonction] = mots;
            } else {
                if (! (f in this._fonctions_multiples)) {
                    this._fonctions_multiples[f] = [];
                }
                this._fonctions_multiples[f].push(mots);
            }
        } else {
            this._fonctions_uniques[f] = mots;
        }
    }

}

export class Phrase extends SyntagmeAbstrait {
    protected verbes: MotsPos = [];
    private _phrase_cassee: string[] = [];
    public static Separateur = "[ ,;?!.'-]";
    private static _separateur = new RegExp(Phrase.Separateur);
    
    constructor(protected phrase: string) {
        super();
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

    get copie(): Phrase {
        /* Copie le contenu de la phrase
         */
        let copie = new Phrase(this.contenu);
        copie.verbes = this.verbes;
        copie._fonctions_uniques = this._fonctions_uniques;
        copie._fonctions_multiples = this._fonctions_multiples;
        copie._groupes_enchasses = this._groupes_enchasses;
        return copie;
    }

    // http://choly.ca/post/typescript-json/#comment-2579491209
    toJSON(): PhraseJSON {  // TEST À FAIRE
        // une copie pour garder le strict nécessaire: les données
        const copie = this.copie;
        let copie_obj = Object.assign(copie);
        delete copie_obj["_phrase_cassee"];
        return copie_obj;
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

    fonction(i: number) : Fonction[] { // TEST à faire
        /* Renvoie la ou les fonctions déclarées pour tel mot.
         */
        let rv:Fonction[] = super.fonction(i);
        if (this.verbes.includes(i)) {
            rv.push("verbes");
        }
        return rv;
    }

    fonctionPos(f: Fonction, numero_de_fonction: number = -1): MotsPos { // TEST 
        /* Renvoie les index correspondant à la fonction
         * s'ils existent
         * numero_de_fonction ne s'applique que s'il y a plusieurs fonctions dans la même phrase (par exemple des compléments circonstanciels)
         */
        if (f == "verbes") { // TODO partie à tester
            return this.verbes;
        }
        return super.fonctionPos(f, numero_de_fonction);
    }
    
    fonctionMots(f: Fonction, numero_de_fonction: number = -1): string { // TEST à faire
        /* Similaire à fonctionPos
         * mais renvoie les mots correspondants
         */
        if (numero_de_fonction >= 0) {
            assert(f in SyntagmeAbstrait.Fonctions_multiples,`fonctionMots: ${f} n'est pas une fonction multiple`);
            assert(f in this._fonctions_multiples,`fonctionMots: ${f} n'a pas été créé.`);
            assert(numero_de_fonction <= this._fonctions_multiples[f].length, `fonctionMots: ${numero_de_fonction} introuvable pour ${f}`);
        }

        return this.fonctionPos(f, numero_de_fonction)
            .map(x => this._phrase_cassee[x])
            .join(" ");
    }

    declareFonction(f: Fonction, mots: MotsPos, numero_de_fonction: number = -1): void { // TEST 
        /* Déclare une fonction contenant les mots correspondants
         * si numero_de_fonction est précisé, la fonction correspondante sera modifiée.
         * S'il s'agit d'une fonction multiple et qu'il n'y a pas de numero_de_fonction,
         * la fonction sera ajoutée
         */
        if (f === "verbes") {
            //  TODO partie à tester?
            this.verbes = mots;
        } else {
            super.declareFonction(f, mots, numero_de_fonction);
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

    static reviver(key: string, value: any): any {
        return key === "" ? PhraseCorrigee.fromJSON(value) : value;
    }

    static fromJSON(json: PhraseJSON|string): PhraseCorrigee { // TEST
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
        return !compare(pos,[]);
    }

    estFonction(f:Fonction, mot:MotsPos): boolean { // TEST 
        /*Vrai si mot a cette fonction d'après le corrigé
         */
        return compare(this.fonctionPos(f),mot.sort());
    }

}

export class GroupeEnchasse extends SyntagmeAbstrait {
    /* Représente un groupe de mots enchâssés dans une phrase
     */
    Fonctions_multiples: Fonction[]  = [...SyntagmeAbstrait.Fonctions_multiples,"epithete","complement_du_nom","complement_de_l_adjectif","apposition"];

    constructor(private _contenu: MotsPos) {
        super();
        console.log(this._contenu);
    }
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
    _fonctions_uniques: { [id: string] : MotsPos|undefined};
    _fonctions_multiples?: { [id: string] : MultiMotsPos|undefined};
    _groupes_enchasses?: GroupeEnchasse[];
    verbes: MotsPos;
}

