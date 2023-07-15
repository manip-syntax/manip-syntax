import { affiche_phrase } from './affichage_phrase';
import { Fonction, PhraseCorrigee, PhraseEleve } from './phrase';
import { byID, non_null } from './util';
import { fonctions_communes } from './fonctions_partagees';
import './nouvelle_phrase.css';

// Nouvelle phrase: bouton ok
let fonction_du_bouton_de_nouvelle_phrase = () => console.log("Problème: aucune fonction définie pour le bouton OK de la nouvelle phrase");
non_null(document.getElementById("modal-nouvelle_phrase-bouton")).addEventListener('click', () => {
    fonction_du_bouton_de_nouvelle_phrase();
});
// Nouvelle phrase: bouton validation de la phrase
let fonction_de_validation_de_la_phrase = () => console.log("Problème: aucune fonction définie pour la validation de la nouvelle phrase");
non_null(document.getElementById("bouton-valider-phrase")).addEventListener('click', () => {
    fonction_de_validation_de_la_phrase();
});
let enregistre_fonction = () => {
    console.log("Problème: enregistre_fonction n'a pas été instancié");
    return new PhraseEleve("vide",new PhraseCorrigee("vide"));
}



const fonctions_choix : { [nom: string] : Fonction } = {
    "Sujet" : "sujet",
    "Verbes" : "verbes",
    "Verbe principal" : "verbe_principal",
    "Groupe verbal" : "groupe_verbal",
    "COD" : "cod",
    "COI" : "coi",
    "Attribut du sujet" : "attribut_du_sujet",
    "Attribut du COD" : "attribut_du_cod",
    "Complément d'agent" : "complement_d_agent",
    //"Complément circonstanciel" : "complément_circonstanciel",
    "Complément du verbe impersonnel" : "complement_du_verbe_impersonnel",
    //"Modalisateur" : "modalisateur",
    //"Fonction auto-énonciative" : "auto-énonciative",
    //"Connecteur" : "connecteur",
    //"Balise textuelle" : "balise_textuelle"
};

function analyse_de_fonction(pos:number, phrase: PhraseEleve): void {
        const [nom, fonction] = Object.entries(fonctions_choix)[pos];
        non_null(document.getElementById("phrase-analyse-paragraphe")).innerHTML = affiche_phrase(phrase);
        non_null(document.getElementById("consigne-container")).innerHTML = `À renseigner : ${nom}`;

        enregistre_fonction = () => {
            const mots_selectionnes = Array.from(document.getElementsByClassName("phrase-selectionne"))
                              .map(elt => Number(elt.id.split('-')[2]));
            phrase.declareFonction(fonction, mots_selectionnes);
            return phrase;
        }

        fonction_de_validation_de_la_phrase = () => {
            const filename = "phrase.{{numéro_de_version}}.json";

            // TODO ajout de la version dans le fichier json?
            const blob = new Blob([JSON.stringify(enregistre_fonction())], { type: "text/json" });
            const lien = document.createElement('a');
            lien.download = filename;
            lien.href = window.URL.createObjectURL(blob);
            lien.dataset.downloadurl = ["text/json", lien.download, lien.href].join(":");
            const evt = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true,
            });
            lien.dispatchEvent(evt);
            lien.remove();
            nouvelle_phrase();
        };

        fonctions_communes.fonction_de_validation = () => {
            const npos = pos === Object.entries(fonctions_choix).length - 1 ? 0 : pos + 1;
            analyse_de_fonction(npos, enregistre_fonction());
            // sélecteur
            const selecteur = byID("nouvelle_phrase-fonctions-selection") as HTMLSelectElement;
            // BUG: si on sélectionne depuis le sélecteur, c'est le mauvais index qui est choisi
            selecteur.selectedIndex = npos;
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
    // validation de la phrase
    const valider_phrase = non_null(document.getElementById("bouton-valider-phrase"));
    valider_phrase.style.display = "block";

    fonction_du_bouton_de_nouvelle_phrase = () => {
        let nouveau_texte = non_null(document.getElementById("nouvelle_phrase-texterea") as HTMLTextAreaElement).value;
        if (nouveau_texte.trim() === '') {
            // rien n'a été entré
            return;
        }
        let nouvelle_phrase = new PhraseEleve(nouveau_texte, new PhraseCorrigee(nouveau_texte));
        modal_nouvelle_phrase.style.display = 'none';
        analyse_de_fonction(0, nouvelle_phrase);

        // Evénement pour le sélecteur
        byID("nouvelle_phrase-fonctions-selection").addEventListener('change', e => {
            const target = e.target as HTMLSelectElement;
            // enregistrement
            enregistre_fonction();
            // chargement de la fonction désirée
            analyse_de_fonction(target.selectedIndex, nouvelle_phrase );
        });
        


    };
    
}
