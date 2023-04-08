import {compare} from "./util";
type Fonction =
    "verbes" |
    "verbe_principal" |
    "sujet" |
    "cod" | "coi" |
    "attribut_du_sujet" | "attribut_du_cod" |
    "complément_d_agent" |
    "complément_circonstanciel"
;

// Ce type est un array de nombres, chaque nombre correspondant à la position d'un mot dans une phrase.
// Un mot est défini comme un ensemble de caractères séparés par une espace, un trait-d'union, un tiret ou une apostrophe.
export type MotsPos = number[];

export class Phrase {
    protected verbes: MotsPos = [];
    private _phrase_cassee: string[] = [];
    // id ne peut être qu'une valeur de type Fonction, mais TS ne veut pas que je mette autre chose qu'une string...
    // Pour être sûr qu'il s'agisse bien du type Fonctions, des accesseurs sont en place.
    protected _fonctions: { [id: string] : MotsPos} = {};
    private static _separateur = /[ ,;?!.\'-]/;
    
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

    fonctionPos(f: Fonction): MotsPos { // TEST
        /* Renvoie les index correspondant à la fonction
         * s'ils existent
         */
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
            this._fonctions[f] = mots.sort();
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

    constructor(phrase: string, private corrige: PhraseCorrigee) {
        super(phrase);
        this.corrige = corrige;
    }

    declare(f: Fonction, elt: MotsPos): boolean { // TEST
        /* Enregistre une fonction pour cette phrase.
         * Vrai si elt a bien cette fonction
         * d'après le corrigé
         */
        this.declareFonction(f, elt);
        return this.corrige.estFonction(f, elt);
    }

}

interface PhraseJSON {
    phrase: string;
    _fonctions: { [id: string] : MotsPos|undefined};
    verbes: MotsPos;
}

