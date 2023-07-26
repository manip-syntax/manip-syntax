import {describe, expect, test } from '@jest/globals';
import { CreateurPhrase} from '../src/nouvelle_phrase';

document.body.innerHTML = '<div id="nouvelle_phrase-fonctions-selection">' +
    '</div>';

describe('Nouvelle Phrase class tests', () => {
  test('CreateurPhrase est correctement construit', () => {
      let cp = new CreateurPhrase("L'homme est un loup pour l'homme.");
      expect(cp.pos).toBe(0);
  });
});

