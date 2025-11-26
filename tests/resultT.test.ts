import { describe, it, expect } from 'vitest';
import { ResultT } from '../src/typeclass/transformer/ResultT.js';
import { Result } from '../src/typeclass/result.js';
import { Maybe } from '../src/typeclass/maybe.js';
import type { MonadTransDescriptor } from '../src/typeclass/monad.js';

describe('typeclass - ResultT', () => {
    // Simple identity monad for testing
    const identityMonad: Required<MonadTransDescriptor<any>> = {
        of: <A>(a: A) => a,
        flatMap: <A, B>(m: A, f: (a: A) => B) => f(m),
        map: <A, B>(m: A, f: (a: A) => B) => f(m),
    };

    // Maybe monad for optional results
    const maybeMonad: Required<MonadTransDescriptor<any>> = {
        of: <A>(a: A): Maybe<A> => Maybe.some(a),
        flatMap: <A, B>(m: Maybe<A>, f: (a: A) => Maybe<B>): Maybe<B> => m.flatMap(f),
        map: <A, B>(m: Maybe<A>, f: (a: A) => B): Maybe<B> => m.map(f),
    };

    // Result monad for error handling
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
        it('of creates ResultT with Ok value', () => {
            const RT = ResultT<any, string>(identityMonad);
            const rt = RT.of(42);
            const result = rt.run();
            expect(Result.isOk(result)).toBe(true);
            expect(result.value).toBe(42);
        });

        it('from wraps existing M<Result<A, E>>', () => {
            const RT = ResultT<any, string>(identityMonad);
            const inner = Result.ok<number, string>(42);
            const rt = RT.from(inner);
            const result = rt.run();
            expect(Result.isOk(result)).toBe(true);
            expect(result.value).toBe(42);
        });

        it('from with Err propagates error', () => {
            const RT = ResultT<any, string>(identityMonad);
            const inner = Result.err<number, string>('error');
            const rt = RT.from(inner);
            const result = rt.run();
            expect(Result.isErr(result)).toBe(true);
            expect(result.error).toBe('error');
        });

        it('lift wraps M<A> into M<Result<A, E>>', () => {
            const RT = ResultT<any, string>(identityMonad);
            const lifted = RT.lift(42);
            const result = lifted.run();
            expect(Result.isOk(result)).toBe(true);
            expect(result.value).toBe(42);
        });
    });

    describe('map (Functor)', () => {
        it('maps over Ok value', () => {
            const RT = ResultT<any, string>(identityMonad);
            const rt = RT.of(5);
            const mapped = rt.map(x => x * 2);
            const result = mapped.run();
            expect(result.value).toBe(10);
        });

        it('map on Err returns Err', () => {
            const RT = ResultT<any, string>(identityMonad);
            const rt = RT.from(Result.err<number, string>('error'));
            const mapped = rt.map(x => x * 2);
            const result = mapped.run();
            expect(Result.isErr(result)).toBe(true);
            expect(result.error).toBe('error');
        });

        it('map can change types', () => {
            const RT = ResultT<any, string>(identityMonad);
            const rt = RT.of(42);
            const mapped = rt.map(x => `Value: ${x}`);
            const result = mapped.run();
            expect(result.value).toBe('Value: 42');
        });

        it('chained maps work correctly', () => {
            const RT = ResultT<any, string>(identityMonad);
            const result = RT.of(2)
                .map(x => x + 1)
                .map(x => x * 2)
                .map(x => `Result: ${x}`)
                .run();
            expect(result.value).toBe('Result: 6');
        });

        it('map does not execute on Err', () => {
            const RT = ResultT<any, string>(identityMonad);
            let called = false;
            const result = RT.from(Result.err<number, string>('error'))
                .map(x => {
                    called = true;
                    return x * 2;
                })
                .run();
            expect(called).toBe(false);
            expect(Result.isErr(result)).toBe(true);
        });
    });

    describe('flatMap (Monad)', () => {
        it('flatMap chains Ok values', () => {
            const RT = ResultT<any, string>(identityMonad);
            const rt = RT.of(5);
            const chained = rt.flatMap(x => RT.of(x + 10));
            const result = chained.run();
            expect(result.value).toBe(15);
        });

        it('flatMap on Err returns Err', () => {
            const RT = ResultT<any, string>(identityMonad);
            const rt = RT.from(Result.err<number, string>('error'));
            const chained = rt.flatMap(x => RT.of(x + 10));
            const result = chained.run();
            expect(Result.isErr(result)).toBe(true);
            expect(result.error).toBe('error');
        });

        it('flatMap with Err result propagates error', () => {
            const RT = ResultT<any, string>(identityMonad);
            const rt = RT.of(5);
            const chained = rt.flatMap(_ => RT.from(Result.err<number, string>('new error')));
            const result = chained.run();
            expect(Result.isErr(result)).toBe(true);
            expect(result.error).toBe('new error');
        });

        it('flatMap short-circuits on first error', () => {
            const RT = ResultT<any, string>(identityMonad);
            let called = false;
            const result = RT.of(2)
                .flatMap(x => RT.of(x + 1))
                .flatMap(_ => RT.from(Result.err<number, string>('error')))
                .flatMap(x => {
                    called = true;
                    return RT.of(x * 100);
                })
                .run();
            expect(called).toBe(false);
            expect(Result.isErr(result)).toBe(true);
        });

        it('chained flatMaps work correctly', () => {
            const RT = ResultT<any, string>(identityMonad);
            const result = RT.of(2)
                .flatMap(x => RT.of(x + 1))
                .flatMap(x => RT.of(x * 2))
                .flatMap(x => RT.of(`Result: ${x}`))
                .run();
            expect(result.value).toBe('Result: 6');
        });
    });

    describe('Error Handling', () => {
        it('preserves error type through transformations', () => {
            const RT = ResultT<any, string>(identityMonad);
            const result = RT.from(Result.err<number, string>('initial error'))
                .map(x => x * 2)
                .flatMap(x => RT.of(x + 1))
                .run();
            expect(Result.isErr(result)).toBe(true);
            expect(result.error).toBe('initial error');
        });

        it('handles different error types', () => {
            const RT = ResultT<any, number>(identityMonad);
            const result = RT.from(Result.err<string, number>(404))
                .map(x => x.toUpperCase())
                .run();
            expect(Result.isErr(result)).toBe(true);
            expect(result.error).toBe(404);
        });

        it('error recovery pattern', () => {
            const RT = ResultT<any, string>(identityMonad);
            const safeDivide = (x: number, y: number) =>
                y === 0 
                    ? RT.from(Result.err<number, string>('Division by zero'))
                    : RT.of(x / y);

            const result1 = RT.of(10)
                .flatMap(x => safeDivide(x, 2))
                .map(x => x + 5)
                .run();
            expect(result1.value).toBe(10);

            const result2 = RT.of(10)
                .flatMap(x => safeDivide(x, 0))
                .map(x => x + 5)
                .run();
            expect(Result.isErr(result2)).toBe(true);
            expect(result2.error).toBe('Division by zero');
        });
    });

    describe('Nested with Maybe monad', () => {
        it('ResultT<Maybe, E, A> handles Some<Ok> values', () => {
            const RT = ResultT<any, string>(maybeMonad);
            const rt = RT.of(42);
            const result = rt.run();
            expect(Maybe.isSome(result)).toBe(true);
            expect(Result.isOk(result.value!)).toBe(true);
            expect((result.value as any).value).toBe(42);
        });

        it('ResultT<Maybe, E, A> can have None outer layer', () => {
            const RT = ResultT<any, string>(maybeMonad);
            const rt = RT.from(Maybe.none<Result<number, string>>());
            const result = rt.run();
            expect(Maybe.isNone(result)).toBe(true);
        });

        it('ResultT<Maybe, E, A> can have Err inner layer', () => {
            const RT = ResultT<any, string>(maybeMonad);
            const rt = RT.from(Maybe.some(Result.err<number, string>('error')));
            const result = rt.run();
            expect(Maybe.isSome(result)).toBe(true);
            expect(Result.isErr(result.value!)).toBe(true);
            expect((result.value as any).error).toBe('error');
        });

        it('map works with Maybe outer monad', () => {
            const RT = ResultT<any, string>(maybeMonad);
            const result = RT.of(5)
                .map(x => x * 2)
                .run();
            expect(Maybe.isSome(result)).toBe(true);
            expect((result.value as any).value).toBe(10);
        });

        it('flatMap works with Maybe outer monad', () => {
            const RT = ResultT<any, string>(maybeMonad);
            const result = RT.of(5)
                .flatMap(x => RT.of(x + 3))
                .run();
            expect(Maybe.isSome(result)).toBe(true);
            expect((result.value as any).value).toBe(8);
        });
    });

    describe('Nested with Result monad', () => {
        it('ResultT<Result, E, A> handles nested Ok values', () => {
            const RT = ResultT<any, string>(resultMonad);
            const rt = RT.of(42);
            const result = rt.run();
            expect(Result.isOk(result)).toBe(true);
            expect(Result.isOk(result.value!)).toBe(true);
            expect((result.value as any).value).toBe(42);
        });

        it('ResultT<Result, E, A> can have outer Err', () => {
            const RT = ResultT<any, string>(resultMonad);
            const rt = RT.from(Result.err<Result<number, string>, string>('outer error'));
            const result = rt.run();
            expect(Result.isErr(result)).toBe(true);
            expect(result.error).toBe('outer error');
        });

        it('ResultT<Result, E, A> can have inner Err', () => {
            const RT = ResultT<any, string>(resultMonad);
            const rt = RT.from(Result.ok(Result.err<number, string>('inner error')));
            const result = rt.run();
            expect(Result.isOk(result)).toBe(true);
            expect(Result.isErr(result.value!)).toBe(true);
            expect((result.value as any).error).toBe('inner error');
        });

        it('map preserves nested structure', () => {
            const RT = ResultT<any, string>(resultMonad);
            const result = RT.of(5)
                .map(x => x * 2)
                .run();
            expect(Result.isOk(result)).toBe(true);
            expect((result.value as any).value).toBe(10);
        });

        it('flatMap preserves nested structure', () => {
            const RT = ResultT<any, string>(resultMonad);
            const result = RT.of(5)
                .flatMap(x => RT.of(x + 3))
                .run();
            expect(Result.isOk(result)).toBe(true);
            expect((result.value as any).value).toBe(8);
        });
    });

    describe('Monad Laws', () => {
        const RT = ResultT<any, string>(identityMonad);
        const f = (x: number) => RT.of(x * 2);
        const g = (x: number) => RT.of(x + 3);

        it('satisfies left identity: of(a).flatMap(f) === f(a)', () => {
            const a = 5;
            const left = RT.of(a).flatMap(f).run();
            const right = f(a).run();
            expect(left.value).toBe(right.value);
        });

        it('satisfies right identity: m.flatMap(of) === m', () => {
            const m = RT.of(5);
            const left = m.flatMap(x => RT.of(x)).run();
            const right = m.run();
            expect(left.value).toBe(right.value);
        });

        it('satisfies associativity: m.flatMap(f).flatMap(g) === m.flatMap(x => f(x).flatMap(g))', () => {
            const m = RT.of(5);
            const left = m.flatMap(f).flatMap(g).run();
            const right = m.flatMap(x => f(x).flatMap(g)).run();
            expect(left.value).toBe(right.value);
        });

        it('monad laws hold for Err', () => {
            const err = RT.from(Result.err<number, string>('error'));
            const result = err.flatMap(f).run();
            expect(Result.isErr(result)).toBe(true);
        });
    });

    describe('Functor Laws', () => {
        const RT = ResultT<any, string>(identityMonad);

        it('satisfies identity: m.map(x => x) === m', () => {
            const m = RT.of(5);
            const mapped = m.map(x => x).run();
            const original = m.run();
            expect(mapped.value).toBe(original.value);
        });

        it('satisfies composition: m.map(f).map(g) === m.map(x => g(f(x)))', () => {
            const m = RT.of(5);
            const f = (x: number) => x * 2;
            const g = (x: number) => x + 3;

            const left = m.map(f).map(g).run();
            const right = m.map(x => g(f(x))).run();
            expect(left.value).toBe(right.value);
        });
    });

    describe('Transformer Laws', () => {
        it('lift . of === of', () => {
            const RT = ResultT<any, string>(identityMonad);
            const a = 42;
            const left = RT.lift(identityMonad.of(a)).run();
            const right = RT.of(a).run();
            expect(left.value).toBe(right.value);
        });

        it('lift preserves monad structure', () => {
            const RT = ResultT<any, string>(maybeMonad);
            const inner = Maybe.some(42);
            const lifted = RT.lift(inner).run();
            expect(Maybe.isSome(lifted)).toBe(true);
            expect(Result.isOk(lifted.value!)).toBe(true);
        });
    });

    describe('Edge Cases', () => {
        it('handles null values in Ok', () => {
            const RT = ResultT<any, string>(identityMonad);
            const rt = RT.of(null);
            const result = rt.run();
            expect(Result.isOk(result)).toBe(true);
            expect(result.value).toBe(null);
        });

        it('handles undefined values in Ok', () => {
            const RT = ResultT<any, string>(identityMonad);
            const rt = RT.of(undefined);
            const result = rt.run();
            expect(Result.isOk(result)).toBe(true);
            expect(result.value).toBe(undefined);
        });

        it('handles complex objects', () => {
            const RT = ResultT<any, string>(identityMonad);
            const obj = { a: 1, b: { c: 2 } };
            const result = RT.of(obj)
                .map(o => o.b.c)
                .run();
            expect(result.value).toBe(2);
        });

        it('handles validation pattern', () => {
            const RT = ResultT<any, string>(identityMonad);
            
            const validatePositive = (x: number) =>
                x > 0 ? RT.of(x) : RT.from(Result.err<number, string>('Must be positive'));
            
            const validateLessThan100 = (x: number) =>
                x < 100 ? RT.of(x) : RT.from(Result.err<number, string>('Must be less than 100'));

            const valid = RT.of(50)
                .flatMap(validatePositive)
                .flatMap(validateLessThan100)
                .run();
            expect(Result.isOk(valid)).toBe(true);
            expect(valid.value).toBe(50);

            const negative = RT.of(-5)
                .flatMap(validatePositive)
                .flatMap(validateLessThan100)
                .run();
            expect(Result.isErr(negative)).toBe(true);
            expect(negative.error).toBe('Must be positive');

            const tooLarge = RT.of(150)
                .flatMap(validatePositive)
                .flatMap(validateLessThan100)
                .run();
            expect(Result.isErr(tooLarge)).toBe(true);
            expect(tooLarge.error).toBe('Must be less than 100');
        });

        it('handles complex error propagation', () => {
            const RT = ResultT<any, string>(identityMonad);
            
            const result = RT.of(10)
                .map(x => x + 5)
                .flatMap(x => x > 10 ? RT.of(x) : RT.from(Result.err('too small')))
                .map(x => x * 2)
                .flatMap(x => x < 50 ? RT.of(x) : RT.from(Result.err('too large')))
                .run();
            
            expect(Result.isOk(result)).toBe(true);
            expect(result.value).toBe(30);
        });

        it('handles array operations', () => {
            const RT = ResultT<any, string>(identityMonad);
            const arr = [1, 2, 3, 4, 5];
            
            const result = RT.of(arr)
                .map(a => a.filter(x => x % 2 === 0))
                .map(a => a.map(x => x * 2))
                .map(a => a.reduce((sum, x) => sum + x, 0))
                .run();
            
            expect(result.value).toBe(12); // [2, 4] -> [4, 8] -> 12
        });
    });

    describe('Fallback paths (monad without map)', () => {
        it('map uses flatMap fallback when map is undefined', () => {
            const RT = ResultT<any, string>(monadWithoutMap);
            const rt = RT.of(42);
            const result = rt.map(x => x * 2).run();
            expect(Result.isOk(result)).toBe(true);
            expect(result.value).toBe(84);
        });

        it('lift uses flatMap fallback when map is undefined', () => {
            const RT = ResultT<any, string>(monadWithoutMap);
            const rt = RT.lift(100);
            const result = rt.run();
            expect(Result.isOk(result)).toBe(true);
            expect(result.value).toBe(100);
        });

        it('map fallback with Err propagates error', () => {
            const RT = ResultT<any, string>(monadWithoutMap);
            const rt = RT.from(Result.err<number, string>('error'));
            const result = rt.map(x => x * 2).run();
            expect(Result.isErr(result)).toBe(true);
            expect(result.error).toBe('error');
        });
    });
});
