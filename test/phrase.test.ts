import {describe, expect, test } from '@jest/globals';
import { GroupeEnchasse, MotsPos, Phrase, PhraseCorrigee, PhraseEleve } from '../src/phrase';


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
      p2.declareFonction("verbes",verbe_pos);
      expect(p2.fonctionMots("verbe_principal")).toBe("a été rangé");
      expect(p2.fonctionPos("verbe_principal")).toEqual(verbe_pos);
      expect(p2.fonctionPos("verbes")).toEqual(verbe_pos);
      expect(() => { p2.fonctionPos("verbe_principal",1);}).toThrow();
      expect(() => { p2.fonctionPos("sujet",0);}).toThrow();
      expect(() => { p2.fonctionPos("balise_textuelle",-1);}).toThrow();
      expect(() => { p2.fonctionPos("complement_circonstanciel");}).toThrow();

      let p3 = new Phrase("Il vécut à Rome dans l'Antiquité.");
      const cc1: MotsPos = [2,3];
      const cc2: MotsPos = [4, 5, 6];
      p3.declareFonction("complement_circonstanciel",cc1);
      p3.declareFonction("complement_circonstanciel",cc2);
      expect(p3.fonctionPos("complement_circonstanciel",0)).toEqual(cc1);
      expect(p3.fonctionPos("complement_circonstanciel",1)).toEqual(cc2);
      expect(p3.fonctionPos("complement_circonstanciel",2)).toEqual([]);
      expect(p3.fonctionPos("modalisateur",0)).toEqual([]);
      expect(p3.fonctionPos("verbes")).toEqual([]);

      p3.declareFonction("complement_circonstanciel",cc1,0); // normalement, pas de nouveau cc, mais on change l'ancien
      expect(p3.fonctionPos("complement_circonstanciel",0)).toEqual(cc1);
      expect(p3.fonctionPos("complement_circonstanciel",2)).toEqual([]);
      expect(() => { p3.declareFonction("auto-enonciative",[1,2],1); }).toThrow();
      expect(p3.fonctionPos("auto-enonciative",0)).toEqual([]);
      expect(() => { p3.declareFonction("complement_circonstanciel",cc1,3);}).toThrow();

      // divers aspects de fonctionMots
      expect( () => { p3.fonctionMots("sujet",0);}).toThrow();
      expect( () => { p3.fonctionMots("modalisateur",0);}).toThrow();
      expect( () => { p3.fonctionMots("complement_circonstanciel",2);}).toThrow();

      // fonction hors borne
      expect( () => { p3.declareFonction("cod", [-1,4]);}).toThrow();
      expect( () => { p3.declareFonction("coi", [2,7]);}).toThrow();

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

  test("Phrase trouve la bonne fonction pour un numéro donné.", () => {
      const phrase = "Les sanglots longs des violons de l'automne blessent mon coeur d'une langueur motone";
      let p = new Phrase(phrase);
      // l'index doit être inférieur à la longueur de la phrase
      expect(p.fonction(phrase.length)).toEqual([]);
      p.declareFonction("verbes",[8]);
      p.declareFonction("verbe_principal",[8]);
      p.declareFonction("sujet",[0,1,2,3,4,5,6,7]);
      p.declareFonction("cod",[9,10]);
      p.declareFonction("coi",[11,12,13,14]);

      expect(p.fonction(8).sort()).toEqual(["verbe_principal","verbes"].sort());
      expect(p.fonction(1).sort()).toEqual(["sujet"]);
      expect(p.fonction(10)).toEqual(["cod"]);

      // fonctions multiples
      const texte = "Il vit en Italie, à Rome.";
      let pp = new Phrase(texte);
      pp.declareFonction("complement_circonstanciel",[2,3]);
      pp.declareFonction("complement_circonstanciel",[4,5]);
      expect(pp.fonction(3)).toEqual(["complement_circonstanciel"]);
      expect(pp.fonction(4)).toEqual(["complement_circonstanciel"]);
  });

  test("Phrase trouve la bonne fonction enchassée pour un numéro donné.", () => {
      const phrase = "Le petit enfant mange.";
      let p = new Phrase(phrase);
      p.declareFonction("sujet",[0,1,2]);
      let gn_sujet = p.cree_groupe_enchasse([0,1,2],"sujet",-1);
      gn_sujet.declareFonction("noyau",[2]);
      gn_sujet.declareFonction("epithete",[1]);
      expect(p.fonction(1).sort()).toEqual(["epithete","sujet"]);
      expect(p.fonction(2).sort()).toEqual(["noyau","sujet"]);
      expect(p.fonction(0)).toEqual(["sujet"]);
  });

  test("Phrase trouve la bonne fonction détaillée pour une position donnée", () => {
      const phrase = "Les sanglots longs des violons de l'automne blessent mon coeur d'une langueur motone";
      let p = new Phrase(phrase);
      // l'index doit être inférieur à la longueur de la phrase
      expect(p.fonction(phrase.length)).toEqual([]);
      p.declareFonction("verbes",[8]);
      p.declareFonction("verbe_principal",[8]);
      p.declareFonction("sujet",[0,1,2,3,4,5,6,7]);
      p.declareFonction("cod",[9,10]);
      p.declareFonction("coi",[11,12,13,14]);
      // test qui permet de vérifier que la valeur de retour est le même array peu importe l'ordre, avec la longueur juste en-dessous
      expect(p.fonction_detaillee(8)).toEqual(expect.arrayContaining([["verbes",8,8], ["verbe_principal",8,8]]));
      expect(p.fonction_detaillee(8)).toHaveLength(2);
      expect(p.fonction_detaillee(3)).toEqual([["sujet",0,7]]);
      expect(p.fonction_detaillee(10)).toEqual([["cod",9,10]]);

      let p2 = new Phrase("Il vécut à Paris en 1801.");
      p2.declareFonction("complement_circonstanciel",[2,3]);
      p2.declareFonction("complement_circonstanciel",[4,5]);
      expect(p2.fonction_detaillee(4)).toEqual([["complement_circonstanciel",4,5]]);
  });

  test("Phrase trouve la bonne fonction détaillée dans le bon ordre pour un numéro donné, enchassements compris", () => {
      const phrase = "L'enfant qui travaille est assis";
      let p = new Phrase(phrase);
      p.declareFonction("sujet",[0,1,2,3]);
      let gn_sujet = p.cree_groupe_enchasse([0,1,2,3], "sujet",-1);
      gn_sujet.declareFonction("noyau",[1]);
      gn_sujet.declareFonction("complement_du_nom",[2,3]);
      expect(p.fonction_detaillee(2)).toEqual([["sujet",0,3],["complement_du_nom",2,3]]);
      expect(p.fonction_detaillee(3)).toEqual([["sujet",0,3],["complement_du_nom",2,3]]);
      expect(p.fonction_detaillee(1)).toEqual([["sujet",0,3],["noyau",1,1]]);
      expect(p.fonction_detaillee(0)).toEqual([["sujet",0,3]]);
  });

  test("Corrige sait si la phrase contient telle ou telle fonction", () => {
      let phrase = new PhraseCorrigee("La critique est aisée.");
      phrase.declareFonction("verbe_principal",[2]);
      phrase.declareFonction("sujet",[0,1]);
      phrase.declareFonction("attribut_du_sujet",[3]);
      expect(phrase.aFonction("sujet")).toBe(true);
      expect(phrase.aFonction("attribut_du_sujet")).toBe(true);
      expect(phrase.aFonction("verbe_principal")).toBe(true);
      expect(phrase.aFonction("cod")).toBe(false);
  });

  test("GroupeEnchasse est bien noté vide quand il l'est, et non s'il est rempli", () => {
      let ge = new GroupeEnchasse([0,2,3,4]);
      expect(ge.vide).toBe(true);

      // vide avec un groupe enchasse vide
      ge.cree_groupe_enchasse([2,3],"cod",-1);
      expect(ge.vide).toBe(true);
      
      // plein avec une fonction unique
      ge.declareFonction("sujet",[0,3]);
      expect(ge.vide).toBe(false);

      // plein avec une fonction multiple
      let ge2 = new GroupeEnchasse([0,1,2,3]);
      ge2.declareFonction("complement_circonstanciel",[0,1],0);
      expect(ge2.vide).toBe(false);
  });

  test("Phrase renvoie les bons groupes enchassés et les supprime", () => {
      let phrase = new Phrase("Le matin, le petit chaperon rouge entra dans le bois où se trouvait un grand méchant loup.");
      const [cc1, cc2] = [[0,1], [7,8,9,10,11,12,13,14,15,16]];
      phrase.cree_groupe_enchasse(cc1, "complement_circonstanciel",0);
      phrase.cree_groupe_enchasse(cc2, "complement_circonstanciel",1);
      expect(phrase.groupe_enchasse("complement_circonstanciel",0).mots_pos).toEqual(cc1);
      expect(phrase.groupe_enchasse("complement_circonstanciel",1).mots_pos).toEqual(cc2);
      expect(phrase.supprime_groupe_enchasse("complement_circonstanciel",0)).toBe(true);
      expect(phrase.supprime_groupe_enchasse("sujet",-1)).toBe(false);
      expect(() => phrase.groupe_enchasse("complement_circonstanciel",0)).toThrow();

  });

  test("Phrase copie correctement", () => {
      let sa = new Phrase("Peu importe le contenu pourvu qu'il soit assez long pour correspondre aux numéros des fonctions déclarées.");
      sa.declareFonction("sujet",[0,1,2]);
      sa.declareFonction("complement_circonstanciel",[3,4,5],0);
      sa.declareFonction("complement_circonstanciel",[6,7,8],1);
      let copie = sa.copie;
      expect(copie.fonctionPos("sujet")).toEqual([0,1,2]);
      expect(copie.fonctionPos("complement_circonstanciel",0)).toEqual([3,4,5]);
      expect(copie.fonctionPos("complement_circonstanciel",1)).toEqual([6,7,8]);

      let ge = sa.cree_groupe_enchasse([0,1,2],"coi",-1);
      expect(sa.groupes_enchasses_nombre).toBe(1);
      copie = sa.copie;
      // copie ne doit pas avoir de groupe enchâssé puisque le contenu de ce groupe est vide
      expect(copie.groupes_enchasses_nombre).toBe(0);
      // ceci n'est pas un doublon, mais une vérification que la copie n'a pas retiré le groupe enchâssé de l'original
      expect(sa.groupes_enchasses_nombre).toBe(1);
      ge.declareFonction("epithete",[0]);
      expect(sa.copie.groupes_enchasses_nombre).toBe(1);
  });
});

