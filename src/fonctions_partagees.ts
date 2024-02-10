import { Fonction } from "./phrase";
import { anime_disparition_modal, byID } from "./util";
export let x: string[] = Array();
export let fonctions_communes = {
    fonction_de_validation : () => { console.log("Problème: la fonction de validation n'a pas été mise en place");
    },
    ok : () => { console.log("Aucune fonction définie pour OK");
    },
    annuler : () => {console.log("Aucune fonction définie pour Annuler");
    },
    fonction_du_bouton_de_message : () => console.log("Fonction du bouton de message non mise en place")
};

export const liste_des_fonctions: { [nom: string] : Fonction } = {
    "Indépendante" : "independante",
    "Verbes" : "verbes",
    "Verbe noyau" : "verbe_noyau",
    "Sujet" : "sujet",
    "COD" : "cod",
    "COI" : "coi",
    "Attribut du sujet" : "attribut_du_sujet",
    "Attribut du COD" : "attribut_du_cod",
    "Complément du verbe impersonnel" : "complement_du_verbe_impersonnel",
    "Complément d'agent" : "complement_d_agent",
    "Groupe verbal" : "groupe_verbal",
    "Complément circonstanciel" : "complement_circonstanciel",
    "Modalisateur" : "modalisateur",
    "Fonction auto-énonciative" : "auto-enonciative",
    "Connecteur" : "connecteur",
    "Balise textuelle" : "balise_textuelle",
    "Noyau" : "noyau",
    "Épithète" : "epithete",
    "Complément du nom" : "complement_du_nom",
    "Complément du pronom": "complement_du_pronom",
    "Apposition" : "apposition",
    "Complément de l'adjectif": "complement_de_l_adjectif"
    };

export const liste_des_fonctions_inverse : { [nom: string] : string } = Object.fromEntries(Object.entries(liste_des_fonctions).map(a => a.reverse()));

export function definit_message_modal(texte: string, bouton: string, fonction: () => void, croix: boolean = false) {
    /* Le texte est affiché dans le modal, le bouton est un texte à afficher dans le bouton
     * la fonction est appelée lorsque le bouton est appuyé, après la disparition du modal
     */
    const modal_message = byID("modal-message");
    const modal_message_contenu = byID("modal-message-contenu-texte");
    const modal_message_bouton = byID("modal-message-bouton");
    const modal_croix = byID("modal-croix");

    modal_message_contenu.innerHTML = texte;
    modal_message_bouton.innerHTML = bouton;
    modal_message.style.display = "block";
    if (croix) {
        modal_croix.style.display = "block";
    }
    
    fonctions_communes.fonction_du_bouton_de_message = () => {
        // disparition du modal puis appel de la fonction suivante
        anime_disparition_modal(
            byID("modal-message-contenu"),
            modal_message);
        if (croix) {
            modal_croix.style.display = "none";
        }
        fonction();
    };
    fonctions_communes.ok = fonctions_communes.fonction_du_bouton_de_message;

}

