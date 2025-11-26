import { describe, it, expect } from 'vitest';
import { MaybeT } from '../src/typeclass/transformer/MaybeT.js';
import { Maybe } from '../src/typeclass/maybe.js';
import { Result } from '../src/typeclass/result.js';
import type { MonadTransDescriptor } from '../src/typeclass/monad.js';

describe('typeclass - MaybeT', () => {
    // Simple identity monad for testing
    const identityMonad: Required<MonadTransDescriptor<any>> = {
        of: <A>(a: A) => a,
        flatMap: <A, B>(m: A, f: (a: A) => B) => f(m),
        map: <A, B>(m: A, f: (a: A) => B) => f(m),
    };

    // Maybe monad for nested testing
    const maybeMonad: Required<MonadTransDescriptor<any>> = {
        of: <A>(a: A): Maybe<A> => Maybe.some(a),
        flatMap: <A, B>(m: Maybe<A>, f: (a: A) => Maybe<B>): Maybe<B> => m.flatMap(f),
        map: <A, B>(m: Maybe<A>, f: (a: A) => B): Maybe<B> => m.map(f),
    };

    // Result monad for testing error handling
    const resultMonad: Required<MonadTransDescriptor<any>> = {
        of: <A>(a: A): Result<A, string> => Result.ok(a),
        flatMap: <A, B>(m: Result<A, string>, f: (a: A) => Result<B, string>): Result<B, string> => m.flatMap(f),
        map: <A, B>(m: Result<A, string>, f: (a: A) => B): Result<B, string> => m.map(f),
    };

    // Monad without map (to test fallback path)
    const monadWithoutMap: Required<MonadTransDescriptor<any>> = {
        of: <A>(a: A) => a,
        flatMap: <A, B>(m: A, f: (a: A) => B) => f(m),
        map: undefined as any,
    };

    describe('Constructors', () => {
        it('of creates MaybeT with Some value', () => {
            const MT = MaybeT(identityMonad);
            const mt = MT.of(42);
            const result = mt.run();
            expect(Maybe.isSome(result)).toBe(true);
            expect(result.value).toBe(42);
        });

        it('from wraps existing M<Maybe<A>>', () => {
            const MT = MaybeT(identityMonad);
            const inner = Maybe.some(42);
            const mt = MT.from(inner);
            const result = mt.run();
            expect(Maybe.isSome(result)).toBe(true);
            expect(result.value).toBe(42);
        });

        it('from with None propagates None', () => {
            const MT = MaybeT(identityMonad);
            const inner = Maybe.none<number>();
            const mt = MT.from(inner);
            const result = mt.run();
            expect(Maybe.isNone(result)).toBe(true);
        });

        it('lift wraps M<A> into M<Maybe<A>>', () => {
            const MT = MaybeT(identityMonad);
            const lifted = MT.lift(42);
            const result = lifted.run();
            expect(Maybe.isSome(result)).toBe(true);
            expect(result.value).toBe(42);
        });
    });

    describe('map (Functor)', () => {
        it('maps over Some value', () => {
            const MT = MaybeT(identityMonad);
            const mt = MT.of(5);
            const mapped = mt.map(x => x * 2);
            const result = mapped.run();
            expect(result.value).toBe(10);
        });

        it('map on None returns None', () => {
            const MT = MaybeT(identityMonad);
            const mt = MT.from(Maybe.none<number>());
            const mapped = mt.map(x => x * 2);
            const result = mapped.run();
            expect(Maybe.isNone(result)).toBe(true);
        });

        it('map can change types', () => {
            const MT = MaybeT(identityMonad);
            const mt = MT.of(42);
            const mapped = mt.map(x => `Value: ${x}`);
            const result = mapped.run();
            expect(result.value).toBe('Value: 42');
        });

        it('chained maps work correctly', () => {
            const MT = MaybeT(identityMonad);
            const result = MT.of(2)
                .map(x => x + 1)
                .map(x => x * 2)
                .map(x => `Result: ${x}`)
                .run();
            expect(result.value).toBe('Result: 6');
        });

        it('map does not execute on None', () => {
            const MT = MaybeT(identityMonad);
            let called = false;
            const result = MT.from(Maybe.none<number>())
                .map(x => {
                    called = true;
                    return x * 2;
                })
                .run();
            expect(called).toBe(false);
            expect(Maybe.isNone(result)).toBe(true);
        });
    });

    describe('flatMap (Monad)', () => {
        it('flatMap chains Some values', () => {
            const MT = MaybeT(identityMonad);
            const mt = MT.of(5);
            const chained = mt.flatMap(x => MT.of(x + 10));
            const result = chained.run();
            expect(result.value).toBe(15);
        });

        it('flatMap on None returns None', () => {
            const MT = MaybeT(identityMonad);
            const mt = MT.from(Maybe.none<number>());
            const chained = mt.flatMap(x => MT.of(x + 10));
            const result = chained.run();
            expect(Maybe.isNone(result)).toBe(true);
        });

        it('flatMap with None result propagates None', () => {
            const MT = MaybeT(identityMonad);
            const mt = MT.of(5);
            const chained = mt.flatMap(_ => MT.from(Maybe.none<number>()));
            const result = chained.run();
            expect(Maybe.isNone(result)).toBe(true);
        });

        it('flatMap short-circuits on first None', () => {
            const MT = MaybeT(identityMonad);
            let called = false;
            const result = MT.of(2)
                .flatMap(x => MT.of(x + 1))
                .flatMap(_ => MT.from(Maybe.none<number>()))
                .flatMap(x => {
                    called = true;
                    return MT.of(x * 100);
                })
                .run();
            expect(called).toBe(false);
            expect(Maybe.isNone(result)).toBe(true);
        });

        it('chained flatMaps work correctly', () => {
            const MT = MaybeT(identityMonad);
            const result = MT.of(2)
                .flatMap(x => MT.of(x + 1))
                .flatMap(x => MT.of(x * 2))
                .flatMap(x => MT.of(`Result: ${x}`))
                .run();
            expect(result.value).toBe('Result: 6');
        });
    });

    describe('Nested with Maybe monad', () => {
        it('MaybeT<Maybe, A> handles nested Some values', () => {
            const MT = MaybeT(maybeMonad);
            const mt = MT.of(42);
            const result = mt.run();
            expect(Maybe.isSome(result)).toBe(true);
            const inner = result.value;
            expect(Maybe.isSome(inner!)).toBe(true);
            expect((inner as any).value).toBe(42);
        });

        it('MaybeT<Maybe, A> propagates inner None', () => {
            const MT = MaybeT(maybeMonad);
            const mt = MT.from(Maybe.some(Maybe.none<number>()));
            const result = mt.run();
            expect(Maybe.isSome(result)).toBe(true);
            const inner = result.value;
            expect(Maybe.isNone(inner!)).toBe(true);
        });

        it('MaybeT<Maybe, A> propagates outer None', () => {
            const MT = MaybeT(maybeMonad);
            const mt = MT.from(Maybe.none<Maybe<number>>());
            const result = mt.run();
            expect(Maybe.isNone(result)).toBe(true);
        });

        it('map works with nested Maybe', () => {
            const MT = MaybeT(maybeMonad);
            const result = MT.of(5)
                .map(x => x * 2)
                .run();
            expect(Maybe.isSome(result)).toBe(true);
            expect((result.value as any).value).toBe(10);
        });

        it('flatMap works with nested Maybe', () => {
            const MT = MaybeT(maybeMonad);
            const result = MT.of(5)
                .flatMap(x => MT.of(x + 3))
                .run();
            expect(Maybe.isSome(result)).toBe(true);
            expect((result.value as any).value).toBe(8);
        });
    });

    describe('Nested with Result monad', () => {
        it('MaybeT<Result, A> wraps values in Ok<Maybe<A>>', () => {
            const MT = MaybeT(resultMonad);
            const mt = MT.of(42);
            const result = mt.run();
            expect(Result.isOk(result)).toBe(true);
            expect(Maybe.isSome(result.value!)).toBe(true);
            expect((result.value as any).value).toBe(42);
        });

        it('MaybeT<Result, A> can have Err outer layer', () => {
            const MT = MaybeT(resultMonad);
            const mt = MT.from(Result.err<Maybe<number>, string>('error'));
            const result = mt.run();
            expect(Result.isErr(result)).toBe(true);
            expect(result.error).toBe('error');
        });

        it('MaybeT<Result, A> can have None inner layer', () => {
            const MT = MaybeT(resultMonad);
            const mt = MT.from(Result.ok(Maybe.none<number>()));
            const result = mt.run();
            expect(Result.isOk(result)).toBe(true);
            expect(Maybe.isNone(result.value!)).toBe(true);
        });

        it('map preserves Result layer', () => {
            const MT = MaybeT(resultMonad);
            const result = MT.of(5)
                .map(x => x * 2)
                .run();
            expect(Result.isOk(result)).toBe(true);
            expect((result.value as any).value).toBe(10);
        });

        it('flatMap preserves Result layer', () => {
            const MT = MaybeT(resultMonad);
            const result = MT.of(5)
                .flatMap(x => MT.of(x + 3))
                .run();
            expect(Result.isOk(result)).toBe(true);
            expect((result.value as any).value).toBe(8);
        });
    });

    describe('Monad Laws', () => {
        const MT = MaybeT(identityMonad);
        const f = (x: number) => MT.of(x * 2);
        const g = (x: number) => MT.of(x + 3);

        it('satisfies left identity: of(a).flatMap(f) === f(a)', () => {
            const a = 5;
            const left = MT.of(a).flatMap(f).run();
            const right = f(a).run();
            expect(left.value).toBe(right.value);
        });

        it('satisfies right identity: m.flatMap(of) === m', () => {
            const m = MT.of(5);
            const left = m.flatMap(x => MT.of(x)).run();
            const right = m.run();
            expect(left.value).toBe(right.value);
        });

        it('satisfies associativity: m.flatMap(f).flatMap(g) === m.flatMap(x => f(x).flatMap(g))', () => {
            const m = MT.of(5);
            const left = m.flatMap(f).flatMap(g).run();
            const right = m.flatMap(x => f(x).flatMap(g)).run();
            expect(left.value).toBe(right.value);
        });

        it('monad laws hold for None', () => {
            const none = MT.from(Maybe.none<number>());
            const result = none.flatMap(f).run();
            expect(Maybe.isNone(result)).toBe(true);
        });
    });

    describe('Functor Laws', () => {
        const MT = MaybeT(identityMonad);

        it('satisfies identity: m.map(x => x) === m', () => {
            const m = MT.of(5);
            const mapped = m.map(x => x).run();
            const original = m.run();
            expect(mapped.value).toBe(original.value);
        });

        it('satisfies composition: m.map(f).map(g) === m.map(x => g(f(x)))', () => {
            const m = MT.of(5);
            const f = (x: number) => x * 2;
            const g = (x: number) => x + 3;

            const left = m.map(f).map(g).run();
            const right = m.map(x => g(f(x))).run();
            expect(left.value).toBe(right.value);
        });
    });

    describe('Transformer Laws', () => {
        it('lift . of === of', () => {
            const MT = MaybeT(identityMonad);
            const a = 42;
            const left = MT.lift(identityMonad.of(a)).run();
            const right = MT.of(a).run();
            expect(left.value).toBe(right.value);
        });

        it('lift preserves monad structure', () => {
            const MT = MaybeT(maybeMonad);
            const inner = Maybe.some(42);
            const lifted = MT.lift(inner).run();
            expect(Maybe.isSome(lifted)).toBe(true);
            expect(Maybe.isSome(lifted.value!)).toBe(true);
        });
    });

    describe('Edge Cases', () => {
        it('handles null values in Some', () => {
            const MT = MaybeT(identityMonad);
            const mt = MT.of(null);
            const result = mt.run();
            expect(Maybe.isSome(result)).toBe(true);
            expect(result.value).toBe(null);
        });

        it('handles undefined values in Some', () => {
            const MT = MaybeT(identityMonad);
            const mt = MT.of(undefined);
            const result = mt.run();
            expect(Maybe.isSome(result)).toBe(true);
            expect(result.value).toBe(undefined);
        });

        it('handles complex objects', () => {
            const MT = MaybeT(identityMonad);
            const obj = { a: 1, b: { c: 2 } };
            const result = MT.of(obj)
                .map(o => o.b.c)
                .run();
            expect(result.value).toBe(2);
        });

        it('handles deeply nested transformers', () => {
            const MT1 = MaybeT(maybeMonad);
            const result = MT1.of(5)
                .map(x => x + 1)
                .flatMap(x => MT1.of(x * 2))
                .map(x => `Result: ${x}`)
                .run();
            
            expect(Maybe.isSome(result)).toBe(true);
            const inner = result.value;
            expect(Maybe.isSome(inner!)).toBe(true);
            expect((inner as any).value).toBe('Result: 12');
        });

        it('handles safe division pattern', () => {
            const MT = MaybeT(identityMonad);
            const safeDivide = (x: number, y: number) =>
                y === 0 ? MT.from(Maybe.none<number>()) : MT.of(x / y);

            const result1 = MT.of(10)
                .flatMap(x => safeDivide(x, 2))
                .map(x => x + 5)
                .run();
            expect(result1.value).toBe(10);

            const result2 = MT.of(10)
                .flatMap(x => safeDivide(x, 0))
                .map(x => x + 5)
                .run();
            expect(Maybe.isNone(result2)).toBe(true);
        });
    });

    describe('Fallback paths (monad without map)', () => {
        it('map uses flatMap fallback when map is undefined', () => {
            const MT = MaybeT(monadWithoutMap);
            const mt = MT.of(42);
            const result = mt.map(x => x * 2).run();
            expect(Maybe.isSome(result)).toBe(true);
            expect(result.value).toBe(84);
        });

        it('lift uses flatMap fallback when map is undefined', () => {
            const MT = MaybeT(monadWithoutMap);
            const mt = MT.lift(100);
            const result = mt.run();
            expect(Maybe.isSome(result)).toBe(true);
            expect(result.value).toBe(100);
        });

        it('map fallback with None propagates None', () => {
            const MT = MaybeT(monadWithoutMap);
            const mt = MT.from(Maybe.none<number>());
            const result = mt.map(x => x * 2).run();
            expect(Maybe.isNone(result)).toBe(true);
        });
    });
});
