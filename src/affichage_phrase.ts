/* Ce module contient tout ce qui est nécessaire
 * à l'affichage de la phrase dans le navigateur.
 */
import './affichage_phrase.css';

import { Fonction, FonctionEnchassee, PhraseEleve } from "./phrase";

function renvoie_crochet(f: Fonction, est_crochet_ouvrant: boolean): string {
    /*
     * Renvoie un crochet si f le requiert.
     * le crochet est ouvrant si est_crochet_ouvrant est true
     * Sinon, renvoie une string vide
     */
    const fonctions_a_crochets = [ "sujet", "groupe_verbal" ];
    if (fonctions_a_crochets.includes(f)) {
        return est_crochet_ouvrant ? "[" : "]";
    } else {
        return "";
    }
}

function debut_balise(fe: FonctionEnchassee, pos: number): string {
    /* Commence ou finit une balise span si la position (pos)
     * est au début ou à la fin de 'fe'
     * Ajoute un crochet en début de groupe si nécessaire
     */
    // si la fonction est un verbe (pas un verbe principal),
    // alors il faut forcément renvoyer la balise: en effet, les différents verbes
    // ne sont pas forcément les uns à côté des autres
    if (pos == fe[1] || fe[0] === "verbes") {
        const crochet = renvoie_crochet(fe[0], true);
        return `${crochet}<span class="phrase-${fe[0]}">`;
    }
    return "";
}
function fin_balise(fe: FonctionEnchassee, pos: number): string {
    /* Même fonction que debut_balise, mais pour la fin
     * Ajoute un crochet en fin de groupe
     */
    // même commentaire pour les verbes que dans la fonction debut_balise
    if (pos == fe[2] || fe[0] === "verbes") {
        const crochet = renvoie_crochet(fe[0], false);
        return `</span>${crochet}`;
    }
    return "";
}


export function affiche_phrase(phrase: PhraseEleve) : string {
    // découpage de la phrase en constituants
    // cette regex permet de conserver le séparateur
    const reg = new RegExp("(" + PhraseEleve.Separateur + ")");
    const phrase_coupee = phrase.contenu.split(reg);


    // compteur de mots
    let i = 0;
    // array à renvoyer avant transformation en string
    let rv_array: string[] = [];

    for (const elt of phrase_coupee) {
        if (PhraseEleve.Separateur.includes(elt)) {
            rv_array.push(elt);
            continue;
        }
        const fonctions_elt = phrase.fonction_detaillee(i);
        fonctions_elt.forEach( fe => rv_array.push(debut_balise(fe,i)));
        rv_array.push(`<span class="phrase-cliquable" id="phrase-mot-${i}">${elt}</span>`);
        fonctions_elt.forEach( fe => rv_array.push(fin_balise(fe,i)));
        // incrémentation à la fin
        i+=1;
    }
    return rv_array.join("");

}
