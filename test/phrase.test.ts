import {describe, expect, test } from '@jest/globals';
import { MotsPos, Phrase, PhraseCorrigee, PhraseEleve } from '../src/phrase';


describe('Phrase class tests', () => {
  test('Phrase est correctement découpée en mots', () => {
    let p = new Phrase("L'ours a-t-il mangé du miel ?");
    expect(p.longueur).toBe(8);
    expect(p.phraseCassee).toEqual("L ours a t il mangé du miel".split(" "));
  });

  test("Phrase renvoie bien son contenu", () => {
      let p = new Phrase("Le chat mange la souris.");
      let pc = new PhraseCorrigee("L'éléphant joue dans le magasin de porcelaine.");
      let pe = new PhraseEleve("Je dors.",pc);
      expect(p.contenu).toBe("Le chat mange la souris.");
      expect(pe.contenu).toBe("Je dors.");
      expect(pc.contenu).toBe("L'éléphant joue dans le magasin de porcelaine.");
  });

  test('Phrase déclare les bonnes fonctions', () => {
      let p = new Phrase("Le chat a mangé la souris.");
      p.declareFonction("sujet",[0,1]);
      expect(p.fonctionPos("sujet")).toEqual([0,1]);
      expect(p.fonctionMots("sujet")).toBe("Le chat");

      let p2 = new Phrase("L'ordinateur a-t-il été rangé ?");
      let verbe_pos: MotsPos = [2, 5, 6];
      p2.declareFonction("verbe_principal", verbe_pos);
      expect(p2.fonctionMots("verbe_principal")).toBe("a été rangé");
      expect(p2.fonctionPos("verbe_principal")).toEqual(verbe_pos);

  });

  test('PhraseCorrigee vérifie que tel mot a bien telle fonction', () => {
      let p = new PhraseCorrigee("La terre a tressailli d'un souffle prophétique");
      const verbe_pos: MotsPos = [2, 3];
      p.declareFonction("verbe_principal",verbe_pos);
      expect(p.estFonction("verbe_principal",[2,3])).toBe(true);
      // en mettant les numéros dans le désordre
      const verbe_pos2: MotsPos = [2, 3];
      expect(p.estFonction("verbe_principal",verbe_pos2)).toBe(true);
      expect(p.estFonction("sujet",verbe_pos2)).toBe(false);
      expect(p.estFonction("verbe_principal",[2,3,4])).toBe(false);

  });

  test("PhraseCorrigee prend correctement json en charge", () => {
      let p = new PhraseCorrigee("Le chat mange la souris.");
      p.declareFonction("verbes",[2]);
      p.declareFonction("verbe_principal",[2]);
      p.declareFonction("sujet",[0,1]);
      p.declareFonction("cod",[3,4]);
      let p_json_copie = JSON.stringify(p);
      let p_copie = PhraseCorrigee.fromJSON(p_json_copie);
      expect(p_copie.estFonction("verbe_principal",[2])).toBe(true);
      expect(p_copie.estFonction("sujet",[0,1])).toBe(true);
      expect(p_copie.estFonction("cod",[3,4])).toBe(true);
      expect(p_copie.contenu).toBe("Le chat mange la souris.");

  });

  test('PhraseEleve déclare une fonction et on lui répond si c est juste', () => {
      const phrase = "Mon luth constellé porte le soleil noir de la mélancolie.";
      let corrige = new PhraseCorrigee(phrase);
      corrige.declareFonction("verbe_principal",[3]);
      corrige.declareFonction("sujet",[0,1,2]);
      corrige.declareFonction("cod",[4,5,6,7,8,9]);
      let phrase_eleve = new PhraseEleve(phrase, corrige);
      expect(phrase_eleve.declare("verbe_principal",[0])).toBe(false);
      expect(phrase_eleve.fonctionMots("verbe_principal")).toBe("Mon");
      expect(phrase_eleve.declare("verbe_principal",[3])).toBe(true);
  });
});

