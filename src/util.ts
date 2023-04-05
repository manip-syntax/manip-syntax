export function compare<T>(a: T[], b: T[]): boolean {
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
