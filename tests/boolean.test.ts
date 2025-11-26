import { describe, expect, it } from "vitest";
import { select, falsy, truthy, allFalsy, allTruthy, anyFalsy, anyTruthy } from '../src';

describe('boolean', () => {
    it('select chooses correct branch for boolean and function predicate', () => {
        expect(select({ pred: true, t: () => 'yes', f: () => 'no' })).toBe('yes');
        expect(select({ pred: false, t: () => 'yes', f: () => 'no' })).toBe('no');
        expect(select({ pred: () => 1 > 0, t: () => 1 })).toBe(1);
        expect(select({ pred: () => false })).toBeUndefined();
    });

    it('falsy/truthy helpers work', () => {
        expect(falsy(0)).toBe(true);
        expect(truthy(1)).toBe(true);
        expect(allFalsy(0, '', null)).toBe(true);
        expect(anyFalsy(0, 1)).toBe(true);
        expect(allTruthy(1, 'a', true)).toBe(true);
        expect(anyTruthy(0, 'a')).toBe(true);
    });
});