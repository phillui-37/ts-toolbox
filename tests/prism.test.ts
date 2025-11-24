import { describe, it, expect } from 'vitest';
import { Prism } from '../src/typeclass/prism.js';

describe('typeclass - Prism', () => {
    it('compose and getOrElse work for optional nested values', () => {
        type Inner = { b: number };
        type Outer = { a?: Inner };

        const aPrism = Prism.of<Outer, Inner>({
            get: (s) => s.a,
            set: (a, s) => ({ ...s, a })
        });

        const bPrism = Prism.of<Inner, number>({
            get: (i) => i.b,
            set: (b, i) => ({ ...i, b })
        });

        const composed = Prism.compose(aPrism, bPrism);
        const obj: Outer = { a: { b: 5 } };
        expect(composed.get(obj)).toBe(5);
        expect(Prism.getOrElse(composed, { }, 99)).toBe(99);
        const updated = composed.set(10, obj);
        expect(composed.get(updated)).toBe(10);
    });
});
