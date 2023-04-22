import './general.css';
import './choix_phrase.css';
import './modal.css';
import { anime_disparition_modal, cree_html_element, non_null } from './util';
import { affiche_phrase } from './affichage_phrase';
import { charge_phrases } from './charge_phrases';
import { Fonction, PhraseCorrigee, PhraseEleve } from './phrase';
import consignes from './consignes.json';

function analyse_phrase(phrase_corrigee: PhraseCorrigee): void {
    let phrase_eleve = new PhraseEleve(phrase_corrigee.contenu, phrase_corrigee);

    analyse_fonction_requise(0, phrase_eleve);

}

function analyse_fonction_requise(etape: number, phrase_eleve: PhraseEleve): void {
    const [fonction, consigne] = consignes[etape];
    non_null(document.getElementById("consigne-container")).innerHTML = `${consigne}`;
    non_null(document.getElementById("phrase-analyse-paragraphe")).innerHTML = affiche_phrase(phrase_eleve);
    for (const elt of document.getElementsByClassName("phrase-cliquable")) {
        elt.addEventListener('click', () => {
            elt.classList.toggle("phrase-selectionne");
        });
    }

    fonction_de_validation = () => {
        const mots_selectionnes = Array.from(document.getElementsByClassName("phrase-selectionne"))
                              .map(elt => Number(elt.id.split('-')[2]));
        
        let reponse_correcte = (mots_selectionnes.length === 0) ? 
            !phrase_eleve.corrige.aFonction(fonction as Fonction) :
            phrase_eleve.declare(fonction as Fonction, mots_selectionnes);
        if (!reponse_correcte) {
            const modal_message = non_null(document.getElementById("modal-message-contenu"));
            modal_message.classList.add("modal-message-erreur");
            // TODO on pourrait peut-être être plus précis et dire s'il manque des mots, par exemple, ou si tous les mots sont faux
            definit_message_modal("Il y a une erreur dans ton analyse !", "Reprendre l'analyse", () => {
                analyse_fonction_requise(etape, phrase_eleve);
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
            if (etape === consignes.length -1) {
                analyse_finie();
            } else {
                analyse_fonction_requise(etape + 1, phrase_eleve);
            }
        }
    };

}

function definit_message_modal(texte: string, bouton: string, fonction: () => void) {
    /* Le texte est affiché dans le modal, le bouton est un texte à afficher dans le bouton
     * la fonction est appelée lorsque le bouton est appuyé, après la disparition du modal
     */
    const modal_message = non_null(document.getElementById("modal-message"));
    const modal_message_contenu = non_null(document.getElementById("modal-message-contenu-texte"));
    const modal_message_bouton = non_null(document.getElementById("modal-message-bouton"));

    modal_message_contenu.innerHTML = texte;
    modal_message_bouton.innerHTML = bouton;
    modal_message.style.display = "block";
    fonction_du_bouton_de_message = () => {
        // disparition du modal puis appel de la fonction suivante
        anime_disparition_modal(
            non_null(document.getElementById("modal-message-contenu")),
            modal_message);

        fonction();
    };

}

function analyse_finie(): void {
    definit_message_modal("Bravo !", "Commencer une autre analyse", selectionne_phrase);

}

function selectionne_phrase() {
    // Sélection de la phrase et affichage du modal
    const modal = non_null(document.getElementById("modal-choix-phrase"));
    modal.style.display = "block";

    // affichage des phrases à sélectionner
    const phrases = charge_phrases(5,0);
    const html_liste = non_null(document.getElementById("modal-choix-phrase-liste"));
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
            anime_disparition_modal(non_null(document.getElementById("modal-choix-phrase-contenu")), modal);
        });

    }
}

// bouton valider: évenement qui change pour éviter de surcharger le click sur le bouton
let fonction_de_validation  = () => console.log("Problème: la validation n'a pas été mise en place");
non_null(document.getElementById("bouton-valider")).addEventListener('click', () => {
    fonction_de_validation();
});
// bouton du modal de message: même chose
let fonction_du_bouton_de_message = () => console.log("Problème: aucune fonction définie pour le bouton du message");
non_null(document.getElementById("modal-message-bouton")).addEventListener('click', () => {
    fonction_du_bouton_de_message();
});

selectionne_phrase();


