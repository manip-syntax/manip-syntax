import {describe, expect, test } from '@jest/globals';
import {compare, elision, non_null, strNoAccent } from '../src/util';


describe('Test de la fonction de comparaison d array', () => {
  test('Teste la comparaison d array', () => {
    expect(compare([1,2,3], [1,2,3])).toBe(true);
    expect(compare([1,2],[1,2,3])).toBe(false);
    expect(compare("ab ab cc".split(" "), "ab ab cc".split(" "))).toBe(true);
  });
});

describe("Fonctionnement de non_null", () => {
    test('Vérifie que non_null renvoie une erreur', () => {
        expect(() => non_null(null)).toThrow(TypeError);
    });
    test('Vérifie que non_null renvoie bien le bon objet si pas d erreur', () => {
        expect(non_null(5)).toBe(5);
    });
});

describe("Fonctionnement de strNoAccent", () => {
    test("Vérifie que strNoAccent retire les accents", () => {
        expect( strNoAccent("àèù é âêîôûŷ äëïöüÿ")).toBe("aeu e aeiouy aeiouy");
    });
});

describe("Fonctionnement de elision", () => {
    test("Fonctionnement correct de elision: première lettre voyelle", () => {
        expect(elision("que","il")).toBe("qu'il");
        expect(elision("que","à")).toBe("qu'à");
        expect(elision("le","animal")).toBe("l'animal");
        expect(elision("que","Elle")).toBe("qu'Elle");
    });
    test("Fonctionnement correct de elision: première lettre consonne",() => {
        expect(elision("que","Jean")).toBe("que Jean");
    });
});

