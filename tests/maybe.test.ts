import { describe, it, expect } from 'vitest';
import { Maybe } from '../src/typeclass/maybe.js';

describe('typeclass - Maybe', () => {
    it('some and none behave as expected', () => {
        const a = Maybe.some(2);
        expect(a.map(x => x * 2).getOr(0)).toBe(4);
        expect(a.flatMap(x => Maybe.some(x + 1)).getOr(0)).toBe(3);

        const n = Maybe.none<number>();
        expect(n.getOr(10)).toBe(10);
        expect(n.getOrElse(() => 20)).toBe(20);
        expect(Maybe.fromNullable(null)).toBe(Maybe.none());
        expect(Maybe.isNone(n)).toBe(true);
        expect(Maybe.isSome(a)).toBe(true);
    });
});
