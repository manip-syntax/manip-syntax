import './general.css';
import './choix_phrase.css';
import { non_null } from './util';

// Sélection de la phrase et affichage du modal
const modal = non_null(document.getElementById("modal-choix-phrase"));
const modal_ferme = non_null(document.getElementById("modal-choix-phrase-ferme"));
modal.style.display = "block";
modal_ferme.onclick = () => modal.style.display = "none";

// affichage des phrases à sélectionner
// sélection d'une phrase
