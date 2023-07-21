import { affiche_phrase } from './affichage_phrase';
import { Fonction, PhraseCorrigee, PhraseEleve } from './phrase';
import { assert, byID, non_null } from './util';
import { fonctions_communes } from './fonctions_partagees';
import './nouvelle_phrase.css';

// Nouvelle phrase: bouton ok
let fonction_du_bouton_de_nouvelle_phrase = () => console.log("Problème: aucune fonction définie pour le bouton OK de la nouvelle phrase");
byID("modal-nouvelle_phrase-bouton").addEventListener('click', () => {
    fonction_du_bouton_de_nouvelle_phrase();
});
// Nouvelle phrase: bouton validation de la phrase
let fonction_de_validation_de_la_phrase = () => console.log("Problème: aucune fonction définie pour la validation de la nouvelle phrase");
byID("bouton-valider-phrase").addEventListener('click', () => {
    fonction_de_validation_de_la_phrase();
});
let enregistre_fonction = () => {
    console.log("Problème: enregistre_fonction n'a pas été instancié");
    return new CreateurPhrase("vide");
}





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
class FonctionTracee {
    public validee: boolean = false;
    public changee: boolean = false;
    public est_multiple: boolean = false;
    constructor(public nom_de_base: string, public fonction: Fonction, public numero: number = -1) {
        this.est_multiple = numero > -1;
    }

    get nom(): string {
        if (this.numero > -1) {
            return `${this.nom_de_base}-${this.numero + 1}`;
        }
        return this.nom_de_base;
    }
}

class CreateurPhrase {

    private _phrase: PhraseEleve;
    private _fonctions_multiples_traceur : { [nom: string] : _fonction_tracee } = {
        "complement_circonstanciel": new _fonction_tracee("complement_circonstanciel"),
        "balise_textuelle" : new _fonction_tracee("balise_textuelle"),
        "modalisateur" : new _fonction_tracee("modalisateur"),
        "auto-enonciative" : new _fonction_tracee("auto-enonciative"),
        "connecteur" : new _fonction_tracee("connecteur")
    };
    private _traceur: FonctionTracee[] = [];
    private _pos: number = 0;
    private _selecteur: HTMLSelectElement = byID("nouvelle_phrase-fonctions-selection") as HTMLSelectElement;
    static liste_des_fonctions: { [nom: string] : Fonction } = {
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
        "Complément circonstanciel" : "complement_circonstanciel",
        "Complément du verbe impersonnel" : "complement_du_verbe_impersonnel",
        "Modalisateur" : "modalisateur",
        "Fonction auto-énonciative" : "auto-enonciative",
        "Connecteur" : "connecteur",
        "Balise textuelle" : "balise_textuelle"
    };

    constructor(texte: string) {
        this._phrase = new PhraseEleve(texte, new PhraseCorrigee(texte));
        Object.entries(CreateurPhrase.liste_des_fonctions).forEach(
            elt => this.ajouter_fonction_tracee(this._traceur.length, elt[0], elt[1])
        );
        this._selecteur.style.display = 'block';
    }

    set pos(i: number) {
        /* Cette fonction permet de modifier la position dans le CreateurPhrase
         * mais aussi dans le sélecteur
         */
        assert(i < this._traceur.length,`${i} est plus grand que la longueur du traceur: ${this._traceur.length}.`);
        this._pos = i;
        assert(i < this._selecteur.options.length,`${i} est plus grand que la longueur du sélecteur ${this._selecteur.options.length}.`);
        this._selecteur.selectedIndex = i;
    }

    get fonction_courante(): FonctionTracee {
        return this._traceur[this._pos];
    }

    
    ajouter_fonction_tracee(pos: number, nom: string, fonction: Fonction, numero:number = -1) {
        /* Ajouter une fonction dans le traceur et dans le selecteur
         * pos correspond à l'emplacement dans la liste
         */
        if (PhraseEleve.Fonctions_multiples.includes(fonction) && numero === -1) {
            numero = 0;
        }
        assert(pos <= this._traceur.length,`${pos} est plus grand que la longueur du traceur`);
        assert(pos <= this._selecteur.options.length, `${pos} est plus grand que la longueur du selecteur: ${this._selecteur.options.length}`);
        const f = new FonctionTracee(nom, fonction, numero);
        this._traceur.splice(pos, 0, f);
        this._selecteur.add(new Option(f.nom, f.fonction), pos);
    }

    _verifie_existence_fonction(nom: Fonction) {
        assert(nom in this._fonctions_multiples_traceur,"${nom} n'est pas une fonction multiple");
    }


    get phrase(): PhraseEleve {
        return this._phrase;
    }

    fm_pos(nom: Fonction): number {
        this._verifie_existence_fonction(nom);
        return this._fonctions_multiples_traceur[nom].pos;
    }

    fm_pos_set(nom: Fonction, numero: number) {
        /* Change la valeur de pos pour la fonction
         */
        if (numero > 0) {
            this._verifie_existence_fonction(nom);
            assert(this._fonctions_multiples_traceur[nom].longueur >= numero,`numero introuvable pour ${nom}: longueur: ${this._fonctions_multiples_traceur[nom].longueur}. numero: ${numero}`);
        }
        this._fonctions_multiples_traceur[nom].pos = numero;
    }

    fm_ajouter(nom: Fonction): void {
        this._verifie_existence_fonction(nom);
        this._fonctions_multiples_traceur[nom].pos += 1;
        this._fonctions_multiples_traceur[nom].longueur += 1;
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

    analyse_de_fonction(pos: number = -1): void {
        if (pos === -1) {
            pos = this._pos;
        } else {
            this.pos = pos;
        }
        const nom = this.fonction_courante.nom;
        const fonction = this.fonction_courante.fonction;
        byID("phrase-analyse-paragraphe").innerHTML = affiche_phrase(this._phrase);
        byID("consigne-container").innerHTML = `À renseigner : ${nom}`;

        // selection des mots précédemment sélectionnés
        const mots_selectionnes = this._phrase.fonctionPos(fonction, this.fonction_courante.numero);
        Array.from(document.getElementsByClassName("phrase-cliquable"))
            .forEach( elt => {
                if (mots_selectionnes.includes(Number(elt.id.split('-')[2]))) {
                    elt.classList.add("phrase-selectionne");
                }
            });

        enregistre_fonction = () => {
            const mots_selectionnes = Array.from(document.getElementsByClassName("phrase-selectionne"))
                              .map(elt => Number(elt.id.split('-')[2]));
            if (this.fonction_courante.est_multiple) {
                if (this.phrase.fonctions_multiples_nombre(fonction) === this.fonction_courante.numero) {
                    if (mots_selectionnes.length === 0) {
                        // si c'est une fonction multiple et que rien n'a été enregistré, on passe
                        return this;
                    } else {
                        // nouvelle fonction multiple
                        this.ajouter_fonction_tracee(pos + 1, this.fonction_courante.nom_de_base, fonction, this.fonction_courante.numero + 1);
                    }
                }
            }
            this._phrase.declareFonction(fonction, mots_selectionnes, this.fonction_courante.numero);
            this.fonction_courante.validee = true;
            return this;
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
            this.analyse_de_fonction(pos + 1);
        };
}
}





export function nouvelle_phrase() : void {
    // Disparition des autres modals
    for (const modal of non_null(document.getElementsByClassName("modal")) as HTMLCollectionOf<HTMLElement>) {
        modal.style.display = "none";
    }

    const modal_nouvelle_phrase = byID("modal-nouvelle-phrase");
    modal_nouvelle_phrase.style.display = "block";
    // Divers éléments à afficher
    byID("conseil").innerHTML = "Sélectionnez chaque fonction comme si vous étiez vous-même l'élève. Cliquez sur valider quand vous avez terminé votre sélection. Valider dans rien sélectionner indique que cette fonction est absente de la phrase. Vous pouvez toujours corriger une éventuelle erreur en sélectionnant une fonction dans la liste déroulante.";
    const bouton_valider = byID("bouton-valider");
    bouton_valider.style.width = "50%";
    bouton_valider.innerHTML = "Valider la fonction";
    // validation de la phrase
    const valider_phrase = byID("bouton-valider-phrase");
    valider_phrase.style.display = "block";

    fonction_du_bouton_de_nouvelle_phrase = () => {
        let nouveau_texte = (byID("nouvelle_phrase-texterea") as HTMLTextAreaElement).value;
        if (nouveau_texte.trim() === '') {
            // rien n'a été entré
            return;
        }
        let nouvelle_phrase = new CreateurPhrase(nouveau_texte);
        modal_nouvelle_phrase.style.display = 'none';
        nouvelle_phrase.analyse_de_fonction();

        // Evénement pour le sélecteur
        byID("nouvelle_phrase-fonctions-selection").addEventListener('change', e => {
            const target = e.target as HTMLSelectElement;
            // enregistrement
            enregistre_fonction();
            // chargement de la fonction désirée
            nouvelle_phrase.analyse_de_fonction(target.selectedIndex);
        });
    };
    
}
