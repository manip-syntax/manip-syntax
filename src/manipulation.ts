import { SyntagmeEleve } from "./phrase";
import { byID } from "./util";

export function manipulation_sujet(syntagme: SyntagmeEleve, phrase: SyntagmeEleve) {
    const modal = byID("modal-manipulations");
    modal.style.display = "block";
    byID("modal-manipulations-titre").innerHTML = "Manipule le sujet pour vérifier ta réponse.";
}
