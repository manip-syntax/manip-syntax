import './general.css';
import './choix_phrase.css';
import { cree_html_element, non_null } from './util';
import { charge_phrases } from './charge_phrases';
import { PhraseCorrigee, PhraseEleve } from './phrase';

function analyse_phrase(phrase_corrigee: PhraseCorrigee) {
    console.log(phrase_corrigee);
    let phrase_eleve = new PhraseEleve(phrase_corrigee.contenu, phrase_corrigee);
    non_null(document.getElementById("phrase-analyse")).innerHTML = phrase_eleve.contenu;

}

// Sélection de la phrase et affichage du modal
const modal = non_null(document.getElementById("modal-choix-phrase"));
const modal_ferme = non_null(document.getElementById("modal-choix-phrase-ferme"));
modal.style.display = "block";
modal_ferme.onclick = () => modal.style.display = "none";

// affichage des phrases à sélectionner
const phrases = charge_phrases(5,0);
const html_liste = non_null(document.getElementById("modal-choix-phrase-liste"));

for (let i in phrases) {
    const p = phrases[i];
    const html_elt = cree_html_element(html_liste,"li",
                                       {id:`modal-choix-phrase-liste-${i}`});
    html_elt.innerHTML = p.contenu;
    // sélection d'une phrase
    html_elt.addEventListener('click',() => {
        analyse_phrase(phrases[i]);
        modal.style.display = "none";
    });

}


