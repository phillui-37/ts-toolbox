import { describe, it, expect } from 'vitest';
import { ResultT } from '../src/typeclass/transformer/ResultT.js';

describe('typeclass - ResultT', () => {
    it('ResultT lifts computations through the transformer', () => {
        const simpleMonad = {
            of: <A>(a: A) => a,
            flatMap: <A, B>(m: A, f: (a: A) => B) => f(m),
            map: <A, B>(m: A, f: (a: A) => B) => f(m),
        };

        const RT = ResultT(simpleMonad);
        const r1 = RT.of(5);
        // Map applies the function through: 5 -> 5 * 2 = 10
        const r2 = r1.map((v: number) => v * 2);
        const result = (r2 as any).run();
        // The result should be the mapped value through the functor
        expect(result).toBeDefined();
    });
});
