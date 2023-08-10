import {describe, expect, test } from '@jest/globals';
import { installe_profondeur } from "../src/affichage_phrase";

document.body.innerHTML = '<div id="base_profondeur">' +
    '<span groupe></span>' + 
    '<span groupe><span groupe></span></span>' +
    '<span groupe><span groupe><span groupe></span></span></span>' +
    '</div>';

describe('Affichage Phrase class tests', () => {
  test('installe_profondeur fonctionne correctement', () => {
      let base = document.getElementById("base_profondeur") as HTMLElement;
      const profondeur = 3;
      installe_profondeur(base, profondeur);
      const _gen = (p: number) => {
          const profondeur = 3, facteur = 10;
          return `0px 0px ${(profondeur -p)* facteur}px`;
      }
      expect((base.children[0] as HTMLElement).style.padding).toBe(_gen(0));
      expect((base.children[1] as HTMLElement).style.padding).toBe(_gen(0));
      expect(((base.children[1] as HTMLElement).children[0] as HTMLElement).style.padding).toBe(_gen(1));
      expect((base.children[2] as HTMLElement).style.padding).toBe(_gen(0));
      expect(((base.children[2] as HTMLElement).children[0] as HTMLElement).style.padding).toBe(_gen(1));
      expect((((base.children[2] as HTMLElement).children[0] as HTMLElement).children[0] as HTMLElement).style.padding).toBe(_gen(2));
  });
});
