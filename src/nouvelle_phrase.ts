import { affiche_phrase, dispose } from './affichage_phrase';
import { Syntagme, Fonction, MotsPos, SyntagmeCorrige, SyntagmeEleve } from './phrase';
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
                public syntagme: Syntagme,
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

    private _phrase: SyntagmeEleve;
    private _traceur: FonctionTracee[] = [];
    private _pos: number = 0;
    private _selecteur: HTMLElement = byID("nouvelle_phrase-fonctions-selection") as HTMLElement;
    static liste_des_fonctions: { [nom: string] : Fonction } = {
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

    static contenus_possibles(f: Fonction): { [nom: string] : Fonction} {
        /* Renvoie un objet de fonctions qui peuvent être contenues directement
         * par f
         */
        return (contenus_possibles as any)[f as string];// oui, c'est mal
    }

    constructor(texte: string) {
        this._phrase = new SyntagmeEleve(texte, new SyntagmeCorrige(texte));
        this._selecteur.innerHTML = ''; // réinitialisation du sélecteur
        Object.entries(CreateurPhrase.liste_des_fonctions).forEach(
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
        

    ajouter_fonction_tracee(pos: number, nom: string, fonction: Fonction, syntagme: Syntagme = this._phrase, numero:number = -1, parent?: FonctionTracee) {
        /* Ajouter une fonction dans le traceur et dans le selecteur
         * pos correspond à l'emplacement dans la liste
         */
        if (SyntagmeEleve.Fonctions_multiples.includes(fonction) && numero === -1) {
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
        if (!SyntagmeEleve.Fonctions_contenants.includes(this.fonction_courante.fonction)) {
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

        /*
        sous_menu.addEventListener("click", () => {
            // il semble qu'il y a un problème de temps en temps sur Chromium,
            // et que le selecteur soit fermé lorsqu'on clique avant que la fonction cliquée
            // soit passée à l'analyse
            selecteur_courant.style.display = 'none';
        });
        */
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
        const a_inclure = () => { // TODO à vérifier
            const compatibilite : { [id: string] : string[]} = {
                groupe_verbal: "verbes verbe_noyau cod coi attribut_du_sujet attribut_du_cod complement_du_verbe_impersonnel".split(" "),
                verbes: "verbe_noyau groupe_verbal".split(" "),
                verbe_noyau: "verbes groupe_verbal".split(" "),
                cod: ["groupe_verbal", "verbes"],
                coi: ["groupe_verbal","verbes"],
                attribut_du_sujet: ["groupe_verbal", "verbes"],
                attribut_du_cod: ["groupe_verbal", "verbes"],
                complement_du_verbe_impersonnel: ["groupe_verbal", "verbes"]
            };
            if (fonction in compatibilite) {
                return compatibilite[fonction].map(elt => syntagme.fonctionPos(elt as Fonction)).flat()
                    .concat(syntagme.mots_sans_fonction)                                    // mots qui n'ont jamais été choisis
                    .concat(syntagme.fonctionPos(fonction, this.fonction_courante.numero)); // mots qui ont été précédemment choisis pour cette fonction
            } else {
                // il faut inclure la fonction courante si l'utilisateur veut la corriger
                console.debug("Intégration des mots sans fonction et de la fonction courante dans les mots qu'on peut sélectionner", fonction);
                return syntagme.mots_sans_fonction
                    .concat(syntagme.fonctionPos(fonction, this.fonction_courante.numero)) // mots présélectionnés
                    .concat(syntagme.fonctionPos("verbes"));                                // tous les verbes peuvent être intégrés dans un autre syntagme
            }
        };
        byID("phrase-analyse-paragraphe").innerHTML = affiche_phrase(this._phrase, a_inclure());
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

        fonction_de_validation_de_la_phrase = async () => {
            let base_filename = this._phrase.contenu.replaceAll(" ","_").replace(Syntagme.separateur,'').toLowerCase();
            base_filename = base_filename.length > 40 ? base_filename.slice(0,37) + "..." : base_filename;
            const filename = `${base_filename}.{{numéro_de_version}}.json`;
            // limiter le nombre de caractères TODO

            await this.verification_verbes_sans_sujet(this._phrase); 

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
        fonctions_communes.ok = fonctions_communes.fonction_de_validation;


    }

    manipulation_titre(mots_selectionnes: string) {
        let res;
        switch (this.fonction_courante.fonction) {
            case "sujet":
                res = "sujet";
            break;
            case "cod":
                res = "COD";
            break;
            case "groupe_verbal":
                res = "Groupe Verbal";
            break;
            case "coi":
                res = "COI";
            break;
            default:
                throw this.fonction_courante.fonction;
        }
        byID("modal-ajout-manipulations-titre").innerHTML = `Renseignements nécessaires à la manipulation du ${res} : ${mots_selectionnes}`;
        return res;
    }

    cree_fieldset(titre: string, contenu: string): string {
        return `<fieldset class="ajout-manipulations-cadre">
                    <legend class="ajout-manipulations-cadre-titre">${titre}</legend>
                    <div class="ajout-manipulations-cadre-contenu">${contenu}</div>
                </fieldset>`;
    }

    cree_select(titre: string, liste: string, name: string) : string {
        /* Les différents éléments de liste doivent être séparés par des virgules
         */
        const liste_options = liste.split(",").map(e => `<option name=${name} value=${e.toLowerCase()}>${e}</option>`).join(" ");
        const contenu = `<select name="ajout-manipulations-contenu-${name}" class="manipulation-select">
        ${liste_options}</select>
        `;
        return this.cree_fieldset(titre, contenu);
    }

    cree_liste_preposions_coi(mots_selectionnes: string):string {
        const mots = mots_selectionnes.split(" ");
        let res = "à,de,";
        if (mots.length >= 1) {
            res += mots[0];
        }
        if (mots.length >= 2) {
            res += `,${mots[0]} ${mots[1]}`;
        }
        if (mots.length >= 3) {
            res += `,${mots[0]} ${mots[1]} ${mots[2]}`;
        }
        return res;

    }

    recupere_valeur_select (name: string) : string {
        return Array.from(document.getElementsByName(name)).filter( elt => (elt as HTMLOptionElement).selected)[0].getAttribute("value") as string;
    }

    elements_de_manipulation_verbes (s: Syntagme, mots: string) {
            byID("modal-ajout-manipulations").style.display = "block";
            byID("modal-ajout-manipulations-titre").innerHTML = `Rentrer les informations nécessaires à la validation d'un verbe sans sujet: ${mots}`;
            byID("ajout-manipulations-form-contenu").innerHTML = this.cree_select("Sujet", "tu,nous,vous,je,j',il,elle,ils,elles", "manipulation-verbe-sans-sujet");
            fonction_du_bouton_des_ajouts_de_manipulations = () => {
                const sujet = this.recupere_valeur_select("manipulation-verbe-sans-sujet");
                s.ajoute_infos_de_manipulation("verbe_noyau",{"pronominalisation":sujet});
                console.log("manip inside",s.infos_de_manipulation("verbe_noyau"));
                byID("modal-ajout-manipulations").style.display = "none";
            }
            fonctions_communes.ok = fonction_du_bouton_des_ajouts_de_manipulations;
    }

    async verification_verbes_sans_sujet(s:Syntagme) {
        if (s.fonctionPos("verbe_noyau").length > 0 && s.fonctionPos("sujet").length === 0) {
            this.elements_de_manipulation_verbes(s, s.fonctionMots("verbe_noyau"));
            let p = new Promise<void>( (r, _) => {
                const f_definie = fonction_du_bouton_des_ajouts_de_manipulations;
                fonction_du_bouton_des_ajouts_de_manipulations = () => {
                    f_definie();
                    r();
                };
                });
            await p.then( () => console.debug("Promise fulfilled"));
        }
        for (let [_, gp] of s.groupes_enchasses()) {
            await this.verification_verbes_sans_sujet(gp);
        }

    }

    elements_de_manipulation(est_valide: boolean) {
        // TODO pour l'attribut, ajouter la possibilité de rentrer si c'est un adjectif, afin de pouvoir suivre les directives du guide et poser soit la question comment, soit quoi
        if (! est_valide) {
            return;
        }
        if ("sujet cod coi groupe_verbal".split(" ").includes(this.fonction_courante.fonction)) {
            const mots_selectionnes = Array.from(document.getElementsByClassName("phrase-selectionne"))
                .map(elt => elt.innerHTML).join(" ");
            const fonction_nom = this.manipulation_titre(mots_selectionnes);
            byID("modal-ajout-manipulations").style.display = "block";
            let fonction_courante = this.fonction_courante; // ce n'est pas inutile: au moment où on va appeler fonction_du_bouton_des_ajouts_de_manipulations, ce ne sera plus la fonction courante

            if ("sujet cod coi".split(" ").includes(this.fonction_courante.fonction)) {
                let pronoms;
                switch (fonction_nom) {
                    case "sujet":
                        pronoms = "je j' tu il elle nous vous ils elles";
                    break;
                    case "COD":
                        pronoms = "me m' te t' le la l' nous vous les";
                    break;
                    case "COI":
                        pronoms = "me m' te t' elle lui nous vous leur en y";
                    break;
                    default:
                        throw fonction_nom;
                }
                pronoms = pronoms.split(" ");

                const pronoms_html = pronoms.includes(mots_selectionnes.toLowerCase()) ? 
                    `<input type="hidden" id="pronom-inutile" name="${fonction_nom}-pronoms" value="null" checked="true">`
                    : `<fieldset class="ajout-manipulations-cadre"><legend class="ajout-manipulations-cadre-titre">Par quoi le ${fonction_nom} peut-il être pronominalisé ?</legend>` +
                        pronoms.map(elt => `<label class="ajout-manipulations-label" for="pronom-${elt}">${elt}` +
                                    `<input type="radio" class="pronoms" id="pronom-${elt}" name="${fonction_nom}-pronoms" value="${elt}" required><span class="ajout-manipulations-radio"></span></label class="ajout-manipulations-label">` 
                                   ).join(" ") +
                    '</fieldset>';

                const prepositions = this.fonction_courante.fonction !== "coi" ? "" :
                    this.cree_select("Par quelle préposition commence la question pour trouver le COI ?",this.cree_liste_preposions_coi(mots_selectionnes),"manipulation-preposition-coi");

                byID("ajout-manipulations-form-contenu").innerHTML = '<fieldset class="ajout-manipulations-cadre"><legend class="ajout-manipulations-cadre-titre">Animé ou non-animé ?</legend>' +
                    `<label class="ajout-manipulations-label" for="est-anime">Le référent du ${fonction_nom} est animé.` +
                    `<input type="radio" id="est-anime" value="true" name="${fonction_nom}-anime" required><span class="ajout-manipulations-radio"></span></label class="ajout-manipulations-label">` +
                    `<label class="ajout-manipulations-label" for="est-non-anime">Le référent du ${fonction_nom} est non animé.` +
                    `<input type="radio" id="est-non-anime" value="false" name="${fonction_nom}-anime" required><span class="ajout-manipulations-radio"></span></label class="ajout-manipulations-label">` +
                    '</fieldset>' +
                    prepositions +
                    pronoms_html;
                fonction_du_bouton_des_ajouts_de_manipulations = () => {
                    const est_anime = (document.getElementsByName(`${fonction_nom}-anime`)[0] as HTMLInputElement).checked;
                    let pronom: string | null = Array.from(document.getElementsByName(`${fonction_nom}-pronoms`)).filter( elt => (elt as HTMLInputElement).checked)[0].getAttribute("value");
                    if (pronom === "null") {
                        pronom = null;
                    }

                    fonction_courante.syntagme.ajoute_infos_de_manipulation(fonction_courante.fonction,(() => {
                        if (fonction_courante.fonction === "coi") {
                            return {est_anime: est_anime, pronominalisation: pronom, preposition: this.recupere_valeur_select("manipulation-preposition-coi")};
                        } else {
                        return {est_anime: est_anime, pronominalisation: pronom};
                        };
                        })());
                    byID("modal-ajout-manipulations").style.display = "none";
                };
            } else if (fonction_courante.fonction === "groupe_verbal") {
                byID("ajout-manipulations-form-contenu").innerHTML = this.cree_select("Verbe pouvant remplacer le groupe verbal", "fais,fait,faisons,faites,font", "manipulation-verbe");
                fonction_du_bouton_des_ajouts_de_manipulations = () => {
                    const verbe = this.recupere_valeur_select("manipulation-verbe");
                    fonction_courante.syntagme.ajoute_infos_de_manipulation("groupe_verbal", {verbe: verbe});
                    byID("modal-ajout-manipulations").style.display = "none";
                }
            }


            fonctions_communes.ok = fonction_du_bouton_des_ajouts_de_manipulations;

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
    //byID("conseil").innerHTML = "Sélectionnez chaque fonction comme si vous étiez vous-même l'élève. Cliquez sur valider quand vous avez terminé votre sélection. Valider dans rien sélectionner indique que cette fonction est absente de la phrase. Vous pouvez toujours corriger une éventuelle erreur en sélectionnant une fonction dans la liste déroulante.";
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
        nouveau_texte = nouveau_texte.replace("\n",'');
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
            // disparition du sous-menu si nécessaire
            Array.from(document.getElementsByClassName("sous_menu_contenu")).
                map(elt => (elt as HTMLElement).style.display = "none");
        };
    };
    fonctions_communes.ok = fonction_du_bouton_de_nouvelle_phrase;
    
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
