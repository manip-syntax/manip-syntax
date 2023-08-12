import { Fonction, MotsPos, SyntagmeEleve } from "./phrase";
import { byID } from "./util";
import './manipulation.css';

function cree_champ(titre: string, contenu: string) : string {
    return `<fieldset class="manipulation-element">
                <legend class="manipulation-element-titre">${titre}</legend>
                <span class="manipulation-element-contenu">${contenu}</span>
            </fieldset>`;
}

export function manipulation_fonction(f: Fonction, syntagme: SyntagmeEleve, mots_selectionnes: MotsPos) {
    const modal = byID("modal-manipulations");
    modal.style.display = "block";
    const fonction_nom = f === "sujet" ? "le sujet":"l'attribut du sujet"
    byID("modal-manipulations-titre").innerHTML = `Manipule ${fonction_nom} pour vérifier ta réponse.`;
    byID("manipulable").innerHTML = syntagme.texte_pos(mots_selectionnes);
    const verbe = syntagme.fonction_texte_pos("verbe_noyau");
    const drop_zone = `<span class="manipulation-drop-zone">Glisse ${fonction_nom} ici</span>`;

    if (f === "sujet") {
        const infos_de_manipulation = syntagme.corrige.infos_de_manipulation("sujet");
        const pronom_interrogatif = infos_de_manipulation.est_anime ? "Qui " : "Qu'";
        const select_pronom = "Je Tu Il Elle Nous Vous Ils Elles".split(" ").map( e => `<option value="${e.toLowerCase()}">${e}</option>`).join(" ");
        byID("manipulations-form-contenu").innerHTML = `<fieldset class="manipulation-element"><legend class="manipulation-element-titre">Question</legend><span class="manipulation-element-contenu">${pronom_interrogatif}est-ce qui ${verbe} ? ${drop_zone}</span></fieldset>` +
            `<fieldset class="manipulation-element"><legend class="manipulation-element-titre">Extraction</legend><span class="manipulation-element-contenu">C'est ${drop_zone} qui ${verbe}. </span></fieldset>` +
            '<fieldset class="manipulation-element"><legend class="manipulation-element-titre">Pronominalisation</legend>' +
            `<span class="manipulation-element-contenu">${syntagme.texte_pos(mots_selectionnes)} ${verbe}.<span class="manipulation-fleche">
    <svg fill="#000000" height="36px" width="100px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
             viewBox="0 0 476.213 476.213" xml:space="preserve">
    <polygon points="345.606,107.5 324.394,128.713 418.787,223.107 0,223.107 0,253.107 418.787,253.107 324.394,347.5 
            345.606,368.713 476.213,238.106 "/>
    </svg>
        </span> <select name="pronoms">${select_pronom}</select> ${verbe}</span></fieldset>`;
    } else if (f === "attribut_du_sujet") {
        const sujet = syntagme.fonction_texte_pos("sujet");
        const attr_offset = syntagme.offset_pos(mots_selectionnes);
        let phrase_cassee = "";
        for (let i=0, j=0; i <syntagme.contenu.length ; i++) {
            if (i === attr_offset[j][0]) {
                phrase_cassee += '<span class="manipulation-supprimable">';
            }
            else if (i === attr_offset[j][1]) {
                phrase_cassee += '</span>';
                if (j < attr_offset.length - 1) { 
                    j++;
                }
            }
            phrase_cassee += syntagme.contenu[i];
        }
        byID("manipulations-form-contenu").innerHTML = 
        cree_champ("Question",`${sujet} ${verbe} quoi ? ${drop_zone}`) + 
        cree_champ("Suppression",phrase_cassee);

        for (let supprimable of document.getElementsByClassName("manipulation-supprimable")) {
            supprimable.addEventListener('click', () => {
                supprimable.classList.remove("manipulation-supprimable");
                supprimable.classList.add("manipulation-supprime");
            });
        }
    }

    for (const elt of document.getElementsByClassName("manipulation-drop-zone")) {
        elt.addEventListener("dragover", (ev) => {
            const e = ev as DragEvent;
            if (e.dataTransfer === null) {
                throw Error("Pas de données transférées");
            }
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
        });
        elt.addEventListener("drop", (ev) => {
            const e = ev as DragEvent;
            if (e.dataTransfer === null) {
                throw Error("Pas de données transférées");
            }
            e.preventDefault();
            const element_deplace = byID(e.dataTransfer.getData("text/plain")).innerHTML;
            let target = (e.target as HTMLElement)
            target.innerHTML = element_deplace;
            target.classList.add("manipulable-deplace");
            target.classList.remove("manipulation-drop-zone");
        });
    }
    // TODO interdire de valider tant que chaque manipulation n'aura pas été faite.
    // TODO vérifier la pronominalisation
}

byID("manipulable").addEventListener("dragstart", (e) => {
    if (e.dataTransfer !== null) {
        e.dataTransfer.setData("text/plain",(e.target as HTMLElement).id);
        e.dataTransfer.dropEffect = "copy";
    }
});

