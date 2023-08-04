import './general.css';
import './choix_phrase.css';
import './modal.css';
import { anime_disparition_modal, byID, cree_html_element, non_null } from './util';
import { affiche_phrase, dispose } from './affichage_phrase';
import { add_events_listener, nouvelle_phrase, retirer_elements_nouvelle_phrase } from './nouvelle_phrase';
import { charge_phrases } from './charge_phrases';
import { Fonction, GroupeEnchasseCorrige, GroupeEnchasseEleve, PhraseCorrigee, PhraseEleve } from './phrase';
import { fonctions_communes } from './fonctions_partagees';
import consignes from './consignes.json';

function analyse_phrase(phrase_corrigee: PhraseCorrigee): void {
    let phrase_eleve = new PhraseEleve(phrase_corrigee.contenu, phrase_corrigee);

    analyse_fonction_requise(0, phrase_eleve, phrase_eleve, []);

}

function analyse_fonction_requise(etape: number, syntagme_eleve: PhraseEleve|GroupeEnchasseEleve, phrase_eleve: PhraseEleve, groupes_enchasses_gen:Generator<[[Fonction, number], GroupeEnchasseCorrige], void, unknown>[], fm_index = -1): void {
    const fonction: Fonction = consignes[etape][0] as Fonction;

    if (PhraseEleve.Fonctions_multiples.includes(fonction) && fm_index === -1) {
        fm_index = 0;
    }

    const consigne = consignes[etape][1] + (fm_index >= 0 ? ` (${fm_index + 1})` : "");

    function analyse_suivante ():void {
        if (etape === consignes.length -1) {
            // on passe aux groupes enchâssés
            let groupe_enchasse_gen = syntagme_eleve.corrige.groupes_enchasses();
            groupes_enchasses_gen.push(groupe_enchasse_gen);
            for (let i = groupes_enchasses_gen.length - 1; i >= 0; i--) {
                let rv = groupes_enchasses_gen[i].next();
                if (rv.done === false) {
                    const [[f, n], groupe_enchasse] = rv.value;
                    return analyse_fonction_requise(0, syntagme_eleve.cree_groupe_enchasse_eleve(groupe_enchasse , f, n), phrase_eleve, groupes_enchasses_gen);
                } else {
                    groupes_enchasses_gen.pop();
                }
            }
            return analyse_finie();
        } else {
            const j = PhraseEleve.Fonctions_multiples.includes(fonction) && !syntagme_eleve.est_complet(fonction) ? 0 : 1;
            fm_index = j === 0 ? fm_index + 1 : -1;
            return analyse_fonction_requise(etape + j, syntagme_eleve, phrase_eleve, groupes_enchasses_gen, fm_index);
        }
    }

    if (!syntagme_eleve.corrige.aFonction(fonction)) {
        // TODO demander d'abord à l'élève de trouver les fonctions? ou bien au fur et à mesure ?
        return analyse_suivante();
    }
    byID("consigne-container").innerHTML = `${consigne}`;
    byID("phrase-analyse-paragraphe").innerHTML = affiche_phrase(phrase_eleve, phrase_eleve.mots_pos);
    dispose(byID("phrase-analyse-paragraphe"), phrase_eleve.profondeur+1);


    fonctions_communes.fonction_de_validation = () => {
        const mots_selectionnes = Array.from(document.getElementsByClassName("phrase-selectionne"))
                              .map(elt => Number(elt.id.split('-')[2]));
        
        let reponse_correcte = (mots_selectionnes.length === 0) ? 
            !syntagme_eleve.corrige.aFonction(fonction) :
            syntagme_eleve.declare(fonction, mots_selectionnes, fm_index);
        if (!reponse_correcte) {
            const modal_message = byID("modal-message-contenu");
            modal_message.classList.add("modal-message-erreur");
            // TODO on pourrait peut-être être plus précis et dire s'il manque des mots, par exemple, ou si tous les mots sont faux
            definit_message_modal("Il y a une erreur dans ton analyse !", "Reprendre l'analyse", () => {
                analyse_fonction_requise(etape, syntagme_eleve, phrase_eleve, groupes_enchasses_gen, fm_index);
                modal_message.classList.remove("modal-message-erreur");
                // préselection des mots précédemment choisis
                Array.from(document.getElementsByClassName("phrase-cliquable"))
                    .forEach( elt => {
                        if (mots_selectionnes.includes(Number(elt.id.split('-')[2]))) {
                            elt.classList.add("phrase-selectionne");
                        }
                    });
            });
        } else {
            analyse_suivante();
        }
    };

}

function definit_message_modal(texte: string, bouton: string, fonction: () => void) {
    /* Le texte est affiché dans le modal, le bouton est un texte à afficher dans le bouton
     * la fonction est appelée lorsque le bouton est appuyé, après la disparition du modal
     */
    const modal_message = byID("modal-message");
    const modal_message_contenu = byID("modal-message-contenu-texte");
    const modal_message_bouton = byID("modal-message-bouton");

    modal_message_contenu.innerHTML = texte;
    modal_message_bouton.innerHTML = bouton;
    modal_message.style.display = "block";
    fonction_du_bouton_de_message = () => {
        // disparition du modal puis appel de la fonction suivante
        anime_disparition_modal(
            byID("modal-message-contenu"),
            modal_message);

        fonction();
    };

}

function analyse_finie(): void {
    definit_message_modal("Bravo !", "Commencer une autre analyse", selectionne_phrase);

}

function selectionne_phrase() {
    // Sélection de la phrase et affichage du modal
    const modal = byID("modal-choix-phrase");
    modal.style.display = "block";

    // affichage des phrases à sélectionner
    const phrases = charge_phrases(5,0);
    const html_liste = byID("modal-choix-phrase-liste");
    // réinitialisation de la liste
    html_liste.innerHTML = "";

    for (let i in phrases) {
        const p = phrases[i];
        const html_elt = cree_html_element(html_liste,"li",
                                           {id:`modal-choix-phrase-liste-${i}`});
        html_elt.innerHTML = p.contenu;
        // sélection d'une phrase
        html_elt.addEventListener('click',() => {
            analyse_phrase(phrases[i]);
            anime_disparition_modal(byID("modal-choix-phrase-contenu"), modal);
        });

    }
}

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
    if (e.which === 13) {
        fonctions_communes.fonction_de_validation();
    }
};
// bouton du modal de message: même chose
let fonction_du_bouton_de_message = () => console.log("Problème: aucune fonction définie pour le bouton du message");
byID("modal-message-bouton").addEventListener('click', () => {
    fonction_du_bouton_de_message();
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
        byID("analyse_fichier_input_form").classList.add("has-advanced-upload");
    }
}



// événement après chargement d'un fichier
byID("analyse_fichier_input").addEventListener("change", e => {
    const target = e.target as HTMLInputElement;
    const lecteur = new FileReader();
    const disparition_modal = () => {
        anime_disparition_modal(byID("modal-analyse-fichier-contenu"),byID("modal-analyse-fichier"));
    }
        
    // vérifications
    if (target.files!.length == 0) {
        disparition_modal();
        return definit_message_modal("Pas de fichier chargé.","OK",() => {});
    } 
    const fichier = target.files![0];
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
            analyse_phrase(PhraseCorrigee.fromJSON(json_contenu));
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

});

add_events_listener();

selectionne_phrase();
drag_n_drop();


