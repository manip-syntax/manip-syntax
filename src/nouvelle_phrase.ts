import { affiche_phrase } from './affichage_phrase';
import { Fonction, PhraseCorrigee, PhraseEleve } from './phrase';
import { non_null } from './util';
import consignes from './consignes.json';

// Nouvelle phrase: bouton ok
let fonction_du_bouton_de_nouvelle_phrase = () => console.log("Problème: aucune fonction définie pour le bouton OK de la nouvelle phrase");
non_null(document.getElementById("modal-nouvelle_phrase-bouton")).addEventListener('click', () => {
    fonction_du_bouton_de_nouvelle_phrase();
});

export function nouvelle_phrase() : void {
    // Disparition des autres modals
    for (const modal of non_null(document.getElementsByClassName("modal")) as HTMLCollectionOf<HTMLElement>) {
        modal.style.display = "none";
    }

    const modal_nouvelle_phrase = non_null(document.getElementById("modal-nouvelle-phrase"));
    modal_nouvelle_phrase.style.display = "block";
    // remplissage du choix des  fonctions
    const fonctions_choix : { [nom: string] : Fonction } = {
        "Sujet" : "sujet",
        "Verbe" : "verbe_principal",
        "COD" : "cod",
        "COI" : "coi",
        "Attribut du sujet" : "attribut_du_sujet",
        "Attribut du COD" : "attribut_du_cod",
        "Complément d'agent" : "complément_d_agent",
        "Complément circonstanciel" : "complément_circonstanciel",
        "Complément du verbe impersonnel" : "complément_du_verbe_impersonnel",
        "Modalisateur" : "modalisateur",
        "Fonction auto-énonciative" : "auto-énonciative",
        "Connecteur" : "connecteur",
        "Balise textuelle" : "balise_textuelle"
    };
    let html_boutons = "";
    Object.entries(fonctions_choix).forEach(
        ([nom, fonction, ]) => {
            html_boutons += `<div><input type="checkbox" id="nouvelle_phrase_${fonction}" name="nouvelle_phrase_${fonction}" value="${fonction}" class="checkbox nouvelle_phrase-checkbox"><label for="${fonction}">${nom}</label></div>`;
        });
    non_null(document.getElementById("nouvelle_phrase-fonctions-selection")).innerHTML = html_boutons;

    fonction_du_bouton_de_nouvelle_phrase = () => {
        modal_nouvelle_phrase.style.display = 'none';
        let nouveau_texte = non_null(document.getElementById("nouvelle_phrase-texterea") as HTMLTextAreaElement).value;
        let nouvelle_phrase = new PhraseEleve(nouveau_texte, new PhraseCorrigee(nouveau_texte));
        non_null(document.getElementById("phrase-analyse-paragraphe")).innerHTML = affiche_phrase(nouvelle_phrase);

        // itération sur les checkboxes -> on vérifie si elle est cochée et on passe à la suivante

    };
    
}
