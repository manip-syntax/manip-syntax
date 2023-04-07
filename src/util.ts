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
    
