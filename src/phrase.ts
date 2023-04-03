type Fonction = "sujet" | "verbe_principal" | "cod" | "verbe";
// Ce type est un array de nombres, chaque nombre correspondant à la position d'un mot dans une phrase.
// Un mot est défini comme un ensemble de caractères séparés par une espace, un trait-d'union, un tiret ou une apostrophe.
type MotsPos = number[];

export class Phrase {
    protected verbes: MotsPos = [];
    private _phrase_cassee: string[] = [];
    // id ne peut être qu'une valeur de type Fonction, mais TS ne veut pas que je mette autre chose qu'une string...
    // Pour être sûr qu'il s'agisse bien du type Fonctions, des accesseurs sont en place.
    private _fonctions: { [id: string] : MotsPos} = {};
    private static _separateur = /[ ,;?!.\'-]/;
    
    constructor(protected phrase: string) {
        this.phrase = phrase;
        this._cassePhrase();
    }

    get contenu(): string {
        return this.phrase;
    }
    
    get phraseCassee(): string[] {
        return this._phrase_cassee;
    }

    get longueur(): number {
        /* Renvoie le nombre de mots,
         * pas le nombre de caractères.
         */
        return this._phrase_cassee.length;
    }

    fonctionPos(f: Fonction): MotsPos {
        /* Renvoie les index correspondant à la fonction
         * s'ils existent
         */
        return this._fonctions[f];
    }
    
    fonctionMots(f: Fonction): string {
        /* Similaire à fonctionPos
         * mais renvoie les mots correspondants
         */
        return this._fonctions[f]
            .map(x => this._phrase_cassee[x])
            .join(" ");
    }

    declareFonction(f: Fonction, mots: MotsPos): void {
        this._fonctions[f] = mots.sort();
    }

    private _cassePhrase() {
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

    estFonction(f:Fonction, mot:MotsPos): boolean {
        /*Vrai si mot a cette fonction
         */
        return this.fonctionPos(f) === mot.sort();
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

    declare(f: Fonction, elt: MotsPos): boolean {
        /* Enregistre une fonction pour cette phrase.
         * Vrai si elt a bien cette fonction
         * d'après le corrigé
         */
        if (f === "verbe") {
            this.verbes = elt;
        } else {
            this.declareFonction(f, elt);
        }
        return this.corrige.estFonction(f, elt);
    }

}
