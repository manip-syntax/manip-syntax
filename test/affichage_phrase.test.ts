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
      installe_profondeur(base, 3);
      expect((base.children[0] as HTMLElement).style.margin).toBe("5px");
      expect((base.children[1] as HTMLElement).style.margin).toBe("5px");
      expect(((base.children[1] as HTMLElement).children[0] as HTMLElement).style.margin).toBe("4px");
      expect((base.children[2] as HTMLElement).style.margin).toBe("5px");
      expect(((base.children[2] as HTMLElement).children[0] as HTMLElement).style.margin).toBe("4px");
      expect((((base.children[2] as HTMLElement).children[0] as HTMLElement).children[0] as HTMLElement).style.margin).toBe("3px");
  });
});
