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
        const fonction: Fonction = consignes[this._consignes_etape][0] as Fonction;
        if (!this._corrige.aFonction(fonction)) {
            this.analyse_suivante(fonction);
            return;
        }

        if (SyntagmeEleve.Fonctions_multiples.includes(fonction) && this._fonctions_multiples_index === -1) {
            this._fonctions_multiples_index = 0;
        }
        const consigne = consignes[this._consignes_etape][1] + (this._fonctions_multiples_index >= 0 ? ` (${this._fonctions_multiples_index + 1})` : "");

        // affichage
        byID("consigne-container").innerHTML = affiche_consigne(consigne, this._syntagme);
        byID("phrase-analyse-paragraphe").innerHTML = affiche_phrase(this._syntagme, this._syntagme.mots_pos);
        dispose(byID("phrase-analyse-paragraphe"));

        // validation
        fonctions_communes.fonction_de_validation = () => {
            const mots_selectionnes = Array.from(document.getElementsByClassName("phrase-selectionne"))
                                  .map(elt => Number(elt.id.split('-')[2]));
            if (mots_selectionnes.length === 0) {
                return;
            }
            this.valider_fonction(mots_selectionnes, fonction);
        }
        fonctions_communes.ok = fonctions_communes.fonction_de_validation;
    }

    recommence_analyse (mots_selectionnes: MotsPos) {
        this.analyse_fonction();
        // préselection des mots précédemment choisis
        Array.from(document.getElementsByClassName("phrase-cliquable"))
            .forEach( elt => {
                if (mots_selectionnes.includes(Number(elt.id.split('-')[2]))) {
                    elt.classList.add("phrase-selectionne");
                }
            });
    }

    async analyse_suivante (fonction: Fonction) {
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
            const j = SyntagmeEleve.Fonctions_multiples.includes(fonction) && !this._syntagme.est_complet(fonction) ? 0 : 1;
            this._fonctions_multiples_index = j === 0 ? this._fonctions_multiples_index + 1 : -1;
            this._consignes_etape++;
            return this.analyse_fonction();
        }
    }

    valider_fonction(mots_selectionnes: MotsPos, fonction: Fonction) {
        let reponse_correcte = this._syntagme.declare(fonction, mots_selectionnes, this._fonctions_multiples_index);
        if (!reponse_correcte) {
            const modal_message = byID("modal-message-contenu");
            modal_message.classList.add("modal-message-erreur");
            // TODO on pourrait peut-être être plus précis et dire s'il manque des mots, par exemple, ou si tous les mots sont faux
            definit_message_modal("Il y a une erreur dans ton analyse !", "Reprendre l'analyse", () => {
                modal_message.classList.remove("modal-message-erreur");
                this.recommence_analyse;});
        } else {
            this.analyse_suivante(fonction);
        }
    }
}





/*
    fonctions_communes.fonction_de_validation = () => {

        if (fonction === "attribut_du_sujet") {
            manipulation_fonction(fonction, syntagme_eleve, mots_selectionnes);
        }

        if (fonction === "sujet") {
            const promesse_manipulation = new Promise<void>( (valider, annuler) => {
                manipulation_fonction(fonction, syntagme_eleve, mots_selectionnes);
                byID("manipulations-form").addEventListener("submit", e => {
                    byID("modal-manipulations").style.display = "none";
                    e.preventDefault();
                    valider();
                }, {once: true});
                byID("modal-manipulations-annuler").addEventListener("click", () => {
                    byID("modal-manipulations").style.display = "none";
                    annuler();
                }, {once: true});
            });
            promesse_manipulation.then(suite_validation, recommence_analyse);
        } else {
            suite_validation();
        }

    };
    */


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

