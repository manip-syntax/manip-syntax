import {describe, expect, test } from '@jest/globals';
import {compare} from '../src/util';


describe('Test de la fonction de comparaison d array', () => {
  test('Teste la comparaison d array', () => {
    expect(compare([1,2,3], [1,2,3])).toBe(true);
    expect(compare([1,2],[1,2,3])).toBe(false);
    expect(compare("ab ab cc".split(" "), "ab ab cc".split(" "))).toBe(true);
  });
});

