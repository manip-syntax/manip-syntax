import { affiche_phrase } from './affichage_phrase';
import { Fonction, PhraseCorrigee, PhraseEleve } from './phrase';
import { non_null } from './util';
import { fonctions_communes } from './fonctions_partagees';

// Nouvelle phrase: bouton ok
let fonction_du_bouton_de_nouvelle_phrase = () => console.log("Problème: aucune fonction définie pour le bouton OK de la nouvelle phrase");
non_null(document.getElementById("modal-nouvelle_phrase-bouton")).addEventListener('click', () => {
    fonction_du_bouton_de_nouvelle_phrase();
});


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

function analyse_de_fonction(pos:number, phrase: PhraseEleve): void {
        const [nom, fonction] = Object.entries(fonctions_choix)[pos];
        non_null(document.getElementById("phrase-analyse-paragraphe")).innerHTML = affiche_phrase(phrase);
        non_null(document.getElementById("consigne-container")).innerHTML = `Fonction à renseigner : ${nom}`;
        fonctions_communes.fonction_de_validation = () => {
            const mots_selectionnes = Array.from(document.getElementsByClassName("phrase-selectionne"))
                              .map(elt => Number(elt.id.split('-')[2]));
            phrase.declareFonction(fonction, mots_selectionnes);
            const npos = pos === Object.entries(fonctions_choix).length - 1 ? 0 : pos + 1;
            analyse_de_fonction(npos, phrase);
        };
}

export function nouvelle_phrase() : void {
    // Disparition des autres modals
    for (const modal of non_null(document.getElementsByClassName("modal")) as HTMLCollectionOf<HTMLElement>) {
        modal.style.display = "none";
    }

    const modal_nouvelle_phrase = non_null(document.getElementById("modal-nouvelle-phrase"));
    modal_nouvelle_phrase.style.display = "block";
    // remplissage du choix des  fonctions
    let options = "";
    Object.entries(fonctions_choix).forEach(
        ([nom, fonction, ]) => {
            options += `<option value="${fonction}">${nom}</option>\n`;
        });
    const liste_fonctions = non_null(document.getElementById("nouvelle_phrase-fonctions-selection"));
    liste_fonctions.innerHTML = options;
    liste_fonctions.style.display = 'block';
    // Divers éléments à afficher
    non_null(document.getElementById("conseil")).innerHTML = "Sélectionnez chaque fonction comme si vous étiez vous-même l'élève. Cliquez sur valider quand vous avez terminé votre sélection. Valider dans rien sélectionner indique que cette fonction est absente de la phrase. Vous pouvez toujours corriger une éventuelle erreur en sélectionnant une fonction dans la liste déroulante.";
    const bouton_valider = non_null(document.getElementById("bouton-valider"));
    bouton_valider.style.width = "50%";
    bouton_valider.innerHTML = "Valider la fonction";
    non_null(document.getElementById("bouton-valider-phrase")).style.display = "block";

    fonction_du_bouton_de_nouvelle_phrase = () => {
        let nouveau_texte = non_null(document.getElementById("nouvelle_phrase-texterea") as HTMLTextAreaElement).value;
        if (nouveau_texte.trim() === '') {
            // rien n'a été entré
            return;
        }
        let nouvelle_phrase = new PhraseEleve(nouveau_texte, new PhraseCorrigee(nouveau_texte));
        modal_nouvelle_phrase.style.display = 'none';
        analyse_de_fonction(0, nouvelle_phrase);
        


    };
    
}
