const canvas = document.createElement("canvas");

export function compare<T>(a: T[], b: T[]): boolean { // TEST
    /* Vrai si a et b sont égaux
     */
    // Tim Down: http://stackoverflow.com/a/7837725/308645
    let i = a.length;
    if (i != b.length) {
        return false;
    }

    while (i--) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

export function non_null<T>(elt: T | null): T { // TEST
    /* Vérifie que elt n'est pas null
     * Si elt est null, renvoie une erreur
     * sinon, renvoie l'objet
     */
    if (elt === null) {
        throw TypeError("elt is null");
    } else {
        return elt;
    }
}

export function cree_html_element(
    parent: HTMLElement, 
    balise: string, 
    attributs: {[id : string]: string} = {})
        : HTMLElement {
    /* Crée un élément enfant de parent et lui donne les attributs donnés.
     */
    let elt = document.createElement(balise);
    parent.appendChild(elt);
    Object.entries(attributs).forEach(
            ([key, value],/*index est enlevé ici: attention au comma*/ ) => elt.setAttribute(key, value)
        );
    return elt;
}

export function anime_disparition_modal(elt: HTMLElement, parent: HTMLElement) : void {
    /* Fait l'animation définie par CSS pour elt 
     * et fait disparaître parent 
     */
    elt.classList.add("modal-contenu-animation-disparition");

    const f = () => {
        parent.style.display = "none";
        elt.classList.remove("modal-contenu-animation-disparition");
        elt.removeEventListener("animationend",f);
    };
    elt.addEventListener("animationend",f); 

}

export function byID(id: string):HTMLElement {
    return non_null(document.getElementById(id));
}

export function assert(val: boolean, msg: string): void {
    // renvoie une erreur si val est false
    if (val === false) {
        throw Error(msg);
    }
}

export function displayTextWidth(text: string, font: string): number {
  let context = non_null(canvas.getContext("2d"));
  context.font = font;
  let metrics = context.measureText(text);
  return Math.ceil(metrics.width);
}

export function strNoAccent(a:string) {
    /* https://www.equinode.com/fonctions-javascript/retirer-les-accents-avec-javascript
     */
  return a.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function elision (a_elider: string, mot_suivant: string): string {
    /* Gère l'élision d'un mot
     * */
    if (a_elider.slice(-1) !== 'e') {
        throw Error(`${a_elider} ne finit pas par un e`);
    }
    const voyelles = "aeiouy";
    const premiere_lettre = strNoAccent(mot_suivant).slice(0,1).toLowerCase();
    if (voyelles.indexOf( premiere_lettre) === -1) {
        return a_elider + " " + mot_suivant;
    } else {
        return a_elider.slice(0,-1) + "'" + mot_suivant;
    }
}
    
