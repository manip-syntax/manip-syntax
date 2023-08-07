import { GroupeEnchasseEleve, PhraseEleve } from "./phrase";
import { byID } from "./util";

export function manipulation_sujet(syntagme: PhraseEleve | GroupeEnchasseEleve, phrase: PhraseEleve) {
    const modal = byID("modal-manipulations");
    modal.style.display = "block";
    byID("modal-manipulations-titre").innerHTML = "Manipule le sujet pour vérifier ta réponse.";
}
