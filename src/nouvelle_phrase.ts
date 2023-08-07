import { affiche_phrase, dispose } from './affichage_phrase';
import { GroupeEnchasse, Fonction, MotsPos, Phrase, PhraseCorrigee, PhraseEleve } from './phrase';
import { assert, byID, non_null } from './util';
import { fonctions_communes } from './fonctions_partagees';
import './nouvelle_phrase.css';
import contenus_possibles from "./contenus_possibles.json";

// Nouvelle phrase: bouton ok
let fonction_du_bouton_de_nouvelle_phrase = () => console.log("Problème: aucune fonction définie pour le bouton OK de la nouvelle phrase");
// Nouvelle phrase: bouton validation de la phrase
let fonction_de_validation_de_la_phrase = () => console.log("Problème: aucune fonction définie pour la validation de la nouvelle phrase");
let fonction_du_selecteur_nouvelle_phrase = (_: Event) => console.log("Aucune fonction définie pour le sélecteur");
let enregistre_fonction = () => {
    console.log("Problème: enregistre_fonction n'a pas été instancié");
    return new CreateurPhrase("vide");
}

let fonction_du_bouton_des_ajouts_de_manipulations = () => console.log("Problème: aucune fonction définie pour le bouton OK des ajouts de manipulations");

export function add_events_listener () {
    byID("modal-nouvelle_phrase-bouton").addEventListener('click', () => {
        fonction_du_bouton_de_nouvelle_phrase();
    });

    byID("bouton-valider-phrase").addEventListener('click', () => {
        fonction_de_validation_de_la_phrase();
    });
    byID("nouvelle_phrase-fonctions-selection").addEventListener('click', e => {
        fonction_du_selecteur_nouvelle_phrase(e);
    });
    byID("ajout-manipulations-form").addEventListener("submit", (e) => {
        e.preventDefault();
        fonction_du_bouton_des_ajouts_de_manipulations();
    });
}

class FonctionTracee {
    public validee: boolean = false;
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

    get id_sous_menu(): string {
        const num = this.numero === -1 ? "" : `-${this.numero}`;
        const id = `${this.fonction}${num}`;
        if (typeof this.parent === "undefined") {
            return id;
        }
        return `${this.parent.id_sous_menu}-${id}`;
    }
}

export class CreateurPhrase {

    private _phrase: PhraseEleve;
    private _traceur: FonctionTracee[] = [];
    private _pos: number = 0;
    private _selecteur: HTMLElement = byID("nouvelle_phrase-fonctions-selection") as HTMLElement;
    static liste_des_fonctions_niveau_1: { [nom: string] : Fonction } = {
        "Indépendante" : "independante",
        "Sujet" : "sujet",
        "Verbes" : "verbes",
        "Groupe verbal" : "groupe_verbal",
        "Complément d'agent" : "complement_d_agent",
        "Complément circonstanciel" : "complement_circonstanciel",
        "Modalisateur" : "modalisateur",
        "Fonction auto-énonciative" : "auto-enonciative",
        "Connecteur" : "connecteur",
        "Balise textuelle" : "balise_textuelle",
        "Noyau" : "noyau",
        "Épithète" : "epithete",
        "Complément du nom" : "complement_du_nom",
        "Complément du pronom": "complement_du_pronom",
        "Apposition" : "apposition"
    };
    static liste_des_fonctions_niveau_2: { [nom: string] : Fonction } = {
        "COD" : "cod",
        "COI" : "coi",
        "Attribut du sujet" : "attribut_du_sujet",
        "Attribut du COD" : "attribut_du_cod",
        "Complément du verbe impersonnel" : "complement_du_verbe_impersonnel",
        "Complément de l'adjectif": "complement_de_l_adjectif"
    };

    static contenus_possibles(f: Fonction): { [nom: string] : Fonction} {
        /* Renvoie un objet de fonctions qui peuvent être contenues directement
         * par f
         */
        return (contenus_possibles as any)[f as string];// oui, c'est mal
    }

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

    get pos():number {
        return this._pos;
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

    retirer_enfants(parent: FonctionTracee, index: number[], est_premier_appel: boolean = false) {
        /* Retire toute la descendance de parent
         * du traceur et du sélecteur
         */
        // TODO fonction très lente et peu efficace
        for (const [i,f] of this._traceur.entries()) {
            if (f.parent === parent) {
                index = this.retirer_enfants(f, index, false);
                f.html_node.remove();
                index.push(i)
            }
        }
        if (est_premier_appel) {
            this._traceur = this._traceur.filter( (_, i) => !index.includes(i));
            this.set_pos_selecteur(this._selecteur,0);
        }
        return index;
    }

    gere_groupe_enchasse(b: boolean, mots: MotsPos, parent: FonctionTracee):void {
        /* Crée un groupe enchâssé si b est vrai
         * détruit un groupe enchâssé si b est faux
         */
        if (!PhraseEleve.Fonctions_contenants.includes(this.fonction_courante.fonction)) {
            return;
        }
        if (!b) {
            // retrait des fonctions
            if (parent.syntagme.supprime_groupe_enchasse(parent.fonction, parent.numero)) {
                // déplacement du parent
                const menu = byID(`sous_menu-${parent.id_sous_menu}`);
                menu.insertAdjacentElement("beforebegin", parent.html_node);
                // suppression du sélecteur et du traceur
                this.retirer_enfants(parent, [], true);
                // suppression du sous-menu
                menu.remove()
            }
            return;
        }


        let syntagme = parent.syntagme.cree_groupe_enchasse(mots, parent.fonction, parent.numero);
        let sous_menu = document.createElement("div");
        sous_menu.setAttribute("class","sous_menu");
        sous_menu.setAttribute("id", `sous_menu-${parent.id_sous_menu}`);
        this.fonction_courante.html_node.insertAdjacentElement("beforebegin", sous_menu);
        sous_menu.insertAdjacentElement("afterbegin", this.fonction_courante.html_node);

        let selecteur_courant = document.createElement("div");
        selecteur_courant.setAttribute("class","selecteur sous_menu_contenu");
        this.fonction_courante.html_node.insertAdjacentElement("afterend",selecteur_courant);
        let i = this._pos + 1;
        Object.entries(CreateurPhrase.contenus_possibles(this.fonction_courante.fonction))
            .forEach(
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

        sous_menu.addEventListener("click", () => {
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
        byID("phrase-analyse-paragraphe").innerHTML = affiche_phrase(this._phrase, syntagme.mots_sans_fonction);
        dispose(byID("phrase-analyse-paragraphe"));
        byID("consigne-container").innerHTML = `À renseigner : ${this.fonction_courante.arbre_genealogique}`;


        // selection des mots précédemment sélectionnés
        const mots_selectionnes = syntagme.fonctionPos(fonction, this.fonction_courante.numero);
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
            this.gere_groupe_enchasse(est_valide, mots_selectionnes, this.fonction_courante);
            this.elements_de_manipulation(est_valide);
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

    elements_de_manipulation(est_valide: boolean) {
        if (! est_valide) {
            return;
        }
        if (this.fonction_courante.fonction === "sujet") {
            byID("modal-ajout-manipulations").style.display = "block";
            const mots_selectionnes = Array.from(document.getElementsByClassName("phrase-selectionne"))
                .map(elt => elt.innerHTML).join(" ");
            const pronoms = "je tu il elle nous vous ils elles".split(" ");
            const pronoms_html = pronoms.includes(mots_selectionnes) ? 
                '<input type="hidden" id="pronom-inutile" name="sujet-pronoms" value="null">'
                : '<fieldset><legend>Par quoi le sujet peut-il être pronominalisé ?</legend>' +
                    pronoms.map(elt => `<input type="radio" class="pronoms" id="pronom-${elt}" name="sujet-pronoms" value="${elt}" required>` +
                                      `<label for="pronom-${elt}">${elt}</label>`)
                .join(" ") +
                '</fieldset>';
            byID("modal-ajout-manipulations-titre").innerHTML = `Renseignements nécessaires à la manipulation du sujet : ${mots_selectionnes}`;
            byID("ajout-manipulations-form-contenu").innerHTML = '<input type="radio" id="est-anime" value="true" name="sujet-anime" required>' +
                '<label for="est-anime">Le référent du sujet est animé.</label>' +
                '<input type="radio" id="est-non-anime" value="false" name="sujet-anime" required>' +
                '<label for="est-non-anime">Le référent du sujet est non animé.</label>' +
                pronoms_html;
            let fonction_courante = this.fonction_courante; // ce n'est pas inutile: au moment où on va appeler fonction_du_bouton_des_ajouts_de_manipulations, ce ne sera plus la fonction courante

            fonction_du_bouton_des_ajouts_de_manipulations = () => {
                const est_anime = (document.getElementsByName("sujet-anime")[0] as HTMLInputElement).checked;
                let pronom: string | null = Array.from(document.getElementsByName("sujet-pronoms")).filter( elt => (elt as HTMLInputElement).checked)[0].getAttribute("value");
                if (pronom === "null") {
                    pronom = null;
                }

                fonction_courante.syntagme.ajoute_infos_de_manipulation("sujet",{est_anime: est_anime, pronominalisation: pronom});
                byID("modal-ajout-manipulations").style.display = "none";
            };

        }
    }
}

export function nouvelle_phrase() : void {
    // Disparition des autres modals
    for (const modal of non_null(document.getElementsByClassName("modal")) as HTMLCollectionOf<HTMLElement>) {
        modal.style.display = "none";
    }

    const modal_nouvelle_phrase = byID("modal-nouvelle-phrase");
    modal_nouvelle_phrase.style.display = "block";
    byID("nouvelle_phrase-texterea").focus();
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

        fonction_du_selecteur_nouvelle_phrase = (e) => {
        // Evénement pour le sélecteur
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
        };
    };
    
}

export function retirer_elements_nouvelle_phrase() {
    /* Retire les éléments mis en place pour la création d'une nouvelle phrase
     */
    byID("conseil").innerHTML = "";
    const bouton_valider = byID("bouton-valider");
    bouton_valider.style.width = "100%";
    bouton_valider.innerHTML = "Valider";
    // validation de la phrase
    const valider_phrase = byID("bouton-valider-phrase");
    valider_phrase.style.display = "none";
    byID("nouvelle_phrase-fonctions-selection").innerHTML = "";

}
