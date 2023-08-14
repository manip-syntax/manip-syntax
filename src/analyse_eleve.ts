import {Fonction, MotsPos, SyntagmeCorrige, SyntagmeEleve } from "./phrase";
import { charge_phrases } from './charge_phrases';
import { affiche_phrase, affiche_consigne, dispose } from './affichage_phrase';
import { anime_disparition_modal, byID, cree_html_element } from "./util";
import { definit_message_modal, fonctions_communes } from "./fonctions_partagees";
import { manipulation_fonction} from './manipulation';
import consignes from './consignes.json';


export function analyse_phrase(phrase_corrigee: SyntagmeCorrige): void {
    let phrase_eleve = new SyntagmeEleve(phrase_corrigee.contenu, phrase_corrigee);

    let analyseur = new Analyseur(phrase_eleve);
    analyseur.analyse_fonction();

}

class Analyseur {
    private _consignes_etape: number = 0;
    private _fonctions_multiples_index: number = -1;
    private _groupes_enchasses_generateur: Generator<[[Fonction, number], SyntagmeCorrige], void, unknown>;
    private _corrige: SyntagmeCorrige;
    private _id: number;
    private _fonction_courante: Fonction = "sujet";
    private _mots_selectionnes: MotsPos = [];
    static current_id: number = 0;

    constructor(private _syntagme: SyntagmeEleve) {
        this._syntagme = _syntagme;
        this._corrige = _syntagme.corrige;
        this._groupes_enchasses_generateur = _syntagme.corrige.groupes_enchasses();
        this._id = Analyseur.current_id++;
    }

    get id(): number {
        return this._id;
    }

    analyse_finie(): void {
        if (this._syntagme.arbre_genealogique.length === 1) {
            // on est à la fin de la phrase: on peut donc commencer une autre analyse
            definit_message_modal("Bravo !", "Commencer une autre analyse", selectionne_phrase);
        }

        const e = new Event(`AnalyseFinie-${this._id}`);
        document.dispatchEvent(e);
    }

    analyse_fonction(): void {
        this._fonction_courante = consignes[this._consignes_etape][0] as Fonction;
        if (!this._corrige.aFonction(this._fonction_courante)) {
            this.analyse_suivante();
            return;
        }

        if (SyntagmeEleve.Fonctions_multiples.includes(this._fonction_courante) && this._fonctions_multiples_index === -1) {
            this._fonctions_multiples_index = 0;
        }
        const consigne = consignes[this._consignes_etape][1] + (this._fonctions_multiples_index >= 0 ? ` (${this._fonctions_multiples_index + 1})` : "");

        // affichage
        byID("consigne-container").innerHTML = affiche_consigne(consigne, this._syntagme);
        byID("phrase-analyse-paragraphe").innerHTML = affiche_phrase(this._syntagme, this._syntagme.mots_pos);
        dispose(byID("phrase-analyse-paragraphe"));

        // validation
        fonctions_communes.fonction_de_validation = () => {
            this._mots_selectionnes = Array.from(document.getElementsByClassName("phrase-selectionne"))
                                  .map(elt => Number(elt.id.split('-')[2]));
            if (this._mots_selectionnes.length === 0) {
                return;
            }
            this._syntagme.declare(this._fonction_courante, this._mots_selectionnes, this._fonctions_multiples_index);
            this.manipule_fonction();
        }
        fonctions_communes.ok = fonctions_communes.fonction_de_validation;
        this.preselection();
    }

    preselection() {
        const indices = this._syntagme.fonctionPos(this._fonction_courante, this._fonctions_multiples_index);
        Array.from(document.getElementsByClassName("phrase-cliquable"))
            .forEach( (elt, i) => {
                if (indices.includes(i)) {
                    elt.classList.add("phrase-selectionne");
                }
            });
    }


    async analyse_suivante () {
        if (this._consignes_etape === consignes.length -1) {
            // on passe aux groupes enchâssés
            for (let [[f, n], groupe_enchasse] of this._groupes_enchasses_generateur) {
                const analyseur = new Analyseur( this._syntagme.cree_groupe_enchasse_eleve(groupe_enchasse, f, n));
                const promesse_analyse = new Promise<void> ( (r, _) => {
                    analyseur.analyse_fonction();
                    document.addEventListener(`AnalyseFinie-${analyseur.id}`, () => {
                        r();
                    }, {once: true});
                });
                await promesse_analyse.then( () => console.log("promise ok"));
            }
            return this.analyse_finie();
        } else {
            const j = SyntagmeEleve.Fonctions_multiples.includes(this._fonction_courante) && !this._syntagme.est_complet(this._fonction_courante) ? 0 : 1;
            this._fonctions_multiples_index = j === 0 ? this._fonctions_multiples_index + 1 : -1;
            this._consignes_etape++;
            return this.analyse_fonction();
        }
    }

    affiche_erreur() {
        const modal_message = byID("modal-message-contenu");
        modal_message.classList.add("modal-message-erreur");
        // TODO on pourrait peut-être être plus précis et dire s'il manque des mots, par exemple, ou si tous les mots sont faux
        definit_message_modal("Il y a une erreur dans ton analyse !", "Reprendre l'analyse", () => {
            modal_message.classList.remove("modal-message-erreur");
            });
    }

    soumettre_fonction(f: Fonction, nf: number) {
        let reponse_correcte = this._syntagme.est_correct(f, nf);
        if (!reponse_correcte) {
            this.affiche_erreur();
        } else {
            this.analyse_suivante();
        }
    }

    prepare_manipulation(f: Fonction, disparition_modal: boolean = true) {
        const analyseur = this; // pour éviter les problèmes liés à this

        return new Promise<void>( (valider, annuler) => {
            manipulation_fonction(f, analyseur._syntagme, analyseur._syntagme.fonctionPos(f));
            byID("modal-manipulations-OK").addEventListener("click", () => {
                if (disparition_modal) {
                    anime_disparition_modal(byID("modal-manipulations-contenu"), byID("modal-manipulations"));
                }
                valider();
            }, {once: true});
            byID("modal-manipulations-annuler").addEventListener("click", () => {
                byID("modal-manipulations").style.display = "none";
                annuler();
            }, {once: true});
        });
    }

    manipule_fonction() {
        const analyseur = this; // pour éviter les problèmes liés à this
        // sale...
        const numero_d_etape = (f: Fonction) => consignes.map( (e, i) => [e[0], i]).filter( e => e[0] === f)[0][1] as number;

        if (this._fonction_courante === "sujet") {
            if (!this._corrige.est_attributif) {
                this.prepare_manipulation(this._fonction_courante)
                .then( () => {
                    analyseur.soumettre_fonction(analyseur._fonction_courante, analyseur._fonctions_multiples_index);
                },
                     () => {
                         analyseur.analyse_fonction();
                });
                return;
            }
            this.analyse_suivante();
            return;
            // si attribut, on attend l'attribut avant de manipuler et on ne vérifie pas
        }

        else if (this._fonction_courante === "attribut_du_sujet") {
            this.prepare_manipulation("sujet", false)
            .then( () => {
                return analyseur.prepare_manipulation("attribut_du_sujet");
            },
            () => {
                throw "sujet";
            })
            .then ( () => {
                // vérification des deux fonctions
                if (!analyseur._syntagme.est_correct("sujet")) {
                    analyseur.affiche_erreur();
                    analyseur._consignes_etape = numero_d_etape("sujet");
                    analyseur.analyse_fonction();
                } else if (!analyseur._syntagme.est_correct("attribut_du_sujet")) {
                    analyseur.affiche_erreur();
                    analyseur._consignes_etape = numero_d_etape("attribut_du_sujet");
                    analyseur.analyse_fonction();
                } else {
                    analyseur.analyse_suivante();
                }
            },
            (e) => {
                if (e !== "sujet") {
                    throw "attribut_du_sujet";
                }
                throw e;
            })
            .catch ( (e) => {
                if (e === "sujet") {
                    analyseur._consignes_etape = numero_d_etape("sujet");
                } else if (e === "attribut_du_sujet") {
                    analyseur._consignes_etape = numero_d_etape("attribut_du_sujet");
                } else {
                    throw e;
                }
                analyseur.analyse_fonction();

            });
            return;
        }
        this.soumettre_fonction(this._fonction_courante, this._fonctions_multiples_index);
    }
}




export function selectionne_phrase() {
    // Sélection de la phrase et affichage du modal
    const modal = byID("modal-choix-phrase");
    modal.style.display = "block";

    // affichage des phrases à sélectionner
    const phrases = charge_phrases(5,0);
    const html_liste = byID("modal-choix-phrase-liste");
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
            anime_disparition_modal(byID("modal-choix-phrase-contenu"), modal);
        });

    }
}

