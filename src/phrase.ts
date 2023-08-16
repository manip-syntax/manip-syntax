// TODO FIXME refactoring necessary
import {assert, compare} from "./util";
export type Fonction =
// dans la phrase
    "verbes" |
    "verbe_noyau" |
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
    "complement_du_pronom" |
    "epithete" |
    "apposition" |
    "complement_de_l_adjectif" |
// énonciatives et textuelles
    "modalisateur" |
    "auto-enonciative" |
    "connecteur" |
    "balise_textuelle" |
// cas particuliers
    "independante"
;

// Ce type est un array de nombres, chaque nombre correspondant à la position d'un mot dans une phrase.
// Un mot est défini comme un ensemble de caractères séparés par une espace, un trait-d'union, un tiret ou une apostrophe.
export type MotsPos = number[];
// type nécessaire pour les fonctions qui peuvent se retrouver plusieurs fois dans une phrase (comme les compléments circonstanciels)
type MultiMotsPos = MotsPos[];
// voir la fonction fonction_detaillee pour le détail de cet type
export type FonctionEnchassee = [ Fonction, number, number];
export type Denomination = [Fonction|"phrase", number];


export class Syntagme {
    // id ne peut être qu'une valeur de type Fonction, mais TS ne veut pas que je mette autre chose qu'une string...
    // Pour être sûr qu'il s'agisse bien du type Fonction, des accesseurs sont en place.
    protected _denomination: Denomination =  ["phrase", -1];
    protected _parent: Syntagme|null = null;
    private _phrase_cassee: string[] = [];

    protected verbes: MotsPos = [];
    protected _mots_offset : number[][] = [];
    
    protected _fonctions_uniques: { [id: string] : MotsPos } = {};
    protected _fonctions_multiples: { [id: string] : MultiMotsPos } = {};
    protected _groupes_enchasses: Map<[Fonction, number], Syntagme> = new Map();
    protected _manipulations: { [id: string] : ManipulationInfo} = {};

    public static Separateur = "[ ,;:?!.'-]";
    private static _separateur = new RegExp(Syntagme.Separateur);
    public static Fonctions_multiples: Fonction[] = ["independante","complement_circonstanciel", "modalisateur","auto-enonciative","connecteur","balise_textuelle","epithete","complement_du_nom","complement_du_pronom","complement_de_l_adjectif","apposition"];
    public static Fonctions_contenants: Fonction[] = ["independante","sujet","cod","coi","attribut_du_sujet","attribut_du_cod","complement_circonstanciel","complement_du_verbe_impersonnel","complement_du_nom","complement_du_pronom","epithete","apposition","complement_de_l_adjectif"];
    // on ne met pas le groupe verbal dans cette liste pour des raisons pratiques en rapport  avec la logique de l'analyse

    constructor(protected phrase: string, protected _mots_pos: MotsPos = []) {
        this.phrase = phrase;
        this._casseSyntagme();
        this._mots_pos = compare(_mots_pos, []) ? [...Array(this._phrase_cassee.length).keys()] : _mots_pos;
        this._remplit_mots_offset();
    }

    get ancetre() : Syntagme {
        if (this._denomination[0] === "phrase") {
            return this;
        }
        if (this._parent === null) {
            assert(this._parent !== null,"Pas de parent enregistré");
            throw Error;
        }
            
        return this._parent.ancetre;
    }


    get contenu(): string {
        return this.phrase;
    }
    get arbre_genealogique(): Denomination[] {
        if (this._parent === null) {
            return [this._denomination];
        }
        let ar = this._parent.arbre_genealogique;
        ar.push(this._denomination);
        return ar;
    }

    get mots_sans_fonction(): MotsPos {
        /* Renvoie les mots qui n'ont pas de fonction
         */
        return this._mots_pos.filter( i => this.fonction(i).length === 0);
    }

    get mots_pos(): MotsPos {
        return this._mots_pos;
    }

    set contenu(phrase: string) {
        /* Met à jour le contenu de la phrase
         */
        this.phrase = phrase;
    }

    _remplit_mots_offset() {  // TEST
        // TODO améliorer la précision: on pourrait attacher certains signes au mot qui précède (comme ,;) ou qui suit ("[, etc)
        let regex = new RegExp(Syntagme.Separateur,"g");
        const indices = [];
        let dernier_index = 0;
        let match;
        while ((match = regex.exec(this.contenu)) !== null) {
            if (match.index > dernier_index) {
                 indices.push([dernier_index, match.index]);
            }
            dernier_index = match.index + match[0].length;
        }
        if (dernier_index < this.contenu.length) {
            indices.push([dernier_index, this.contenu.length]);
        }
        this._mots_offset = indices;
        return indices;
    }

    offset_pos(mots: MotsPos): number[][] {
        /* Renvoie un array contenant les offsets des mots rentrés, en fusionnant ceux qui sont ensemble
         */
        let res = [] 
        for (let i=0, debut=0, fin=0, precedent=-1; i<this._mots_offset.length; i++) {
            if (mots.includes(i)) {
                if (precedent === (i-1)) {
                    fin = this._mots_offset[i][1];
                    if (i === this._mots_offset.length -1) {
                        res.push([debut, fin]);
                    }
                } else {
                    [debut, fin] = this._mots_offset[i];
                    if (i === this._mots_offset.length -1) {
                        res.push([debut, fin]);
                    }
                }
                precedent = i;
            } else {
                if (fin > 0 && precedent === i-1) {
                    res.push([debut, fin]);
                }
            }
        }
        return res;
    }

    texte_pos(mots: MotsPos): string { // TEST
        /* Renvoie le contenu (signes de ponctuation compris)
         * correspondant aux mots
         */
        let res = "";
        for (let i=0, debut=0, fin=0, precedent=-1; i<this._mots_offset.length; i++) {
            if (mots.includes(i)) {
                if (precedent === (i-1)) {
                    fin = this._mots_offset[i][1];
                    if (i === this._mots_offset.length -1) {
                        res += this.contenu.slice(debut, fin);
                    }
                } else {
                    [debut, fin] = this._mots_offset[i];
                    if (res.length > 0) {
                        res += " ";
                    }
                    if (i === this._mots_offset.length -1) {
                        res += this.contenu.slice(debut, fin);
                    }
                }
                precedent = i;
            } else {
                if (fin > 0 && precedent === i-1) {
                    res += this.contenu.slice(debut, fin);
                }
            }
        }
        return res;
    }

    fonction_texte_pos(f: Fonction, numero_de_fonction: number = -1): string {
        return this.texte_pos(this.fonctionPos(f, numero_de_fonction));
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

    _fonction_enchassee = (f: Fonction, m: MotsPos) => {
        return [f, m[0], m.slice(-1)[0]] as FonctionEnchassee;
    }

    _remplit_les_vides(): void {
        /* Pour la désérialisation,
         * remplit les attributs manquants
         */
        if (typeof this._fonctions_uniques === "undefined") {
            this._fonctions_uniques = {};
        }
        if (typeof this._fonctions_multiples === "undefined") {
            this._fonctions_multiples = {};
        }
        if (typeof this._groupes_enchasses === "undefined") {
            this._groupes_enchasses = new Map();
        }
    }

    get vide(): boolean {// TEST
        /* vrai si ce syntagme n'a aucune fonction enregistrée
         */
        for (const [,g] of this._groupes_enchasses) {
            if (!g.vide) {
                return false;
            }
        }
        return (Object.keys(this._fonctions_uniques).length === 0 && Object.keys(this._fonctions_multiples).length === 0);
    }

    ajoute_infos_de_manipulation(f: Fonction, infos: ManipulationInfo) {
        this._manipulations[f] = infos;
    }

    infos_de_manipulation(f: Fonction) {
        assert(f in this._manipulations, `${f} n'est pas enregistré dans les données de manipulation`);
        return this._manipulations[f];
    }

    get est_attributif(): boolean { // TEST
        /* Vrai si le groupe contient un sujet et un attribut du sujet.
         * Faux dans tous les autres cas
         */
        return "sujet" in this._fonctions_uniques && "attribut_du_sujet" in this._fonctions_uniques;
    }

    cree_groupe_enchasse(mots_pos: MotsPos, f: Fonction, numero:number): Syntagme { // TEST
        const n = new Syntagme(this.contenu, mots_pos);
        this._groupes_enchasses.set([f,numero], n);
        n._denomination = [f, numero];
        n._parent = this;
        return n;
    }

    get groupes_enchasses_nombre(): number {// TEST
        return this._groupes_enchasses.size;
    }

    groupe_enchasse(f: Fonction, numero:number): Syntagme { // TEST
        let val = undefined;
        for (const [k,v] of this._groupes_enchasses) {
            if (k[0] === f && k[1] === numero) {
                val = v;
            }
        }
        if (typeof val === "undefined") {
            throw Error(`Pas de groupe avec la fonction ${f} et le numéro ${numero}`);
        } else {
            return val;
        }
    }

    supprime_groupe_enchasse(f: Fonction, n: number): boolean {//TEST
        /* vrai si le groupe correspondant a pu être supprimé.
         */
        for (const [k,] of this._groupes_enchasses) {
            if (k[0] === f && k[1] === n) {
                return this._groupes_enchasses.delete(k);
            }
        }
        return false;
    }

    fonctions_multiples_nombre(f: Fonction): number {
        /* renvoie le nombre de f dans un syntagme donné
         */
        const m = this._fonctions_multiples;
        return f in m ? m[f].length : 0;
    }

     get copie(): Syntagme { // TEST TODO test à faire; IL faut supprimer vraiment l'inutile car ça crée une erreur en chargeant les phrases
        let copie = new Syntagme(this.contenu, this._mots_pos);
        Object.entries(this._fonctions_uniques)
            .forEach( ([n,f,]) => {
                if (f.length > 0) {
                    copie._fonctions_uniques[n] = f;
                }
            });
        Object.entries(this._fonctions_multiples)
            .forEach( ([n, f,]) => {
                let arr:MultiMotsPos = []
                if (f.length > 0) {
                    arr = f.filter( x => x.length > 0);
                }
                if (arr.length > 0) {
                    copie._fonctions_multiples[n] = arr;
                }
            }
        );
        copie._groupes_enchasses = new Map([...this._groupes_enchasses.entries()].filter( g => !g[1].vide).map(g => [g[0],g[1].copie]));
        copie._manipulations = this._manipulations;

        copie.verbes = this.verbes;
        return copie;
    }

    // http://choly.ca/post/typescript-json/#comment-2579491209
    toJSON(): SyntagmeJSON {  // TODO TEST À FAIRE -> ne fonctionne pas, tout est copié
        // une copie pour garder le strict nécessaire: les données
        const copie = this.copie;
        let copie_obj = Object.assign(copie);
        copie_obj._groupes_enchasses = Array.from(copie_obj._groupes_enchasses.entries());
        return copie_obj;
    }

    get profondeur(): number { // TEST
        /* Renvoie la profondeur, c'est-à-dire le nombre de groupes enchâssés
         * les uns dans les autres
         * 1 correspond à un groupe qui ne contient aucun autre groupe
         */
        if (this._groupes_enchasses.size === 0) {
            return 0;
        }
        return Math.max( ...[...this._groupes_enchasses.entries()]
                        .map( ([_,v]) => v.profondeur)
                       ) + 1;
    }

    fonction(i: number) : Fonction[] { // TEST 
        /* Renvoie la ou les fonctions déclarées pour tel mot.
         */

        let rv:Fonction[] = [];

        if (this.verbes.includes(i)) {
            rv.push("verbes");
        }

        for (const key in this._fonctions_uniques) {
            if (this._fonctions_uniques[key].includes(i)) {
                rv.push(key as Fonction);
            }
        }
        for (const key in this._fonctions_multiples) { 
            for (const e of this._fonctions_multiples[key]) {
                if (e.includes(i)) {
                    rv.push(key as Fonction);
                    break;
                }
            }
        }

        for (const [,elt] of this._groupes_enchasses) {
            const res = elt.fonction(i);
            if (res) {
                rv.push(...res);
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
         * le contenant se trouve avant le contenu 
         */
        let rv: FonctionEnchassee[] = [];

        if (this.verbes.includes(i)) {
            rv.push(this._fonction_enchassee("verbes",this.verbes));
        }


        for (const key in this._fonctions_uniques) {
            if (this._fonctions_uniques[key].includes(i)) {
                rv.push(this._fonction_enchassee(key as Fonction, this._fonctions_uniques[key]));
            }
        }
        const m = this._fonctions_multiples;
        for (const key in m) {
            for (const e of m[key]) {
                if (e.includes(i)) {
                    rv.push(this._fonction_enchassee(key as Fonction, e));
                }
            }
        }
        for (const [,g] of this._groupes_enchasses) {
            rv.push(...g.fonction_detaillee(i));

        }

        return rv
            .sort( (a, b) => (a[2] - a[1]) > (b[2] - b[1]) ? -1 : 1);
    }

    fonctionPos(f: Fonction, numero_de_fonction: number = -1): MotsPos { // TEST 
        /* Renvoie les index correspondant à la fonction
         * s'ils existent
         * numero_de_fonction ne s'applique que s'il y a plusieurs fonctions dans la même phrase (par exemple des compléments circonstanciels)
         * Cette fonction renvoie un tableau vide en cas d'erreur
         */
        if (numero_de_fonction >= 0) { 
            assert(Syntagme.Fonctions_multiples.includes(f),`fonctionPos:  ${f} n'est pas une fonction multiple`);
        }
        if (f == "verbes") { 
            return this.verbes;
        }

        if (Syntagme.Fonctions_multiples.includes(f)) { 
            assert(numero_de_fonction > -1,`fonctionPos: numero_de_fonction doit être supérieur à -1 pour les fonctions multiples comme ${f}`);

            if (! (f in this._fonctions_multiples) || numero_de_fonction >= this._fonctions_multiples[f].length) {
                return [];
            }
            return this._fonctions_multiples[f][numero_de_fonction];
        }

        if (! (f in this._fonctions_uniques)) { 
            return [];
        }
        return this._fonctions_uniques[f];
    }

    declareFonction(f: Fonction, mots: MotsPos, numero_de_fonction: number = -1): void { // TEST
        /* Déclare une fonction contenant les mots correspondants
         * si numero_de_fonction est précisé, la fonction correspondante sera modifiée.
         * S'il s'agit d'une fonction multiple et qu'il n'y a pas de numero_de_fonction,
         * la fonction sera ajoutée
         * Pour ajouter une fonction à un groupe enchâssé, il faut le déclarer directement dans ce groupe
         * On peut utiliser cette méthode pour supprimer une fonction: il suffit que mots soit un array vide
         */
        assert(this.mots_valides(mots),`declareFonction: ${mots} ne correspond pas à une liste de mots valides.`);
        mots = mots.sort(
                (a,b) => a -b
            );
        if (f === "verbes") {
            this.verbes = mots;
            return;
        } 

        if (Syntagme.Fonctions_multiples.includes(f)) { 
            let fm = this._fonctions_multiples;
            if (! (f in fm)) {
                assert(numero_de_fonction <= 0, `declareFonction: ${numero_de_fonction} introuvable pour ${f}`);
                // nouvel array pour la fonction qui n'a pas encore été créée
                fm[f] = [];
            }
            if (numero_de_fonction === -1 || numero_de_fonction === fm[f].length) {
                fm[f].push(mots);
            } else {
                assert(numero_de_fonction < fm[f].length, `declareFonction: ${numero_de_fonction} introuvable pour ${f}`);
                fm[f][numero_de_fonction] = mots;
            }
        } else {
            this._fonctions_uniques[f] = mots;
        }
    }

    fonctionMots(f: Fonction, numero_de_fonction: number = -1): string { // TEST 
        /* Similaire à fonctionPos
         * mais renvoie les mots correspondants
         */
        if (numero_de_fonction >= 0) { 
            assert(Syntagme.Fonctions_multiples.includes(f),`fonctionMots: ${f} n'est pas une fonction multiple`);
            assert(f in this._fonctions_multiples,`fonctionMots: ${f} n'a pas été créé.`);
            assert(numero_de_fonction < this._fonctions_multiples[f].length, `fonctionMots: ${numero_de_fonction} introuvable pour ${f}`);
        }

        return this.fonctionPos(f, numero_de_fonction)
            .map(x => this._phrase_cassee[x])
            .join(" ");
    }

    mots_valides(mots: MotsPos): boolean {
        if (mots.length > 0) {
            // les mots rentrés sont-ils dans les bornes ? Le problème ne se pose pas si on veut supprimer la fonction
            for (const m of mots) {
                if (!this._mots_pos.includes(m)) {
                    return false;
                }
            }
        }
        return true;
    }

    private _casseSyntagme() { // TEST
        /* Casse la phrase en mots en utilisant _separateur
         * pour séparer les mots
         */
        this._phrase_cassee = this.phrase
            .split(Syntagme._separateur)
            .filter(n=>n); // retire chaines vides
    }

}

export class SyntagmeCorrige extends Syntagme {
    /* Cette classe est utilisée pour la correction
     * d'une phrase.
     */

    constructor(phrase: string, mots_pos: MotsPos = []) {
        super(phrase, mots_pos);
    }

    static reviver(key: string, value: any): any {
        return key === "" ? SyntagmeCorrige.fromJSON(value) : value;
    }

    static fromJSON(json: SyntagmeJSON|string): SyntagmeCorrige { // TEST
        if (typeof json === 'string') {
            return JSON.parse(json, SyntagmeCorrige.reviver);
        } else {
            let phrase = Object.create(SyntagmeCorrige.prototype);
            const groupes_enchasses: Map<[Fonction, number], SyntagmeCorrige> = typeof json._groupes_enchasses === "undefined" ? new Map() : new Map(Object.entries(json._groupes_enchasses)
                                    .map( elt => {
                                        return [elt[1][0],SyntagmeCorrige.fromJSON(elt[1][1])];
                                    }));
            let o = Object.assign(phrase, json, {
                _groupes_enchasses: groupes_enchasses,
            });
            o._remplit_les_vides();
            return o;
        }
    }
    cree_groupe_enchasse(mots_pos: MotsPos, f: Fonction, numero:number): SyntagmeCorrige { // TEST
        const n = new SyntagmeCorrige(this.contenu, mots_pos);
        this._groupes_enchasses.set([f,numero], n);
        n._denomination = [f, numero];
        n._parent = this;
        return n;
    }


    groupe_enchasse(f: Fonction, n:number): SyntagmeCorrige {
        // on sait que les groupes enchassés de cette classe sont corrigés
        return super.groupe_enchasse(f,n) as SyntagmeCorrige;
    }

    aFonction(f: Fonction): boolean { // TEST
        /* Vrai si cette phrase contient cette fonction
         * d'après le corrigé.
         */
        if (Syntagme.Fonctions_multiples.includes(f)) { // À TESTER TODO 
            if (f in this._fonctions_multiples) {
                return this._fonctions_multiples[f].filter(e => !compare(e, [])).length > 0;
            }
            return false;
        }
        const pos = this.fonctionPos(f);
        return !compare(pos,[]);
    }

    aFonctions(fonctions: Fonction[]): boolean {
        /* vrai uniquement si toutes les fonctions sont présentes
         */
        for (let f of fonctions) {
            if (!this.aFonction(f)) {
                return false;
            }
        }
        return true;
    }

    estFonction(f:Fonction, mots:MotsPos): boolean { // TEST 
        /*Vrai si mot a cette fonction d'après le corrigé
         */
        mots = mots.sort( (a,b) => a -b);
        if (Syntagme.Fonctions_multiples.includes(f)) {
            if  (f in this._fonctions_multiples) {
                return this._fonctions_multiples[f].filter(e => compare(e,mots)).length > 0;
            }
            return false;
        }
        return compare(this.fonctionPos(f),mots);
    }
    
    * groupes_enchasses() {
        for (let elt of this._groupes_enchasses) {
            yield elt as [[Fonction, number], SyntagmeCorrige]; // TODO FIXME le as ... est sans doute de trop
        }
    }
}

export class SyntagmeEleve extends Syntagme {
    /* Cette classe
     * contient la phrase sélectionnée par l'utilisateur,
     * ainsi que toutes les fonctions de la phrase trouvées
     * par l'utilisateur.
     * Elle contient en outre la correction.
     */
    constructor(phrase: string, private _corrige: SyntagmeCorrige) {
        super(phrase, _corrige.mots_pos);
        this._corrige = _corrige;
    }

    cree_groupe_enchasse_eleve(corrige: SyntagmeCorrige, f: Fonction, numero:number): SyntagmeEleve { 
        const n = new SyntagmeEleve(this.contenu, corrige);
        this._groupes_enchasses.set([f,numero], n);
        n._denomination = [f, numero];
        n._parent = this;
        return n;
    }

    get corrige (): SyntagmeCorrige {
        return this._corrige;
    }

    est_complet(f: Fonction): boolean { // TODO
        /* vrai si f, qui est une fonction multiple,
         * correspond exactement au corrigé
         */
        // TODO ajouter un assert pour les fonctions multiples ?

        const corrige_nombre = this.corrige.fonctions_multiples_nombre(f);
        if (corrige_nombre !== this.fonctions_multiples_nombre(f)) {
            return false;
        }

        const fp = this._fonctions_multiples[f];

        for (let i = 0; i < corrige_nombre; i++) {
            const mp = this.corrige.fonctionPos(f,i);
            const r = fp.filter(e => compare(e, mp)).length;
            if (r === 0) {
                return false;
            }
        }
        return true;
    }

    est_correct(f: Fonction, n: number = -1): boolean {
        /* vrai si la fonction correspond au corrigé.
         */
        if (Syntagme.Fonctions_multiples.includes(f)) {
            assert(f in this._fonctions_multiples, `${f} n'a jamais été enregistré dans ce syntagme`);
            assert(n < this._fonctions_multiples[f].length, `Pas de numero ${n} pour la fonction ${f} dans ce syntagme`);
            return this.corrige.estFonction(f, this._fonctions_multiples[f][n]);
        }
        if (f === "verbes") {
            return this.corrige.estFonction(f, this.verbes)
        }
        assert(f in this._fonctions_uniques, `${f} n'a pas été enregistré dans ce syntagme`);
        return this.corrige.estFonction(f, this._fonctions_uniques[f]);
    }

    declare(f: Fonction, elt: MotsPos, n:number = -1): boolean { // TEST TODO à vérifier pour les fonctions multiples
        /* Enregistre une fonction pour cette phrase.
         * Vrai si elt a bien cette fonction
         * d'après le corrigé
         * Si la fonction est multiple, renvoie false
         * si la fonction a déjà été déclarée correctement
         */
        if (Syntagme.Fonctions_multiples.includes(f) && f in this._fonctions_multiples) {
            if (this._fonctions_multiples[f].filter(e => compare(e, elt)).length !== 0) {
                return false;
            }
        }
        this.declareFonction(f, elt, n);
        return this.corrige.estFonction(f, elt);
    }

}

interface SyntagmeJSON {
    phrase?: string;
    _mots_pos?: MotsPos;
    verbes?: MotsPos;
    _fonctions_uniques: { [id: string] : MotsPos|undefined};
    _fonctions_multiples?: { [id: string] : MultiMotsPos|undefined};
    _groupes_enchasses?: Map<[string, number], Syntagme>;
    _manipulations?: { [id: string] : ManipulationInfo};
}

// TODO probablement à déplacer
interface ManipulationInfo {
    est_anime?: boolean;
    pronominalisation?: string | null;
    verbe?: string;
    preposition?: string;
}

