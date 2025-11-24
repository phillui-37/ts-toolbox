import { describe, it, expect } from 'vitest';
import { ReaderT } from '../src/typeclass/transformer/ReaderT.js';
import { Maybe } from '../src/typeclass/maybe.js';

describe('typeclass - ReaderT', () => {
    it('ReaderT.from creates a reader transformer', () => {
        const maybeMonad = {
            of: <A>(a: A): Maybe<A> => Maybe.some(a),
            flatMap: <A, B>(m: Maybe<A>, f: (a: A) => Maybe<B>): Maybe<B> => m.flatMap(f),
            map: <A, B>(m: Maybe<A>, f: (a: A) => B): Maybe<B> => m.map(f),
        };

        const RT = ReaderT(maybeMonad);
        const rt = RT.from((env: string) => Maybe.some(env.length));
        const result = rt.run('hello');
        
        expect(result).toBeDefined();
        expect((result as Maybe<number>).value).toBe(5);
    });

    it('ReaderT.map transforms the value', () => {
        const maybeMonad = {
            of: <A>(a: A): Maybe<A> => Maybe.some(a),
            flatMap: <A, B>(m: Maybe<A>, f: (a: A) => Maybe<B>): Maybe<B> => m.flatMap(f),
            map: <A, B>(m: Maybe<A>, f: (a: A) => B): Maybe<B> => m.map(f),
        };

        const RT = ReaderT(maybeMonad);
        const rt = RT.from((env: string) => Maybe.some(env.length));
        const mapped = rt.map((n: number) => n * 2);
        const result = (mapped.run('hello') as Maybe<number>).value;
        
        expect(result).toBe(10);
    });

    it('ReaderT.flatMap chains operations', () => {
        const maybeMonad = {
            of: <A>(a: A): Maybe<A> => Maybe.some(a),
            flatMap: <A, B>(m: Maybe<A>, f: (a: A) => Maybe<B>): Maybe<B> => m.flatMap(f),
            map: <A, B>(m: Maybe<A>, f: (a: A) => B): Maybe<B> => m.map(f),
        };

        const RT = ReaderT(maybeMonad);
        const rt1 = RT.from((env: string) => Maybe.some(env.length));
        const rt2 = rt1.flatMap((n: number) => 
            RT.from((env: string) => Maybe.some(n + env.charCodeAt(0)))
        );
        const result = (rt2.run('hello') as Maybe<number>).value;
        
        expect(result).toBe(5 + 'h'.charCodeAt(0));
    });

    it('ReaderT.of wraps a constant value', () => {
        const maybeMonad = {
            of: <A>(a: A): Maybe<A> => Maybe.some(a),
            flatMap: <A, B>(m: Maybe<A>, f: (a: A) => Maybe<B>): Maybe<B> => m.flatMap(f),
            map: <A, B>(m: Maybe<A>, f: (a: A) => B): Maybe<B> => m.map(f),
        };

        const RT = ReaderT(maybeMonad);
        const rt = RT.of<string, number>(42);
        const result1 = (rt.run('any') as Maybe<number>).value;
        const result2 = (rt.run('string') as Maybe<number>).value;
        
        expect(result1).toBe(42);
        expect(result2).toBe(42);
    });
});
