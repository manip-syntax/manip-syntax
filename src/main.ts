import './general.css';
import './choix_phrase.css';
import './modal.css';
import { anime_disparition_modal, byID, non_null } from './util';
import { add_events_listener, nouvelle_phrase, retirer_elements_nouvelle_phrase } from './nouvelle_phrase';
import { SyntagmeCorrige} from './phrase';
import { definit_message_modal, fonctions_communes } from './fonctions_partagees';
import {analyse_phrase, selectionne_phrase} from './analyse_eleve';
/* TODO FIXME
 * - affichage et correction des infos de manipulation (nouvelle phrase)
 * - limiter davantage les choix selon les choix précédents dans la nouvelle phrase
 * - si chevauchement du nom de deux fonctions, faire disparaître avec des points de suspension et avec un :hover, montrer ce qui manque
 * - afficher les numéros de sfonctions multiples ?
 * - c'est il qui donner un soufflet -> c'est lui... (manipulation)
 * - attention au que il... (manipulation)
 * - proposer aux élèves de déterminer eux-mêmes quelles fonctions sont présentes dans la phrase.
 * - par rapport aux groupes enchassés, une méthode plus efficace pourrait consister à leur faire trouver tout le groupe après avoir trouvé ses éléments
 *   Auquel cas, il faudrait changer complètement d'approche (actuellement, on trouve l'ensemble du groupe et ensuite ses éléments)
 */


// sélection des mots
// // variable globale (bouh!!!!)
let selection_active = false;
const phrase_analyse_paragraphe = byID("phrase-analyse-paragraphe");
phrase_analyse_paragraphe.addEventListener('mousedown', e => {
    const target = e.target as Element;
    if (e.button != 0 || !target.classList.contains("phrase-cliquable")) {
        return;
    }
    selection_active = true;
    target.classList.toggle("phrase-selectionne");
});
phrase_analyse_paragraphe.addEventListener('mouseover', e => {
    // TODO bug: si on repasse trop vite ou trop lentement, on déselectionne/sélectionne plusieurs fois ce qui est désagréable et peu pratique
    const target = e.target as Element;
    if (selection_active && target.classList.contains("phrase-cliquable")) {
        target.classList.toggle("phrase-selectionne");
    }
});
phrase_analyse_paragraphe.addEventListener('mouseup', _ => {
    selection_active = false;
});

// bouton valider: évenement qui change pour éviter de surcharger le click sur le bouton
//let fonctions_communes.fonction_de_validation  = () => console.log("Problème: la validation n'a pas été mise en place");
byID("bouton-valider").addEventListener('click', () => {
    fonctions_communes.fonction_de_validation();
});
// raccourci : appuyer sur entrée fait la même chose que d'appuyer sur valider
// TODO si un modal avec un bouton "ok" est en place, appuyer sur ce bouton à la place
document.onkeyup = function (e) {
    switch (e.which) {
        case 13:
            fonctions_communes.ok();
        break;
        case 27:
            fonctions_communes.annuler();
        break;
    }
};
// bouton du modal de message: même chose
byID("modal-message-bouton").addEventListener('click', () => {
    fonctions_communes.fonction_du_bouton_de_message();
});

// Nouvelle phrase
byID("nouvelle_phrase").addEventListener('click', () => {
    nouvelle_phrase();
});

// analyse depuis un fichier
byID("analyse_fichier").addEventListener('click', () => {
    for (const modal of non_null(document.getElementsByClassName("modal")) as HTMLCollectionOf<HTMLElement>) {
        modal.style.display = "none";
    }
    retirer_elements_nouvelle_phrase(); // peut être nécessaire dans certains cas
    byID("modal-analyse-fichier").style.display = "block";
});

function drag_n_drop() {
    const drag_n_drop_possible = () => {
      var div = document.createElement('div');
      return (('draggable' in div) || ('ondragstart' in div && 'ondrop' in div)) && 'FormData' in window && 'FileReader' in window;
    };

    if (drag_n_drop_possible()) {

        const form = byID("analyse_fichier_input_form");
        form.classList.add("has-advanced-upload");
        byID("analyse_fichier_bouton").style.display = "none";

        "drag dragstart dragend dragover dragenter dragleave drop".split(" ").forEach( event => {
            form.addEventListener(event, (e) => {
                e.preventDefault();
                e.stopPropagation();
            })
        });

        ["dragover","dragenter"].forEach( e => {
            form.addEventListener(e, () => form.classList.add("is-dragover"));
        });
        ["dragleave","dragend","drop"].forEach( e => {
            form.addEventListener(e, () => form.classList.remove("is-dragover"));
        });

    }
    else {
        byID("analyse_fichier_input").classList.remove("box__file");
    }
}



// événement après chargement d'un fichier
function  charge_fichier (files: FileList) {
    const lecteur = new FileReader();
    const disparition_modal = () => {
        anime_disparition_modal(byID("modal-analyse-fichier-contenu"),byID("modal-analyse-fichier"));
    }
        
    // vérifications
    if (files!.length == 0) {
        disparition_modal();
        return definit_message_modal("Pas de fichier chargé.","OK",() => {});
    } 
    const fichier = files![0];
    if (!((fichier.type ? fichier.type : "Introuvable").includes("json"))) {
        disparition_modal();
        return definit_message_modal("Format invalide","OK",() => {});
    }

    lecteur.addEventListener('load', (_) => {
        const json_contenu = lecteur.result ?? "";
        if (typeof json_contenu !== "string" || json_contenu === "") {
            disparition_modal();
            return definit_message_modal("Fichier invalide","OK",() => {});
        }

        try {
            analyse_phrase(SyntagmeCorrige.fromJSON(json_contenu));
        } catch (e) {
            console.log(e);
            disparition_modal();
            if (e instanceof TypeError) {
                return definit_message_modal("Ce fichier n'est pas compatible avec la version actuelle du programme.", "OK", () => {});
            }
            return definit_message_modal("Fichier invalide", "OK", () => {});
        }
        disparition_modal();
    });
    lecteur.readAsText(fichier);

}
byID("analyse_fichier_input").addEventListener("change", e => {
    const target = e.target as HTMLInputElement;
    charge_fichier(target.files as FileList);
});
byID("analyse_fichier_input_form").addEventListener("drop", e => {
    charge_fichier(e.dataTransfer?.files as FileList);
});

byID("modal-croix").addEventListener("click", _ => {
    anime_disparition_modal(
        byID("modal-message-contenu"),
        byID("modal-message")
    );
    byID("modal-croix").style.display = "none";
    fonctions_communes.fonction_de_validation = () => {};
    const b_valider = byID("bouton-valider");
    b_valider.classList.replace("boutons-analyse-valider","boutons-analyse-desactive");
    b_valider.classList.remove("bouton-actif");
});

add_events_listener();

selectionne_phrase();
drag_n_drop();



