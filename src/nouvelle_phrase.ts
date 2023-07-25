import { affiche_phrase } from './affichage_phrase';
import { GroupeEnchasse, Fonction, Phrase, PhraseCorrigee, PhraseEleve } from './phrase';
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

class FonctionTracee {
    public validee: boolean = false;
    public changee: boolean = false;
    public est_multiple: boolean = false;
    constructor(public nom_de_base: string,
                public fonction: Fonction,
                public html_node: HTMLElement,
                public syntagme: Phrase | GroupeEnchasse,
                public numero: number = -1,
                public parent?: FonctionTracee) {
        this.est_multiple = numero > -1;
    }

    get nom(): string {
        if (this.numero > -1) {
            return `${this.nom_de_base}-${this.numero + 1}`;
        }
        return this.nom_de_base;
    }

    get arbre_genealogique(): string {
        if (typeof this.parent === "undefined") {
            return this.nom;
        }
        return `${this.parent.arbre_genealogique} > ${this.nom}`;
    }
}

class CreateurPhrase {

    private _phrase: PhraseEleve;
    private _traceur: FonctionTracee[] = [];
    private _pos: number = 0;
    private _selecteur: HTMLElement = byID("nouvelle_phrase-fonctions-selection") as HTMLElement;
    static liste_des_fonctions_niveau_1: { [nom: string] : Fonction } = {
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
    static liste_des_fonctions_niveau_2: { [nom: string] : Fonction } = {
        "Épithète" : "epithete",
        "Complément du nom" : "complement_du_nom",
        "Complément du pronom": "complement_du_pronom",
        "Apposition" : "apposition",
        "Complément de l'adjectif": "complement_de_l_adjectif"
    };

    constructor(texte: string) {
        this._phrase = new PhraseEleve(texte, new PhraseCorrigee(texte));
        this._selecteur.innerHTML = ''; // réinitialisation du sélecteur
        Object.entries(CreateurPhrase.liste_des_fonctions_niveau_1).forEach(
            elt => this.ajouter_fonction_tracee(this._traceur.length, elt[0], elt[1])
        );
        this._selecteur.style.display = 'block';
    }

    set pos(i: number) {
        /* Cette fonction permet de modifier la position dans le CreateurPhrase
         * mais aussi dans le sélecteur
         */
        this.fonction_courante.html_node.classList.remove("selectionne");
        assert(i < this._traceur.length,`${i} est plus grand que la longueur du traceur: ${this._traceur.length}.`);
        this._pos = i;
        this.fonction_courante.html_node.classList.add("selectionne");
    }

    get fonction_courante(): FonctionTracee {
        return this._traceur[this._pos];
    }

    set_pos_selecteur(selecteur: HTMLElement, pos: number):number {
        /* Donne à chaque élément d'un sélecteur sa position et renvoie la dernière position enregistrée
         */
        for (let elt of selecteur.children) {
            if (elt.classList.contains("selecteur") || elt.classList.contains("sous_menu")) {
                pos = this.set_pos_selecteur(elt as HTMLElement, pos);
            } else {
                elt.setAttribute("pos",pos.toString());
                pos += 1;
            }
        }
        return pos;
    }

    ajouter_node_selecteur(selecteur: HTMLElement, node: HTMLElement, pos_courante: number, pos_a_atteindre: number ) : number {

        for (let elt of selecteur.children) {
            if (elt.classList.contains("sous_menu")) {
                // le 1 correspond au selecteur, le + 1 au fait qu'il y a normalement un autre élément du sous-menu qui est la fonction parent
                pos_courante = this.ajouter_node_selecteur(elt.children[1] as HTMLElement,node, pos_courante + 1, pos_a_atteindre);
                if (pos_courante > pos_a_atteindre) {
                    return pos_courante;
                }
            } else {
                if (pos_courante === pos_a_atteindre) {
                    elt.insertAdjacentElement("beforebegin", node);
                }
                if (pos_courante > pos_a_atteindre) {
                    return pos_courante;
                }
                pos_courante += 1;
            }
        }

        if (pos_courante === pos_a_atteindre) {
            selecteur.appendChild(node);
            return pos_courante + 1;
        }

        return pos_courante;
    }
        

    ajouter_fonction_tracee(pos: number, nom: string, fonction: Fonction, syntagme: Phrase|GroupeEnchasse = this._phrase, numero:number = -1, parent?: FonctionTracee) {
        /* Ajouter une fonction dans le traceur et dans le selecteur
         * pos correspond à l'emplacement dans la liste
         */
        if (PhraseEleve.Fonctions_multiples.includes(fonction) && numero === -1) {
            numero = 0;
        }
        assert(pos <= this._traceur.length,`${pos} est plus grand que la longueur du traceur`);

        let elt = document.createElement("div");
        const f = new FonctionTracee(nom, fonction, elt, syntagme, numero, parent);
        this._traceur.splice(pos, 0, f);

        elt.setAttribute("value",f.fonction);
        elt.setAttribute("class","selecteur-element");
        elt.innerHTML = f.nom;
        //this._selecteur_courant.insertBefore(elt, this._selecteur_courant.children[pos]); // ne peut pas être children.pos parce qu'il y aura d'autres sélecteurs qu'il faut ignorer
        //this.fonction_courante.html_node.insertAdjacentElement("afterend", elt);
        this.ajouter_node_selecteur(this._selecteur, elt, 0, pos);

        // mise à jour de la position 
        this.set_pos_selecteur(this._selecteur, 0);
    }
    
    cree_groupe_enchasse(b: boolean, syntagme: GroupeEnchasse, parent: FonctionTracee):void {
        /* Crée un groupe enchâssé si b est vrai
         */
        if (!PhraseEleve.Fonctions_contenants.includes(this.fonction_courante.fonction)) {
            return;
        }
        if (!b) {
            // remove fonctions TODO uniquement s'il y en a déjà
            return;
        }


        let sous_menu = document.createElement("div");
        sous_menu.setAttribute("class","sous_menu");
        this.fonction_courante.html_node.insertAdjacentElement("beforebegin", sous_menu);
        sous_menu.insertAdjacentElement("afterbegin", this.fonction_courante.html_node);

        let selecteur_courant = document.createElement("div");
        selecteur_courant.setAttribute("class","selecteur sous_menu_contenu");
        this.fonction_courante.html_node.insertAdjacentElement("afterend",selecteur_courant);
        let i = this._pos + 1;
        Object.entries(CreateurPhrase.liste_des_fonctions_niveau_2)
            .concat(Object.entries(CreateurPhrase.liste_des_fonctions_niveau_1))
            .forEach(
            // TODO améliorer pour ne sélectionner que les fonctions qui peuvent aller avec la fonction contenant
            elt => {
                this.ajouter_fonction_tracee(i,elt[0], elt[1], syntagme, -1, parent);
                i += 1;
            }
        );

        sous_menu.addEventListener("mouseenter", () => {
            selecteur_courant.style.display = 'block';
        });

        sous_menu.addEventListener("mouseleave", () => {
            selecteur_courant.style.display = 'none';
        });
    }

    valide_fonction(b: boolean): boolean {
        /* valide la fonction si b est vrai
         */
        const fc = this.fonction_courante;
        fc.validee = b;
        if (b) {
            fc.html_node.classList.add("valide");
        } else {
            fc.html_node.classList.remove("valide");
        }

        return b;
    }
    

    analyse_de_fonction(pos: number = -1): void {
        if (pos === -1) {
            pos = this._pos;
        } else {
            this.pos = pos;
        }
        const fonction = this.fonction_courante.fonction;
        const syntagme = this.fonction_courante.syntagme;
        byID("phrase-analyse-paragraphe").innerHTML = affiche_phrase(this._phrase);
        byID("consigne-container").innerHTML = `À renseigner : ${this.fonction_courante.arbre_genealogique}`;

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
                if (this._phrase.fonctions_multiples_nombre(fonction) === this.fonction_courante.numero) {
                    if (mots_selectionnes.length === 0) {
                        // si c'est une fonction multiple et que rien n'a été enregistré, on passe
                        return this;
                    } else {
                        // nouvelle fonction multiple
                        this.ajouter_fonction_tracee(pos + 1, this.fonction_courante.nom_de_base, fonction, syntagme, this.fonction_courante.numero + 1);
                    }
                }
            }
            syntagme.declareFonction(fonction, mots_selectionnes, this.fonction_courante.numero);
            const est_valide = this.valide_fonction(mots_selectionnes.length > 0);
            this.cree_groupe_enchasse(est_valide, syntagme.cree_groupe_enchasse(mots_selectionnes), this.fonction_courante);
            return this;
        }

        fonction_de_validation_de_la_phrase = () => {
            const filename = "phrase.{{numéro_de_version}}.json";

            // TODO ajout de la version dans le fichier json?
            const blob = new Blob([JSON.stringify(enregistre_fonction()._phrase)], { type: "text/json" });
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
        nouvelle_phrase.analyse_de_fonction(0);

        // Evénement pour le sélecteur
        byID("nouvelle_phrase-fonctions-selection").addEventListener('click', e => {
            const target = e.target as HTMLElement;
            // enregistrement
            enregistre_fonction();
            // chargement de la fonction désirée
            const val = () => {
                let v = target.getAttribute("pos");
                if (typeof v === "string") {
                    return parseInt(v);
                } 
                assert(false, `la valeur de l'attribut est nulle.`);
                return -1;
            };
            nouvelle_phrase.analyse_de_fonction(val());
        });
    };
    
}
