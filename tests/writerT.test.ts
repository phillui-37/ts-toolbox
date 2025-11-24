import { describe, it, expect } from 'vitest';
import { WriterT } from '../src/typeclass/transformer/WriterT.js';
import { Maybe } from '../src/typeclass/maybe.js';

describe('typeclass - WriterT', () => {
    it('WriterT.of creates a transformer with a value', () => {
        const maybeMonad = {
            of: <A>(a: A): Maybe<A> => Maybe.some(a),
            flatMap: <A, B>(m: Maybe<A>, f: (a: A) => Maybe<B>): Maybe<B> => m.flatMap(f),
        };

        const stringMonoid = {
            empty: '',
            concat: (a: string, b: string) => a + b,
        };

        const WT = WriterT(maybeMonad, stringMonoid);
        const wt = WT.of<number>(5);
        const result = wt.run();
        
        expect(result).toBeDefined();
    });

    it('WriterT.from wraps an inner monad value', () => {
        const maybeMonad = {
            of: <A>(a: A): Maybe<A> => Maybe.some(a),
            flatMap: <A, B>(m: Maybe<A>, f: (a: A) => Maybe<B>): Maybe<B> => m.flatMap(f),
        };

        const stringMonoid = {
            empty: '',
            concat: (a: string, b: string) => a + b,
        };

        const WT = WriterT(maybeMonad, stringMonoid);
        const innerValue = Maybe.some<[number, string]>([42, 'log']);
        const wt = WT.from<number>(innerValue);
        const result = wt.run() as Maybe<[number, string]>;
        
        expect(result.value).toEqual([42, 'log']);
    });

    it('WriterT.lift wraps a value with empty log', () => {
        const maybeMonad = {
            of: <A>(a: A): Maybe<A> => Maybe.some(a),
            flatMap: <A, B>(m: Maybe<A>, f: (a: A) => Maybe<B>): Maybe<B> => m.flatMap(f),
        };

        const stringMonoid = {
            empty: '',
            concat: (a: string, b: string) => a + b,
        };

        const WT = WriterT(maybeMonad, stringMonoid);
        const lifted = WT.lift<number>(Maybe.some(99));
        const result = lifted.run() as Maybe<[number, string]>;
        
        expect(result.value).toEqual([99, '']);
    });

    it('WriterT.flatMap chains computations', () => {
        const maybeMonad = {
            of: <A>(a: A): Maybe<A> => Maybe.some(a),
            flatMap: <A, B>(m: Maybe<A>, f: (a: A) => Maybe<B>): Maybe<B> => m.flatMap(f),
        };

        const stringMonoid = {
            empty: '',
            concat: (a: string, b: string) => a + b,
        };

        const WT = WriterT(maybeMonad, stringMonoid);
        const wt1 = WT.of<number>(5);
        const wt2 = wt1.flatMap((n: number) => WT.of<number>(n + 3));
        const result = wt2.run();
        
        expect(result).toBeDefined();
    });
});
