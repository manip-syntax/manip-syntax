import {describe, expect, test } from '@jest/globals';
import { Phrase } from '../src/phrase';


describe('Phrase class tests', () => {
  test('Phrase est correctement découpée en mots', () => {
    let p = new Phrase("L'ours a-t-il mangé du miel ?");
    expect(p.longueur).toBe(8);
    expect(p.phraseCassee).toEqual("L ours a t il mangé du miel".split(" "));
  });

  test('Phrase déclare les bonnes fonctions', () => {
      let p = new Phrase("Le chat a mangé la souris.");
      p.declareFonction("sujet",[0,1]);
      expect(p.fonctionPos("sujet")).toEqual([0,1]);

  });
});

