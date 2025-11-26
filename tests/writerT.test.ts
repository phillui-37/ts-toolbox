import { describe, it, expect } from 'vitest';
import { WriterT } from '../src/typeclass/transformer/WriterT.js';
import { Maybe } from '../src/typeclass/maybe.js';
import { Result } from '../src/typeclass/result.js';
import type { MonadTransDescriptor, Monoid } from '../src/typeclass/monad.js';

describe('typeclass - WriterT', () => {
    // String monoid for log accumulation
    const stringMonoid: Monoid<string> = {
        empty: '',
        concat: (a: string, b: string) => a + b,
    };

    // Array monoid for testing
    const arrayMonoid: Monoid<string[]> = {
        empty: [],
        concat: (a: string[], b: string[]) => [...a, ...b],
    };

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

    describe('Constructors', () => {
        it('of creates WriterT with value and empty log', () => {
            const WT = WriterT(identityMonad, stringMonoid);
            const wt = WT.of(42);
            const result = wt.run();
            expect(result).toEqual([42, '']);
        });

        it('from wraps existing M<[A, W]>', () => {
            const WT = WriterT(identityMonad, stringMonoid);
            const inner: [number, string] = [42, 'log'];
            const wt = WT.from(inner);
            const result = wt.run();
            expect(result).toEqual([42, 'log']);
        });

        it('lift wraps M<A> with empty log', () => {
            const WT = WriterT(identityMonad, stringMonoid);
            const lifted = WT.lift(42);
            const result = lifted.run();
            expect(result).toEqual([42, '']);
        });
    });

    describe('map (Functor)', () => {
        it('maps over the value preserving log', () => {
            const WT = WriterT(identityMonad, stringMonoid);
            const wt = WT.of(5);
            const mapped = wt.map(x => x * 2);
            const result = mapped.run();
            expect(result).toEqual([10, '']);
        });

        it('map preserves existing log', () => {
            const WT = WriterT(identityMonad, stringMonoid);
            const wt = WT.from([5, 'log1;'] as [number, string]);
            const mapped = wt.map(x => x + 3);
            const result = mapped.run();
            expect(result).toEqual([8, 'log1;']);
        });

        it('map can change types', () => {
            const WT = WriterT(identityMonad, stringMonoid);
            const wt = WT.from([42, 'log;'] as [number, string]);
            const mapped = wt.map(x => `Value: ${x}`);
            const result = mapped.run();
            expect(result).toEqual(['Value: 42', 'log;']);
        });

        it('chained maps work correctly', () => {
            const WT = WriterT(identityMonad, stringMonoid);
            const result = WT.from([2, 'start;'] as [number, string])
                .map(x => x + 1)
                .map(x => x * 2)
                .map(x => `Result: ${x}`)
                .run();
            expect(result).toEqual(['Result: 6', 'start;']);
        });
    });

    describe('flatMap (Monad)', () => {
        it('flatMap chains computations and accumulates logs', () => {
            const WT = WriterT(identityMonad, stringMonoid);
            const wt = WT.from([5, 'start;'] as [number, string]);
            const chained = wt.flatMap(x => WT.from([x * 2, 'double;'] as [number, string]));
            const result = chained.run();
            expect(result).toEqual([10, 'start;double;']);
        });

        it('flatMap accumulates logs from multiple operations', () => {
            const WT = WriterT(identityMonad, stringMonoid);
            const result = WT.from([2, 'log1;'] as [number, string])
                .flatMap(x => WT.from([x + 1, 'log2;'] as [number, string]))
                .flatMap(x => WT.from([x * 2, 'log3;'] as [number, string]))
                .run();
            expect(result).toEqual([6, 'log1;log2;log3;']);
        });

        it('flatMap with empty logs', () => {
            const WT = WriterT(identityMonad, stringMonoid);
            const result = WT.of(5)
                .flatMap(x => WT.of(x * 2))
                .run();
            expect(result).toEqual([10, '']);
        });

        it('flatMap handles mixed empty and non-empty logs', () => {
            const WT = WriterT(identityMonad, stringMonoid);
            const result = WT.from([5, 'start;'] as [number, string])
                .flatMap(x => WT.of(x + 1))
                .flatMap(x => WT.from([x * 2, 'end;'] as [number, string]))
                .run();
            expect(result).toEqual([12, 'start;end;']);
        });

        it('chained flatMaps work correctly', () => {
            const WT = WriterT(identityMonad, stringMonoid);
            const result = WT.from([2, 'a;'] as [number, string])
                .flatMap(x => WT.from([x + 1, 'b;'] as [number, string]))
                .flatMap(x => WT.from([x * 2, 'c;'] as [number, string]))
                .flatMap(x => WT.from([`Result: ${x}`, 'd;'] as [string, string]))
                .run();
            expect(result).toEqual(['Result: 6', 'a;b;c;d;']);
        });
    });

    describe('Log Accumulation with Array Monoid', () => {
        it('accumulates array logs correctly', () => {
            const WT = WriterT(identityMonad, arrayMonoid);
            const result = WT.from([1, ['start']] as [number, string[]])
                .flatMap(x => WT.from([x + 1, ['step1']] as [number, string[]]))
                .flatMap(x => WT.from([x * 2, ['step2']] as [number, string[]]))
                .run();
            expect(result).toEqual([4, ['start', 'step1', 'step2']]);
        });

        it('handles empty array logs', () => {
            const WT = WriterT(identityMonad, arrayMonoid);
            const result = WT.of(42)
                .flatMap(x => WT.of(x * 2))
                .run();
            expect(result).toEqual([84, []]);
        });

        it('mixed empty and non-empty array logs', () => {
            const WT = WriterT(identityMonad, arrayMonoid);
            const result = WT.from([5, ['init']] as [number, string[]])
                .flatMap(x => WT.of(x + 1))
                .flatMap(x => WT.from([x * 2, ['final']] as [number, string[]]))
                .run();
            expect(result).toEqual([12, ['init', 'final']]);
        });
    });

    describe('Nested with Maybe monad', () => {
        it('WriterT<Maybe> handles Some results', () => {
            const WT = WriterT(maybeMonad, stringMonoid);
            const wt = WT.of(42);
            const result = wt.run();
            expect(Maybe.isSome(result)).toBe(true);
            expect(result.value).toEqual([42, '']);
        });

        it('WriterT<Maybe> can produce None', () => {
            const WT = WriterT(maybeMonad, stringMonoid);
            const wt = WT.from(Maybe.none<[number, string]>());
            const result = wt.run();
            expect(Maybe.isNone(result)).toBe(true);
        });

        it('map works with Maybe inner monad', () => {
            const WT = WriterT(maybeMonad, stringMonoid);
            const result = WT.from(Maybe.some([5, 'log;'] as [number, string]))
                .map(x => x * 2)
                .run();
            expect(Maybe.isSome(result)).toBe(true);
            expect(result.value).toEqual([10, 'log;']);
        });

        it('flatMap works with Maybe inner monad', () => {
            const WT = WriterT(maybeMonad, stringMonoid);
            const result = WT.from(Maybe.some([5, 'log1;'] as [number, string]))
                .flatMap(x => WT.from(Maybe.some([x + 3, 'log2;'] as [number, string])))
                .run();
            expect(Maybe.isSome(result)).toBe(true);
            expect(result.value).toEqual([8, 'log1;log2;']);
        });

        it('lift wraps Maybe values', () => {
            const WT = WriterT(maybeMonad, stringMonoid);
            const lifted = WT.lift(Maybe.some(42));
            const result = lifted.run();
            expect(Maybe.isSome(result)).toBe(true);
            expect(result.value).toEqual([42, '']);
        });

        it('None propagates through operations', () => {
            const WT = WriterT(maybeMonad, stringMonoid);
            const result = WT.from(Maybe.some([5, 'log1;'] as [number, string]))
                .flatMap(_ => WT.from(Maybe.none<[number, string]>()))
                .map(x => x * 100)
                .run();
            expect(Maybe.isNone(result)).toBe(true);
        });
    });

    describe('Nested with Result monad', () => {
        it('WriterT<Result> handles Ok results', () => {
            const WT = WriterT(resultMonad, stringMonoid);
            const wt = WT.of(42);
            const result = wt.run();
            expect(Result.isOk(result)).toBe(true);
            expect(result.value).toEqual([42, '']);
        });

        it('WriterT<Result> can produce Err', () => {
            const WT = WriterT(resultMonad, stringMonoid);
            const wt = WT.from(Result.err<[number, string], string>('error'));
            const result = wt.run();
            expect(Result.isErr(result)).toBe(true);
            expect(result.error).toBe('error');
        });

        it('map works with Result inner monad', () => {
            const WT = WriterT(resultMonad, stringMonoid);
            const result = WT.from(Result.ok([5, 'log;'] as [number, string]))
                .map(x => x * 2)
                .run();
            expect(Result.isOk(result)).toBe(true);
            expect(result.value).toEqual([10, 'log;']);
        });

        it('flatMap works with Result inner monad', () => {
            const WT = WriterT(resultMonad, stringMonoid);
            const result = WT.from(Result.ok([5, 'log1;'] as [number, string]))
                .flatMap(x => WT.from(Result.ok([x + 3, 'log2;'] as [number, string])))
                .run();
            expect(Result.isOk(result)).toBe(true);
            expect(result.value).toEqual([8, 'log1;log2;']);
        });

        it('lift wraps Result values', () => {
            const WT = WriterT(resultMonad, stringMonoid);
            const lifted = WT.lift(Result.ok(42));
            const result = lifted.run();
            expect(Result.isOk(result)).toBe(true);
            expect(result.value).toEqual([42, '']);
        });

        it('Err propagates through operations', () => {
            const WT = WriterT(resultMonad, stringMonoid);
            const result = WT.from(Result.ok([5, 'log1;'] as [number, string]))
                .flatMap(_ => WT.from(Result.err<[number, string], string>('error')))
                .map(x => x * 100)
                .run();
            expect(Result.isErr(result)).toBe(true);
            expect(result.error).toBe('error');
        });
    });

    describe('Monad Laws', () => {
        const WT = WriterT(identityMonad, stringMonoid);
        const f = (x: number) => WT.from([x * 2, 'f;'] as [number, string]);
        const g = (x: number) => WT.from([x + 3, 'g;'] as [number, string]);

        it('satisfies left identity: of(a).flatMap(f) === f(a)', () => {
            const a = 5;
            const left = WT.of(a).flatMap(f).run();
            const right = f(a).run();
            expect(left).toEqual(right);
        });

        it('satisfies right identity: m.flatMap(of) === m', () => {
            const m = WT.from([5, 'log;'] as [number, string]);
            const left = m.flatMap(x => WT.of(x)).run();
            const right = m.run();
            expect(left).toEqual(right);
        });

        it('satisfies associativity: m.flatMap(f).flatMap(g) === m.flatMap(x => f(x).flatMap(g))', () => {
            const m = WT.from([5, 'start;'] as [number, string]);
            const left = m.flatMap(f).flatMap(g).run();
            const right = m.flatMap(x => f(x).flatMap(g)).run();
            expect(left).toEqual(right);
        });
    });

    describe('Functor Laws', () => {
        const WT = WriterT(identityMonad, stringMonoid);

        it('satisfies identity: m.map(x => x) === m', () => {
            const m = WT.from([5, 'log;'] as [number, string]);
            const mapped = m.map(x => x).run();
            const original = m.run();
            expect(mapped).toEqual(original);
        });

        it('satisfies composition: m.map(f).map(g) === m.map(x => g(f(x)))', () => {
            const m = WT.from([5, 'log;'] as [number, string]);
            const f = (x: number) => x * 2;
            const g = (x: number) => x + 3;

            const left = m.map(f).map(g).run();
            const right = m.map(x => g(f(x))).run();
            expect(left).toEqual(right);
        });
    });

    describe('Monoid Laws', () => {
        it('left identity: concat(empty, x) === x', () => {
            expect(stringMonoid.concat(stringMonoid.empty, 'log')).toBe('log');
            expect(arrayMonoid.concat(arrayMonoid.empty, ['log'])).toEqual(['log']);
        });

        it('right identity: concat(x, empty) === x', () => {
            expect(stringMonoid.concat('log', stringMonoid.empty)).toBe('log');
            expect(arrayMonoid.concat(['log'], arrayMonoid.empty)).toEqual(['log']);
        });

        it('associativity: concat(concat(a, b), c) === concat(a, concat(b, c))', () => {
            const a = 'a;', b = 'b;', c = 'c;';
            const left = stringMonoid.concat(stringMonoid.concat(a, b), c);
            const right = stringMonoid.concat(a, stringMonoid.concat(b, c));
            expect(left).toBe(right);
        });
    });

    describe('Transformer Laws', () => {
        it('lift . of === of', () => {
            const WT = WriterT(identityMonad, stringMonoid);
            const a = 42;
            const left = WT.lift(identityMonad.of(a)).run();
            const right = WT.of(a).run();
            expect(left).toEqual(right);
        });

        it('lift preserves monad structure', () => {
            const WT = WriterT(maybeMonad, stringMonoid);
            const inner = Maybe.some(42);
            const lifted = WT.lift(inner).run();
            expect(Maybe.isSome(lifted)).toBe(true);
            expect(lifted.value).toEqual([42, '']);
        });
    });

    describe('Edge Cases', () => {
        it('handles null values', () => {
            const WT = WriterT(identityMonad, stringMonoid);
            const wt = WT.of(null);
            const result = wt.run();
            expect(result).toEqual([null, '']);
        });

        it('handles undefined values', () => {
            const WT = WriterT(identityMonad, stringMonoid);
            const wt = WT.of(undefined);
            const result = wt.run();
            expect(result).toEqual([undefined, '']);
        });

        it('handles complex objects', () => {
            const WT = WriterT(identityMonad, stringMonoid);
            const obj = { a: 1, b: { c: 2 } };
            const result = WT.from([obj, 'log;'] as [typeof obj, string])
                .map(o => o.b.c)
                .run();
            expect(result).toEqual([2, 'log;']);
        });

        it('handles very long log chains', () => {
            const WT = WriterT(identityMonad, stringMonoid);
            let wt = WT.from([0, 'start;'] as [number, string]);
            for (let i = 0; i < 10; i++) {
                wt = wt.flatMap(x => WT.from([x + 1, `step${i};`] as [number, string]));
            }
            const result = wt.run();
            expect(result[0]).toBe(10);
            expect(result[1]).toBe('start;step0;step1;step2;step3;step4;step5;step6;step7;step8;step9;');
        });

        it('log concatenation is associative through flatMap', () => {
            const WT = WriterT(identityMonad, stringMonoid);
            const w1 = WT.from([1, 'a;'] as [number, string]);
            const w2 = WT.from([2, 'b;'] as [number, string]);
            const w3 = WT.from([3, 'c;'] as [number, string]);

            const left = w1.flatMap(() => w2).flatMap(() => w3).run();
            const right = w1.flatMap(() => w2.flatMap(() => w3)).run();

            expect(left).toEqual(right);
            expect(left[1]).toBe('a;b;c;');
        });

        it('works with computation pipeline', () => {
            const WT = WriterT(identityMonad, stringMonoid);
            
            const compute = (x: number, op: string) => 
                WT.from([x, `[${op}] result=${x}; `] as [number, string]);

            const result = WT.from([10, 'start; '] as [number, string])
                .flatMap(x => compute(x + 5, 'add'))
                .flatMap(x => compute(x * 2, 'multiply'))
                .flatMap(x => WT.from([x, 'end.'] as [number, string]))
                .run();

            expect(result[0]).toBe(30);
            expect(result[1]).toBe('start; [add] result=15; [multiply] result=30; end.');
        });

        it('handles logging with side effects pattern', () => {
            const WT = WriterT(identityMonad, arrayMonoid);
            
            const factorial = (n: number): typeof WT extends { of: (a: any) => infer R } ? R : never => {
                if (n <= 1) return WT.from([1, [`factorial(${n})=1`]] as [number, string[]]);
                return WT.from([n, [`computing factorial(${n})`]] as [number, string[]])
                    .flatMap(x => {
                        const prev = factorial(x - 1) as any;
                        return prev.map((f: number) => x * f);
                    });
            };

            const result = factorial(5).run();
            expect(result[0]).toBe(120);
            expect(result[1]).toContain('computing factorial(5)');
            expect(result[1]).toContain('factorial(1)=1');
        });
    });
});
