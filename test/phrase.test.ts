import {describe, expect, test } from '@jest/globals';
import { MotsPos, Syntagme, SyntagmeCorrige, SyntagmeEleve } from '../src/phrase';


describe('Syntagme class tests', () => {
  test('Syntagme est correctement découpée en mots', () => {
    let p = new Syntagme("L'ours a-t-il mangé du miel ?");
    expect(p.longueur).toBe(8);
    expect(p.phraseCassee).toEqual("L ours a t il mangé du miel".split(" "));
  });

  test("Syntagme renvoie bien son contenu", () => {
      let p = new Syntagme("Le chat mange la souris.");
      let pc = new SyntagmeCorrige("L'éléphant joue dans le magasin de porcelaine.");
      let pe = new SyntagmeEleve("Je dors.",pc);
      expect(p.contenu).toBe("Le chat mange la souris.");
      expect(pe.contenu).toBe("Je dors.");
      expect(pc.contenu).toBe("L'éléphant joue dans le magasin de porcelaine.");
  });

  test('Syntagme déclare les bonnes fonctions', () => {
      let p = new Syntagme("Le chat a mangé la souris.");
      p.declareFonction("sujet",[0,1]);
      expect(p.fonctionPos("sujet")).toEqual([0,1]);
      expect(p.fonctionMots("sujet")).toBe("Le chat");

      let p2 = new Syntagme("L'ordinateur a-t-il été rangé ?");
      let verbe_pos: MotsPos = [2, 5, 6];
      p2.declareFonction("verbe_noyau", verbe_pos);
      p2.declareFonction("verbes",verbe_pos);
      expect(p2.fonctionMots("verbe_noyau")).toBe("a été rangé");
      expect(p2.fonctionPos("verbe_noyau")).toEqual(verbe_pos);
      expect(p2.fonctionPos("verbes")).toEqual(verbe_pos);
      expect(() => { p2.fonctionPos("verbe_noyau",1);}).toThrow();
      expect(() => { p2.fonctionPos("sujet",0);}).toThrow();
      expect(() => { p2.fonctionPos("balise_textuelle",-1);}).toThrow();
      expect(() => { p2.fonctionPos("complement_circonstanciel");}).toThrow();

      let p3 = new Syntagme("Il vécut à Rome dans l'Antiquité.");
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

  test('SyntagmeCorrige vérifie que tel mot a bien telle fonction', () => {
      let p = new SyntagmeCorrige("La terre a tressailli d'un souffle prophétique");
      const verbe_pos: MotsPos = [2, 3];
      p.declareFonction("verbe_noyau",verbe_pos);
      expect(p.estFonction("verbe_noyau",[2,3])).toBe(true);
      // en mettant les numéros dans le désordre
      const verbe_pos2: MotsPos = [2, 3];
      expect(p.estFonction("verbe_noyau",verbe_pos2)).toBe(true);
      expect(p.estFonction("sujet",verbe_pos2)).toBe(false);
      expect(p.estFonction("verbe_noyau",[2,3,4])).toBe(false);

  });

  test("SyntagmeCorrige prend correctement json en charge", () => {
      let p = new SyntagmeCorrige("Le chat mange la souris.");
      p.declareFonction("verbes",[2]);
      p.declareFonction("verbe_noyau",[2]);
      p.declareFonction("sujet",[0,1]);
      p.declareFonction("cod",[3,4]);
      let p_json_copie = JSON.stringify(p);
      let p_copie = SyntagmeCorrige.fromJSON(p_json_copie);
      expect(p_copie.estFonction("verbe_noyau",[2])).toBe(true);
      expect(p_copie.estFonction("sujet",[0,1])).toBe(true);
      expect(p_copie.estFonction("cod",[3,4])).toBe(true);
      expect(p_copie.contenu).toBe("Le chat mange la souris.");

  });

  test('SyntagmeEleve déclare une fonction et on lui répond si c est juste', () => {
      const phrase = "Mon luth constellé porte le soleil noir de la mélancolie.";
      let corrige = new SyntagmeCorrige(phrase);
      corrige.declareFonction("verbe_noyau",[3]);
      corrige.declareFonction("sujet",[0,1,2]);
      corrige.declareFonction("cod",[4,5,6,7,8,9]);
      let phrase_eleve = new SyntagmeEleve(phrase, corrige);
      expect(phrase_eleve.declare("verbe_noyau",[0])).toBe(false);
      expect(phrase_eleve.fonctionMots("verbe_noyau")).toBe("Mon");
      expect(phrase_eleve.declare("verbe_noyau",[3])).toBe(true);
  });

  test("Syntagme trouve la bonne fonction pour un numéro donné.", () => {
      const phrase = "Les sanglots longs des violons de l'automne blessent mon coeur d'une langueur motone";
      let p = new Syntagme(phrase);
      // l'index doit être inférieur à la longueur de la phrase
      expect(p.fonction(phrase.length)).toEqual([]);
      p.declareFonction("verbes",[8]);
      p.declareFonction("verbe_noyau",[8]);
      p.declareFonction("sujet",[0,1,2,3,4,5,6,7]);
      p.declareFonction("cod",[9,10]);
      p.declareFonction("coi",[11,12,13,14]);

      expect(p.fonction(8).sort()).toEqual(["verbe_noyau","verbes"].sort());
      expect(p.fonction(1).sort()).toEqual(["sujet"]);
      expect(p.fonction(10)).toEqual(["cod"]);

      // fonctions multiples
      const texte = "Il vit en Italie, à Rome.";
      let pp = new Syntagme(texte);
      pp.declareFonction("complement_circonstanciel",[2,3]);
      pp.declareFonction("complement_circonstanciel",[4,5]);
      expect(pp.fonction(3)).toEqual(["complement_circonstanciel"]);
      expect(pp.fonction(4)).toEqual(["complement_circonstanciel"]);
  });

  test("Syntagme trouve la bonne fonction enchassée pour un numéro donné.", () => {
      const phrase = "Le petit enfant mange.";
      let p = new Syntagme(phrase);
      p.declareFonction("sujet",[0,1,2]);
      let gn_sujet = p.cree_groupe_enchasse([0,1,2],"sujet",-1);
      gn_sujet.declareFonction("noyau",[2]);
      gn_sujet.declareFonction("epithete",[1]);
      expect(p.fonction(1).sort()).toEqual(["epithete","sujet"]);
      expect(p.fonction(2).sort()).toEqual(["noyau","sujet"]);
      expect(p.fonction(0)).toEqual(["sujet"]);
  });

  test("Syntagme trouve la bonne fonction détaillée pour une position donnée", () => {
      const phrase = "Les sanglots longs des violons de l'automne blessent mon coeur d'une langueur motone";
      let p = new Syntagme(phrase);
      // l'index doit être inférieur à la longueur de la phrase
      expect(p.fonction(phrase.length)).toEqual([]);
      p.declareFonction("verbes",[8]);
      p.declareFonction("verbe_noyau",[8]);
      p.declareFonction("sujet",[0,1,2,3,4,5,6,7]);
      p.declareFonction("cod",[9,10]);
      p.declareFonction("coi",[11,12,13,14]);
      // test qui permet de vérifier que la valeur de retour est le même array peu importe l'ordre, avec la longueur juste en-dessous
      expect(p.fonction_detaillee(8)).toEqual(expect.arrayContaining([["verbes",8,8], ["verbe_noyau",8,8]]));
      expect(p.fonction_detaillee(8)).toHaveLength(2);
      expect(p.fonction_detaillee(3)).toEqual([["sujet",0,7]]);
      expect(p.fonction_detaillee(10)).toEqual([["cod",9,10]]);

      let p2 = new Syntagme("Il vécut à Paris en 1801.");
      p2.declareFonction("complement_circonstanciel",[2,3]);
      p2.declareFonction("complement_circonstanciel",[4,5]);
      expect(p2.fonction_detaillee(4)).toEqual([["complement_circonstanciel",4,5]]);
  });

  test("Syntagme trouve la bonne fonction détaillée dans le bon ordre pour un numéro donné, enchassements compris", () => {
      const phrase = "L'enfant qui travaille est assis";
      let p = new Syntagme(phrase);
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
      let phrase = new SyntagmeCorrige("La critique est aisée.");
      phrase.declareFonction("verbe_noyau",[2]);
      phrase.declareFonction("sujet",[0,1]);
      phrase.declareFonction("attribut_du_sujet",[3]);
      expect(phrase.aFonction("sujet")).toBe(true);
      expect(phrase.aFonction("attribut_du_sujet")).toBe(true);
      expect(phrase.aFonction("verbe_noyau")).toBe(true);
      expect(phrase.aFonction("cod")).toBe(false);
  });

  test("Syntagme est bien noté vide quand il l'est, et non s'il est rempli", () => {
      let ge = new Syntagme("Une phrase sans importance",[0,2,3,4]);
      expect(ge.vide).toBe(true);

      // vide avec un groupe enchasse vide
      ge.cree_groupe_enchasse([2,3],"cod",-1);
      expect(ge.vide).toBe(true);
      
      // plein avec une fonction unique
      ge.declareFonction("sujet",[0,3]);
      expect(ge.vide).toBe(false);

      // plein avec une fonction multiple
      let ge2 = new Syntagme("",[0,1,2,3]);
      ge2.declareFonction("complement_circonstanciel",[0,1],0);
      expect(ge2.vide).toBe(false);
  });

  test("Syntagme renvoie les bons groupes enchassés et les supprime", () => {
      let phrase = new Syntagme("Le matin, le petit chaperon rouge entra dans le bois où se trouvait un grand méchant loup.");
      const [cc1, cc2] = [[0,1], [7,8,9,10,11,12,13,14,15,16]];
      phrase.cree_groupe_enchasse(cc1, "complement_circonstanciel",0);
      phrase.cree_groupe_enchasse(cc2, "complement_circonstanciel",1);
      expect(phrase.groupe_enchasse("complement_circonstanciel",0).mots_pos).toEqual(cc1);
      expect(phrase.groupe_enchasse("complement_circonstanciel",1).mots_pos).toEqual(cc2);
      expect(phrase.supprime_groupe_enchasse("complement_circonstanciel",0)).toBe(true);
      expect(phrase.supprime_groupe_enchasse("sujet",-1)).toBe(false);
      expect(() => phrase.groupe_enchasse("complement_circonstanciel",0)).toThrow();

  });

  test("Syntagme copie correctement", () => {
      let sa = new Syntagme("Peu importe le contenu pourvu qu'il soit assez long pour correspondre aux numéros des fonctions déclarées.");
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

  test("SyntagmeEleve et SyntagmeCorrige gèrent correctement les syntagmes multiples", () => {
      const phrase = "Hier, j'étais à Paris.";
      let pc = new SyntagmeCorrige(phrase);
      pc.declareFonction("complement_circonstanciel",[0]);
      pc.declareFonction("complement_circonstanciel",[3,4]);
      let pe = new SyntagmeEleve(phrase, pc);
      expect(pc.estFonction("complement_circonstanciel",[1])).toBe(false);
      expect(pe.declare("complement_circonstanciel",[1],0)).toBe(false);
      expect(pe.declare("complement_circonstanciel",[0],0)).toBe(true);
      expect(pe.declare("complement_circonstanciel",[0],1)).toBe(false);
      expect(pe.declare("complement_circonstanciel",[3,4],1)).toBe(true);
  });

  test("cree_groupe_enchasse fonctionne correctement", () => {
      const texte = "Je fais ce que je veux.";

      let pc = new SyntagmeCorrige(texte);
      pc.cree_groupe_enchasse([2,3,4,5], "cod", -1);
      let gec = pc.groupe_enchasse("cod",-1);
      gec.declareFonction("complement_du_pronom",[3,4,5]);
      gec.declareFonction("noyau",[2]);

      let pe = new SyntagmeEleve(texte, pc);
      let gee = pe.cree_groupe_enchasse_eleve(gec, "cod",-1);
      expect(gee.declare("complement_du_pronom",[3,4,5], 0)).toBe(true);

  });

  test("Les groupes enchâssés sont correctement sérialisés en JSON", () => {
      let texte = "L'âne de Buridan mourut de faim et de soif.";
      let p = new Syntagme(texte);
      let g = p.cree_groupe_enchasse([0,1,2,3], "sujet",-1);
      g.declareFonction("noyau",[1]);
      g.declareFonction("complement_du_nom",[2,3])

      const json = JSON.stringify(p);
      const pp = SyntagmeCorrige.fromJSON(json);
      const gp = pp.groupe_enchasse("sujet",-1);
      expect(gp.mots_pos).toEqual([0,1,2,3]);
      expect(gp.fonctionPos("noyau")).toEqual([1]);
      expect(gp.fonctionPos("complement_du_nom",0)).toEqual([2,3]);
      expect(gp.aFonction("complement_du_nom")).toBe(true);
  });

  test("La profondeur est d'un groupe enchâssé est correcte", () => {
      let g = new Syntagme("Une phrase sans importance.",[0,1,2,3,4]);
      expect(g.profondeur).toBe(0);
      let g2 = g.cree_groupe_enchasse([2,3,4], "cod",-1);
      expect(g.profondeur).toBe(1);
      expect(g2.profondeur).toBe(0);
      let g22 = g.cree_groupe_enchasse([1],"sujet",-1);
      expect(g22.profondeur).toBe(0);
      expect(g.profondeur).toBe(1);
      g2.cree_groupe_enchasse([3], "complement_du_nom",0);
      expect(g.profondeur).toBe(2);
      expect(g2.profondeur).toBe(1);
  });

  test("Les mots sans fonction sont bien renvoyés à la demande", () => {
      const base = [0,1,2,3,4,5,6];
      let g = new Syntagme("Une phrase sans importance.",base);
      expect(g.mots_sans_fonction).toEqual(base);
      g.declareFonction("sujet",[0,1,2,3]);
      expect(g.mots_sans_fonction).toEqual([4,5,6]);
      g.declareFonction("verbe_noyau",[4,5]);
      expect(g.mots_sans_fonction).toEqual([6]);

  });

  test("Un syntagme quelconque est bien reconnu attributif ou non selon le cas", () => {
      let g = new Syntagme("Une phrase sans importance.",[0,1,2,3]);
      expect(g.est_attributif).toBe(false);
      g.declareFonction("sujet",[0]);
      expect(g.est_attributif).toBe(false);
      g.declareFonction("attribut_du_sujet",[2]);
      expect(g.est_attributif).toBe(true);

  });

  test("Mots offset et texte_pos fonctionnent correctement", () => {
      let s = new Syntagme("Le chat, noir et blanc, mange dans la cuisine : il ronronne.");
      expect(s._remplit_mots_offset()).toEqual([
      [ 0, 2 ],   [ 3, 7 ],
      [ 9, 13 ],  [ 14, 16 ],
      [ 17, 22 ], [ 24, 29 ],
      [ 30, 34 ], [ 35, 37 ],
      [ 38, 45 ], [ 46, 47 ],
      [ 48, 50 ], [ 51, 59 ]
    ]);
    expect(s.texte_pos([0,1])).toEqual("Le chat");
    expect(s.texte_pos([0,1,2,3,4])).toEqual("Le chat, noir et blanc");
    expect(s.texte_pos([0,1,5])).toEqual("Le chat mange");
  });
});

