import { describe, it, expect } from 'vitest';
import { MaybeT } from '../src/typeclass/transformer/MaybeT.js';
import { Maybe } from '../src/typeclass/maybe.js';

describe('typeclass - MaybeT', () => {
    it('MaybeT.of and map produce M<Maybe.some(...)>', () => {
        const simpleMonad = {
            of: <A>(a: A) => a,
            flatMap: <A, B>(m: A, f: (a: A) => B) => f(m),
            map: <A, B>(m: A, f: (a: A) => B) => f(m),
        };

        const MT = MaybeT(simpleMonad);
        const m1 = MT.of(5);
        const m2 = m1.map((v: number) => v * 2);
        const result = (m2 as any).run();

        expect(Maybe.isSome(result)).toBe(true);
        expect((result as any).value).toBe(10);
    });

    it('flatMap sequences only when Some, and propagates None', () => {
        const simpleMonad = {
            of: <A>(a: A) => a,
            flatMap: <A, B>(m: A, f: (a: A) => B) => f(m),
            map: <A, B>(m: A, f: (a: A) => B) => f(m),
        };

        const MT = MaybeT(simpleMonad);

        // Some case: should apply function
        const someResult = MT.of(5).flatMap((v: number) => MT.of(v * 2)).run();
        expect(Maybe.isSome(someResult)).toBe(true);
        expect((someResult as any).value).toBe(10);

        // None case: should propagate None and not call the inner function
        const noneInner = simpleMonad.of(Maybe.none());
        const noneMT = MT.from(noneInner);
        const after = noneMT.flatMap((v: number) => MT.of(999)).run();
        expect(Maybe.isNone(after)).toBe(true);
    });

    it('lift wraps inner monad values into Maybe.some', () => {
        const simpleMonad = {
            of: <A>(a: A) => a,
            flatMap: <A, B>(m: A, f: (a: A) => B) => f(m),
            map: <A, B>(m: A, f: (a: A) => B) => f(m),
        };

        const MT = MaybeT(simpleMonad);
        const lifted = MT.lift(simpleMonad.of(7)).run();
        expect(Maybe.isSome(lifted)).toBe(true);
        expect((lifted as any).value).toBe(7);
    });
});
