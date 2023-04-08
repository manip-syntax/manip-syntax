import './general.css';
import './choix_phrase.css';
import { cree_html_element, non_null } from './util';
import { charge_phrases } from './charge_phrases';

// Sélection de la phrase et affichage du modal
const modal = non_null(document.getElementById("modal-choix-phrase"));
const modal_ferme = non_null(document.getElementById("modal-choix-phrase-ferme"));
modal.style.display = "block";
modal_ferme.onclick = () => modal.style.display = "none";

// affichage des phrases à sélectionner
const phrases = charge_phrases(5,0);
const html_liste = non_null(document.getElementById("modal-choix-phrase-liste"));
console.log(phrases);
phrases.forEach(
    p => cree_html_element(html_liste,"li")
        .innerHTML = p.contenu
);
// sélection d'une phrase
