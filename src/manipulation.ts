import { MotsPos, SyntagmeEleve } from "./phrase";
import { byID } from "./util";
import './manipulation.css';

export function manipulation_sujet(syntagme: SyntagmeEleve, mots_selectionnes: MotsPos) {
    const modal = byID("modal-manipulations");
    modal.style.display = "block";
    byID("modal-manipulations-titre").innerHTML = "Manipule le sujet pour vérifier ta réponse.";
    byID("manipulable").innerHTML = syntagme.texte_pos(mots_selectionnes);
    const infos_de_manipulation = syntagme.corrige.infos_de_manipulation("sujet");
    const verbe = syntagme.fonction_texte_pos("verbe_noyau");
    const pronom_interrogatif = infos_de_manipulation.est_anime ? "Qui " : "Qu'";
    const drop_zone = '<span class="manipulation-drop-zone">Glisse le sujet ici</span>';
    const select_pronom = "Je Tu Il Elle Nous Vous Ils Elles".split(" ").map( e => `<option value="${e.toLowerCase()}">${e}</option>`).join(" ");
    byID("manipulations-form-contenu").innerHTML = `<div class="manipulation-element"><span class="manipulation-element-titre">Question</span><span class="manipulation-element-contenu">${pronom_interrogatif}est-ce qui ${verbe} ? ${drop_zone}</span></div>` +
        `<div class="manipulation-element"><span class="manipulation-element-titre">Extraction</span><span class="manipulation-element-contenu">C'est ${drop_zone} qui ${verbe}. </span></div>` +
        '<div class="manipulation-element"><span class="manipulation-element-titre">Pronominalisation</span>' +
        `<span class="manipulation-element-contenu">${syntagme.texte_pos(mots_selectionnes)} ${verbe}<span class="manipulation-fleche"> </span> <select name="pronoms">${select_pronom}</select> ${verbe}</span></div>`;
}
