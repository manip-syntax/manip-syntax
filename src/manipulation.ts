import { Fonction, MotsPos, SyntagmeEleve } from "./phrase";
import { byID } from "./util";
import './manipulation.css';
import dragula from 'dragula';
import 'dragula/dist/dragula.min.css';
// TODO FIXME attention au problème lié au sujet des verbes à l'impératif (notamment) : revoir le fonctionnement: c'est plus compliqué que ce qui se trouve dans cette page
// C'est à Don Diègue que Il donne un soufflet -> à améliorer
// Aussi : As-tu trouvé le livre ? C'est Tu qui as trouvé le livre.

function cree_champ(titre: string, contenu: string) : string {
    return `<fieldset class="manipulation-element">
                <legend class="manipulation-element-titre">${titre}</legend>
                <span class="manipulation-element-contenu">${contenu}</span>
            </fieldset>`;
}

function cree_suppression(syntagme: SyntagmeEleve, mots_selectionnes: MotsPos): string {
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
    return cree_champ("Suppression", phrase_cassee);
}

function cree_deplacement(syntagme: SyntagmeEleve, mots_selectionnes: MotsPos): string {
    let phrase_cassee = '<span id="dragula-container">';
    for (let p=0; p < syntagme.longueur; p++) {
        console.log("p",p, mots_selectionnes);
        if (mots_selectionnes.indexOf(p) > -1) {
            phrase_cassee += `<span class="dragula-draggable">${syntagme.texte_pos(mots_selectionnes)} </span> `;
            p = mots_selectionnes.length -1;
        }
        else {
            phrase_cassee += `<span class="dragula-dz" >${syntagme.texte_pos([p])}</span> `;
        }
    }

    phrase_cassee += '<span class="dragula-dz"> </span> </span>';

    return cree_champ("Déplacement", phrase_cassee);
}

function recupere_sujet(syntagme: SyntagmeEleve) : string {
    if (syntagme.corrige.aFonction("sujet")) {
        return syntagme.fonction_texte_pos("sujet");
    }
    if (syntagme.corrige.aFonction("verbe_noyau")) {
        const p = syntagme.corrige.infos_de_manipulation("verbe_noyau").pronominalisation;
        if (typeof p !== "string") {
            throw new Error("Impossible de trouver le sujet");
        }
        return p;
    }

    return "";
}


export function manipulation_fonction(f: Fonction, syntagme: SyntagmeEleve, mots_selectionnes: MotsPos) {
    const modal = byID("modal-manipulations");
    modal.style.display = "block";
    const fonction_nom = 
    { sujet: "le sujet" ,
      attribut_du_sujet: "l'attribut du sujet",
      cod: "le COD",
      coi: "le COI",
      groupe_verbal: "le groupe verbal",
      complement_circonstanciel: "le complément circonstanciel"
    }[f as string];

    byID("modal-manipulations-titre").innerHTML = `Manipule ${fonction_nom} pour vérifier ta réponse.`;
    // réinitialisation du contenu du modal
    byID("manipulations-form-contenu").innerHTML = "";
    byID("manipulable").innerHTML = syntagme.texte_pos(mots_selectionnes);
    byID("manipulable").style.visibility = "visible"; // au cas où un CC l'aurait caché
    const verbe = syntagme.fonction_texte_pos("verbe_noyau");
    const drop_zone = `<span class="manipulation-drop-zone">Glisse ${fonction_nom} ici</span>`;
    const fleche = `
            <span class="manipulation-fleche">
    <svg fill="#000000" height="36px" width="100px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
             viewBox="0 0 476.213 476.213" xml:space="preserve">
    <polygon points="345.606,107.5 324.394,128.713 418.787,223.107 0,223.107 0,253.107 418.787,253.107 324.394,347.5 
            345.606,368.713 476.213,238.106 "/>
    </svg> </span>`

    if (f === "sujet") {
        const derriere_verbe = " " +
        function () { if (syntagme.corrige.aFonction("attribut_du_sujet")) {
            return syntagme.fonction_texte_pos("attribut_du_sujet");
        } else if (syntagme.corrige.aFonction("cod")) {
            return syntagme.fonction_texte_pos("cod");
        }
        return "";
        }();

        const infos_de_manipulation = syntagme.corrige.infos_de_manipulation("sujet");
        const pronom_interrogatif = infos_de_manipulation.est_anime ? "Qui " : "Qu'";
        const select_pronom = "Je Tu Il Elle Nous Vous Ils Elles C' Ce Cela".split(" ").map( e => `<option value="${e.toLowerCase()}">${e}</option>`).join(" ");
        byID("manipulations-form-contenu").innerHTML = `<fieldset class="manipulation-element"><legend class="manipulation-element-titre">Question</legend><span class="manipulation-element-contenu">${pronom_interrogatif}est-ce qui ${verbe}${derriere_verbe} ? ${drop_zone}</span></fieldset>` +
            `<fieldset class="manipulation-element"><legend class="manipulation-element-titre">Extraction</legend><span class="manipulation-element-contenu">C'est ${drop_zone} qui ${verbe}${derriere_verbe}. </span></fieldset>` +
            (infos_de_manipulation.pronominalisation === null ? "" : 
            '<fieldset class="manipulation-element"><legend class="manipulation-element-titre">Pronominalisation</legend>' +
            `<span class="manipulation-element-contenu">${syntagme.texte_pos(mots_selectionnes)} ${verbe}${derriere_verbe}. ${fleche}
        <select name="pronoms"><option disabled selected value>--</option>${select_pronom}</select> ${verbe}${derriere_verbe}.</span></fieldset>`);

    } else if (f === "cod") {
        const sujet = recupere_sujet(syntagme);
        const attr_cod = syntagme.corrige.aFonction("attribut_du_cod") ? " " + syntagme.fonction_texte_pos("attribut_du_cod") : "";
        const infos_de_manipulation = syntagme.corrige.infos_de_manipulation("cod");
        const pronom_interrogatif = infos_de_manipulation.est_anime ? "Qui " : "Qu'";
        const select_pronom = "le la l' les me m' te t' nous vous en".split(" ").map( e => `<option value="${e.toLowerCase()}">${e}</option>`).join(" ");
        byID("manipulations-form-contenu").innerHTML = cree_champ("Question",`${pronom_interrogatif}est-ce que ${sujet} ${verbe}${attr_cod} ? ${drop_zone}`) + 
            cree_champ("Extraction", `C'est ${drop_zone} que ${sujet} ${verbe}${attr_cod}.`) +
            cree_champ("Pronominalisation",`${sujet} ${verbe} ${syntagme.texte_pos(mots_selectionnes)}${attr_cod} ${fleche} ${sujet} <select name="pronoms"><option disabled selected value>--</option>${select_pronom}</select> ${verbe}${attr_cod}.`);

    } else if (f === "coi") {
        const sujet = recupere_sujet(syntagme);
        const cod = syntagme.corrige.aFonction("cod") ? " " + syntagme.fonction_texte_pos("cod") : "";
        const infos_de_manipulation = syntagme.corrige.infos_de_manipulation("coi");
        const preposition = infos_de_manipulation.preposition;
        const pronom_interrogatif = preposition + " " +infos_de_manipulation.est_anime ? "qui " : "quoi";
        const select_pronom = "lui leur me moi m' te t' toi en y".split(" ").map( e => `<option value="${e.toLowerCase()}">${e}</option>`).join(" ");
        byID("manipulations-form-contenu").innerHTML = cree_champ("Question", `${sujet} ${verbe}${cod} ${preposition} ${pronom_interrogatif} ? ${drop_zone}`) +
            cree_champ("Extraction", `C'est ${drop_zone} que ${sujet} ${verbe}${cod}.`) +
            cree_champ("Pronominalisation",`${sujet} ${verbe}${cod} ${preposition} ${syntagme.texte_pos(mots_selectionnes)} ${fleche} ${sujet} <select name="pronoms"><option disabled selected value>--</option>${select_pronom}</select> ${verbe}${cod}.`);

    } else if (f === "groupe_verbal") {
        const sujet = recupere_sujet(syntagme);
        const infos_de_manipulation = syntagme.corrige.infos_de_manipulation("groupe_verbal");
        const verbe = infos_de_manipulation.verbe;
        byID("manipulations-form-contenu").innerHTML = cree_champ("Question", `Que ${verbe} ${sujet} ? ${sujet} ${drop_zone}`);

    } else if (f === "attribut_du_sujet") {
        const sujet = recupere_sujet(syntagme);
        byID("manipulations-form-contenu").innerHTML = cree_champ("Question",`${sujet} ${verbe} quoi ? ${drop_zone}`) + 
            cree_suppression(syntagme, mots_selectionnes);

    } else if (f === "complement_circonstanciel") {
        byID("manipulations-form-contenu").innerHTML = cree_suppression(syntagme, mots_selectionnes) +
            cree_deplacement(syntagme, mots_selectionnes);
        //cree_evenements_deplacements();
        byID("manipulable").style.visibility = "collapse";
        dragula([byID("dragula-container") ],
                {
                    moves: function (el, _source, _handle) {
                        if (el === undefined) {
                            throw Error("el is undefined");
                        }
                        return el.className !== 'dragula-dz';
                      },
              accepts: function (_el, _target, _source, sibling) {
                        if (sibling === undefined) {
                            throw Error("sibling is undefined");
                        }
                        return sibling === null || sibling.className === "dragula-dz";
                      }
                });
    }

    for (let supprimable of document.getElementsByClassName("manipulation-supprimable")) {
        supprimable.addEventListener('click', () => {
            supprimable.classList.remove("manipulation-supprimable");
            supprimable.classList.add("manipulation-supprime");
        });
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
    // TODO vérifier la pronominalisation
}

export function manipulation_faite(): boolean {
    /* true si toutes les manipulations présentes ont été faites par l'élève
     */
    const length = (s: string) => document.querySelectorAll(s).length;
    // y a-t-il une pronominalisation ?
    const pronoms = document.getElementsByName("pronoms");
    for (const elt of pronoms) {
        if ((elt as HTMLSelectElement).value === "") {
            return false;
        }
    }
    // y a-t-il des déplaçables ?
    console.log(length(".manipulation-element-contenu"),length(".manipulable-deplace"));
    if (length(".manipulation-drop-zone") > 0) {
        return false;
    }

    if (document.querySelectorAll(".manipulation-deplacable").length !== document.querySelectorAll(".manipulation-deplace").length) {
        return false;
    }

    // y a-t-il des supprimables ?
    if (length(".manipulation-supprimable") > 0) {
        return false;
    }
    return true;
}

byID("manipulable").addEventListener("dragstart", (e) => {
    if (e.dataTransfer !== null) {
        e.dataTransfer.setData("text/plain",(e.target as HTMLElement).id);
        e.dataTransfer.dropEffect = "copy";
    }
});


