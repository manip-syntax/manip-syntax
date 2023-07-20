import { affiche_phrase } from './affichage_phrase';
import { Fonction, PhraseCorrigee, PhraseEleve } from './phrase';
import { assert, byID, non_null } from './util';
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
    return new PhraseEnveloppe("vide");
}



const fonctions_choix : { [nom: string] : Fonction } = {
    "Sujet" : "sujet",
    "Verbes" : "verbes",
    "Noyau" : "noyau",
    "Verbe principal" : "verbe_principal",
    "Groupe verbal" : "groupe_verbal",
    "COD" : "cod",
    "COI" : "coi",
    "Attribut du sujet" : "attribut_du_sujet",
    "Attribut du COD" : "attribut_du_cod",
    "Complément d'agent" : "complement_d_agent",
    "Complément circonstanciel-1" : "complement_circonstanciel",
    "Complément du verbe impersonnel" : "complement_du_verbe_impersonnel",
    "Modalisateur-1" : "modalisateur",
    "Fonction auto-énonciative-1" : "auto-enonciative",
    "Connecteur-1" : "connecteur",
    "Balise textuelle-1" : "balise_textuelle"
};


class _fonction_tracee {
    public pos: number = 0;
    public longueur: number = 0;
    public changee: boolean = false;
    public nom: Fonction; 
    constructor(nom: Fonction) {
        this.pos = 0;
        this.longueur = 0;
        this.nom = nom;
    }
}

class PhraseEnveloppe {

    private _phrase: PhraseEleve;
    private _fonctions_multiples_traceur : { [nom: string] : _fonction_tracee } = {
        "complement_circonstanciel": new _fonction_tracee("complement_circonstanciel"),
        "balise_textuelle" : new _fonction_tracee("balise_textuelle"),
        "modalisateur" : new _fonction_tracee("modalisateur"),
        "auto-enonciative" : new _fonction_tracee("auto-enonciative"),
        "connecteur" : new _fonction_tracee("connecteur")
    };

    _verifie_existence_fonction(nom: Fonction) {
        assert(nom in this._fonctions_multiples_traceur,"${nom} n'est pas une fonction multiple");
    }

    constructor(texte: string) {
        this._phrase = new PhraseEleve(texte, new PhraseCorrigee(texte));
    }

    get phrase(): PhraseEleve {
        return this._phrase;
    }

    fm_pos(nom: Fonction): number {
        this._verifie_existence_fonction(nom);
        return this._fonctions_multiples_traceur[nom].pos;
    }

    fm_ajouter(nom: Fonction): void {
        this._verifie_existence_fonction(nom);
        this._fonctions_multiples_traceur[nom].pos += 1;
        this._fonctions_multiples_traceur[nom].changee = true;
    }

    fm_changer(nom: Fonction, val: boolean): boolean {
        this._verifie_existence_fonction(nom);
        this._fonctions_multiples_traceur[nom].changee = val;
        return val;
    }

    fm_changee(nom: Fonction): boolean {
        this._verifie_existence_fonction(nom);
        return this._fonctions_multiples_traceur[nom].changee;
    }
}

const selecteur = byID("nouvelle_phrase-fonctions-selection") as HTMLSelectElement;
function ajout_element_selecteur(nom: string, f: Fonction, numero: number) {
    const current_pos = selecteur.selectedIndex;
    nom = nom.split("-")[0];
    selecteur.add( new Option(`${nom}-${numero+2}`, f), selecteur.options[current_pos+1]);
}



function analyse_de_fonction(pos:number, phrase: PhraseEnveloppe): void {
        const nom = selecteur.options[pos].text;
        const fonction = selecteur.options[pos].value as Fonction;
        non_null(document.getElementById("phrase-analyse-paragraphe")).innerHTML = affiche_phrase(phrase.phrase);
        non_null(document.getElementById("consigne-container")).innerHTML = `À renseigner : ${nom}`;

        enregistre_fonction = () => {
            const mots_selectionnes = Array.from(document.getElementsByClassName("phrase-selectionne"))
                              .map(elt => Number(elt.id.split('-')[2]));
            const numero_de_fonction = PhraseEleve.Fonctions_multiples.includes(fonction) ? phrase.fm_pos(fonction) : -1;
            if (PhraseEleve.Fonctions_multiples.includes(fonction)) {
                if (phrase.phrase.fonctions_multiples_nombre(fonction) === phrase.fm_pos(fonction) 
                    && mots_selectionnes.length === 0) {
                    // si c'est une fonction multiple et que rien n'a été enregistré, on passe
                    phrase.fm_changer(fonction, false);
                    return phrase;
                } else {
                    // nouvelle fonction multiple
                    ajout_element_selecteur(nom, fonction, phrase.fm_pos(fonction));
                    phrase.fm_ajouter(fonction);
                }
            }
            phrase.phrase.declareFonction(fonction, mots_selectionnes, numero_de_fonction);
            return phrase;
        }

        fonction_de_validation_de_la_phrase = () => {
            const filename = "phrase.{{numéro_de_version}}.json";

            // TODO ajout de la version dans le fichier json?
            // TODO supprimer les éléments vides
            const blob = new Blob([JSON.stringify(enregistre_fonction().phrase)], { type: "text/json" });
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
            enregistre_fonction();
            const npos = pos += 1;
            analyse_de_fonction(npos, phrase);
            // sélecteur
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
        let nouvelle_phrase = new PhraseEnveloppe(nouveau_texte);
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
