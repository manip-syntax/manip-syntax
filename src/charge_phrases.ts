/* Ce module contient des fonctions permettant de charger les phrases
 * destinées à l'application front-end.
 */

import {PhraseCorrigee} from "./phrase";
// contient les phrases à charger conservées en mémoire.
// TODO faire une limite du nombre de phrases à conserver ?
//let liste_phrases = PhraseCorrigee[];
// TODO implémentation temporaire pour des raisons de test
import __phrases from "./phrases.json"
const phrases = __phrases.map(x=> PhraseCorrigee.fromJSON(x));

export function charge_phrases(max: number, debut: number = 0): PhraseCorrigee[] {
    /* Renvoie une liste contenant au maximum max PhraseCorrigee.
     * debut indique à partir de quel index il faut renvoyer des phrases.
     * si cet index est trop bas (ie, supérieur au nombre de phrases enregistrées)
     * la liste sera vide
     */
    // TODO implémentation temporaire pour des raisons de test
    let rt = phrases
        .slice(debut,debut + max);
    return rt;

}
