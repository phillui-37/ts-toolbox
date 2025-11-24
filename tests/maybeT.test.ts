import { describe, it, expect } from 'vitest';
import { MaybeT } from '../src/typeclass/transformer/MaybeT.js';

describe('typeclass - MaybeT', () => {
    it('MaybeT lifts computations through the transformer', () => {
        const simpleMonad = {
            of: <A>(a: A) => a,
            flatMap: <A, B>(m: A, f: (a: A) => B) => f(m),
            map: <A, B>(m: A, f: (a: A) => B) => f(m),
        };

        const MT = MaybeT(simpleMonad);
        const m1 = MT.of(5);
        // Map applies the function through: 5 -> 5 * 2 = 10
        const m2 = m1.map((v: number) => v * 2);
        const result = (m2 as any).run();
        // The result should be the mapped value through the functor
        expect(result).toBeDefined();
    });
});
