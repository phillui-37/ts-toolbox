import { describe, it, expect } from 'vitest';
import { MaybeT } from '../src/typeclass/transformer/MaybeT.js';
import { ReaderT } from '../src/typeclass/transformer/ReaderT.js';
import { ResultT } from '../src/typeclass/transformer/ResultT.js';
import { WriterT } from '../src/typeclass/transformer/WriterT.js';
import { Maybe } from '../src/typeclass/maybe.js';
import { Result } from '../src/typeclass/result.js';
import { Reader } from '../src/typeclass/reader.js';
import { Writer } from '../src/typeclass/writer.js';
import type { MonadTransDescriptor } from '../src/typeclass/monad.js';

/**
 * Comprehensive test suite for all monad transformer combinations.
 * This covers:
 * 1. Each transformer with each base monad (Maybe, Result, Reader, Writer)
 * 2. Nested transformers (double stacks)
 * 3. Triple-nested transformers
 * 4. Monad laws for each combination
 */

// ==================== Helper Monads ====================

const maybeMonad: Required<MonadTransDescriptor<'Maybe'>> = {
    of: <A>(a: A): Maybe<A> => Maybe.some(a),
    flatMap: <A, B>(m: Maybe<A>, f: (a: A) => Maybe<B>): Maybe<B> => m.flatMap(f),
    map: <A, B>(m: Maybe<A>, f: (a: A) => B): Maybe<B> => m.map(f),
};

const resultMonad: Required<MonadTransDescriptor<'Result'>> = {
    of: <A>(a: A): Result<A, string> => Result.ok(a),
    flatMap: <A, B>(m: Result<A, string>, f: (a: A) => Result<B, string>): Result<B, string> => m.flatMap(f),
    map: <A, B>(m: Result<A, string>, f: (a: A) => B): Result<B, string> => m.map(f),
};

type Env = { config: string };

const readerMonad: Required<MonadTransDescriptor<'Reader'>> = {
    of: <A>(a: A): Reader<Env, A> => Reader.of(a),
    flatMap: <A, B>(m: Reader<Env, A>, f: (a: A) => Reader<Env, B>): Reader<Env, B> => m.flatMap(f),
    map: <A, B>(m: Reader<Env, A>, f: (a: A) => B): Reader<Env, B> => m.map(f),
};

const writerMonad: Required<MonadTransDescriptor<'Writer'>> = {
    of: <A>(a: A): Writer<A> => Writer.of(a),
    flatMap: <A, B>(m: Writer<A>, f: (a: A) => Writer<B>): Writer<B> => m.flatMap(f),
    map: <A, B>(m: Writer<A>, f: (a: A) => B): Writer<B> => m.map(f),
};

const stringMonoid = {
    empty: '',
    concat: (a: string, b: string) => a + b,
};

// Identity monad for testing
const identityMonad: Required<MonadTransDescriptor<'Identity'>> = {
    of: <A>(a: A) => a,
    flatMap: <A, B>(m: A, f: (a: A) => B) => f(m),
    map: <A, B>(m: A, f: (a: A) => B) => f(m),
};

// ==================== MaybeT Tests ====================

describe('MaybeT Combinations', () => {
    describe('MaybeT over Identity', () => {
        const MT = MaybeT(identityMonad);

        it('should lift values correctly', () => {
            const m = MT.of(42);
            const result = m.run();
            expect(Maybe.isSome(result)).toBe(true);
            expect((result as any).value).toBe(42);
        });

        it('should map values', () => {
            const m = MT.of(10).map(x => x * 2);
            const result = m.run();
            expect((result as any).value).toBe(20);
        });

        it('should flatMap and compose', () => {
            const m = MT.of(5)
                .flatMap(x => MT.of(x + 3))
                .flatMap(x => MT.of(x * 2));
            const result = m.run();
            expect((result as any).value).toBe(16); // (5 + 3) * 2
        });

        it('should short-circuit on None', () => {
            const m = MT.from(Maybe.none<number>())
                .flatMap(x => MT.of(x * 100));
            const result = m.run();
            expect(Maybe.isNone(result)).toBe(true);
        });

        it('should satisfy left identity law', () => {
            const a = 5;
            const f = (x: number) => MT.of(x * 2);
            const left = MT.of(a).flatMap(f).run();
            const right = f(a).run();
            expect(left.value).toEqual(right.value);
        });

        it('should satisfy right identity law', () => {
            const m = MT.of(10);
            const left = m.flatMap(x => MT.of(x)).run();
            const right = m.run();
            expect(left.value).toEqual(right.value);
        });

        it('should satisfy associativity law', () => {
            const m = MT.of(3);
            const f = (x: number) => MT.of(x + 1);
            const g = (x: number) => MT.of(x * 2);
            const left = m.flatMap(f).flatMap(g).run();
            const right = m.flatMap(x => f(x).flatMap(g)).run();
            expect(left.value).toEqual(right.value);
        });
    });

    describe('MaybeT over Maybe', () => {
        const MT = MaybeT(maybeMonad);

        it('should handle double Maybe layers', () => {
            const m = MT.of(42);
            const result = m.run(); // Maybe<Maybe<number>>
            expect(Maybe.isSome(result)).toBe(true);
            const inner = (result as any).value;
            expect(Maybe.isSome(inner)).toBe(true);
            expect((inner as any).value).toBe(42);
        });

        it('should handle None in outer layer', () => {
            const m = MT.from(Maybe.none());
            const result = m.run();
            expect(Maybe.isNone(result)).toBe(true);
        });

        it('should handle None in inner layer', () => {
            const m = MT.from(Maybe.some(Maybe.none()));
            const result = m.run();
            expect(Maybe.isSome(result)).toBe(true);
            expect(Maybe.isNone((result as any).value)).toBe(true);
        });

        it('should short-circuit on inner None', () => {
            const m = MT.from(Maybe.some(Maybe.none<number>()))
                .flatMap(x => MT.of(x * 100));
            const result = m.run();
            if (Maybe.isSome(result)) {
                expect(Maybe.isNone((result as any).value)).toBe(true);
            }
        });
    });

    describe('MaybeT over Result', () => {
        const MT = MaybeT(resultMonad);

        it('should combine Maybe and Result semantics', () => {
            const m = MT.of(42);
            const result = m.run(); // Result<Maybe<number>, string>
            expect(Result.isOk(result)).toBe(true);
            const maybeValue = (result as any).value;
            expect(Maybe.isSome(maybeValue)).toBe(true);
            expect((maybeValue as any).value).toBe(42);
        });

        it('should handle Result errors', () => {
            const m = MT.from(Result.err<Maybe<number>, string>('error'));
            const result = m.run();
            expect(Result.isErr(result)).toBe(true);
            expect((result as any).error).toBe('error');
        });

        it('should propagate None through Result', () => {
            const m = MT.from(Result.ok(Maybe.none<number>()))
                .flatMap(x => MT.of(x * 2));
            const result = m.run();
            expect(Result.isOk(result)).toBe(true);
            expect(Maybe.isNone((result as any).value)).toBe(true);
        });
    });

    describe('MaybeT over Reader', () => {
        const MT = MaybeT(readerMonad);

        it('should combine Maybe and Reader semantics', () => {
            const m = MT.of(42);
            const result = m.run().run({ config: 'test' }); // Reader<Env, Maybe<number>>
            expect(Maybe.isSome(result)).toBe(true);
            expect((result as any).value).toBe(42);
        });

        it('should access environment through Reader', () => {
            const m = MT.lift(Reader.ask<Env>());
            const result = m.run().run({ config: 'hello' });
            expect(Maybe.isSome(result)).toBe(true);
            expect((result as any).value).toEqual({ config: 'hello' });
        });

        it('should compose with environment access', () => {
            const m = MT.lift(Reader.ask<Env>())
                .map(env => env.config.length);
            const result = m.run().run({ config: 'test' });
            expect((result as any).value).toBe(4);
        });
    });

    describe('MaybeT over Writer', () => {
        const MT = MaybeT(writerMonad);

        it('should combine Maybe and Writer semantics', () => {
            const m = MT.of(42);
            const result = m.run(); // Writer<Maybe<number>>
            expect((result as any).log).toBe('');
            const maybeValue = (result as any).value;
            expect(Maybe.isSome(maybeValue)).toBe(true);
            expect((maybeValue as any).value).toBe(42);
        });

        it('should accumulate logs through operations', () => {
            const m = MT.lift(Writer.of(5, 'start'))
                .flatMap(x => MT.lift(Writer.of(x * 2, ' middle')))
                .flatMap(x => MT.lift(Writer.of(x + 1, ' end')));
            const result = m.run();
            expect((result as any).log).toBe('start middle end');
            const maybeValue = (result as any).value;
            expect((maybeValue as any).value).toBe(11); // (5 * 2) + 1
        });
    });
});

// ==================== ReaderT Tests ====================

describe('ReaderT Combinations', () => {
    describe('ReaderT over Identity', () => {
        const RT = ReaderT(identityMonad);

        it('should lift values correctly', () => {
            const r = RT.of(42);
            const result = r.run('env');
            expect(result).toBe(42);
        });

        it('should map values', () => {
            const r = RT.of(10).map(x => x * 2);
            const result = r.run('env');
            expect(result).toBe(20);
        });

        it('should flatMap and access environment', () => {
            const r = RT.from((env: string) => env.length)
                .flatMap(len => RT.of(len * 2));
            const result = r.run('hello');
            expect(result).toBe(10);
        });

        it('should pass environment through flatMap', () => {
            const r = RT.from((env: string) => env.length)
                .flatMap(len => RT.from((env: string) => len + env.charCodeAt(0)));
            const result = r.run('ab');
            expect(result).toBe(2 + 'a'.charCodeAt(0));
        });
    });

    describe('ReaderT over Maybe', () => {
        const RT = ReaderT(maybeMonad);

        it('should combine Reader and Maybe semantics', () => {
            const r = RT.of(42);
            const result = r.run('env'); // Env -> Maybe<number>
            expect(Maybe.isSome(result)).toBe(true);
            expect((result as any).value).toBe(42);
        });

        it('should handle None results', () => {
            const r = RT.from((_: string) => Maybe.none<number>());
            const result = r.run('env');
            expect(Maybe.isNone(result)).toBe(true);
        });

        it('should short-circuit on None', () => {
            const r = RT.from((_: string) => Maybe.none<number>())
                .flatMap(x => RT.of(x * 100));
            const result = r.run('env');
            expect(Maybe.isNone(result)).toBe(true);
        });
    });

    describe('ReaderT over Result', () => {
        const RT = ReaderT(resultMonad);

        it('should combine Reader and Result semantics', () => {
            const r = RT.of(42);
            const result = r.run('env'); // Env -> Result<number, string>
            expect(Result.isOk(result)).toBe(true);
            expect((result as any).value).toBe(42);
        });

        it('should handle errors', () => {
            const r = RT.from((_: string) => Result.err<number, string>('error'));
            const result = r.run('env');
            expect(Result.isErr(result)).toBe(true);
            expect((result as any).error).toBe('error');
        });

        it('should propagate errors through flatMap', () => {
            const r = RT.from((env: string) => 
                env.length > 0 ? Result.ok(env.length) : Result.err('empty')
            ).flatMap(len => RT.of(len * 2));
            
            expect(Result.isOk(r.run('hello'))).toBe(true);
            expect((r.run('hello') as any).value).toBe(10);
            
            expect(Result.isErr(r.run(''))).toBe(true);
        });
    });

    describe('ReaderT over Writer', () => {
        const RT = ReaderT(writerMonad);

        it('should combine Reader and Writer semantics', () => {
            const r = RT.of(42);
            const result = r.run('env'); // Env -> Writer<number>
            expect((result as any).value).toBe(42);
            expect((result as any).log).toBe('');
        });

        it('should accumulate logs', () => {
            const r = RT.from((_: string) => Writer.of(5, 'first'))
                .flatMap(x => RT.from((_: string) => Writer.of(x * 2, ' second')));
            const result = r.run('env');
            expect((result as any).value).toBe(10);
            expect((result as any).log).toBe('first second');
        });
    });
});

// ==================== ResultT Tests ====================

describe('ResultT Combinations', () => {
    describe('ResultT over Identity', () => {
        const RT = ResultT<'Identity', string>(identityMonad);

        it('should lift values correctly', () => {
            const r = RT.of(42);
            const result = r.run();
            expect(Result.isOk(result)).toBe(true);
            expect((result as any).value).toBe(42);
        });

        it('should map values', () => {
            const r = RT.of(10).map(x => x * 2);
            const result = r.run();
            expect((result as any).value).toBe(20);
        });

        it('should flatMap and compose', () => {
            const r = RT.of(5)
                .flatMap(x => RT.of(x + 3))
                .flatMap(x => RT.of(x * 2));
            const result = r.run();
            expect((result as any).value).toBe(16);
        });

        it('should short-circuit on Err', () => {
            const r = RT.from(Result.err<number, string>('error'))
                .flatMap(x => RT.of(x * 100));
            const result = r.run();
            expect(Result.isErr(result)).toBe(true);
            expect((result as any).error).toBe('error');
        });

        it('should satisfy monad laws', () => {
            const a = 5;
            const f = (x: number) => RT.of(x * 2);
            const g = (x: number) => RT.of(x + 1);

            // Left identity
            expect(RT.of(a).flatMap(f).run().value).toEqual(f(a).run().value);

            // Right identity
            const m = RT.of(10);
            expect(m.flatMap(x => RT.of(x)).run().value).toEqual(m.run().value);

            // Associativity
            const m2 = RT.of(3);
            expect(m2.flatMap(f).flatMap(g).run().value).toEqual(m2.flatMap(x => f(x).flatMap(g)).run().value);
        });
    });

    describe('ResultT over Maybe', () => {
        const RT = ResultT<'Maybe', string>(maybeMonad);

        it('should combine Result and Maybe semantics', () => {
            const r = RT.of(42);
            const result = r.run(); // Maybe<Result<number, string>>
            expect(Maybe.isSome(result)).toBe(true);
            const innerResult = (result as any).value;
            expect(Result.isOk(innerResult)).toBe(true);
            expect((innerResult as any).value).toBe(42);
        });

        it('should handle None in outer layer', () => {
            const r = RT.from(Maybe.none());
            const result = r.run();
            expect(Maybe.isNone(result)).toBe(true);
        });

        it('should handle Err in inner layer', () => {
            const r = RT.from(Maybe.some(Result.err<number, string>('error')));
            const result = r.run();
            expect(Maybe.isSome(result)).toBe(true);
            const innerResult = (result as any).value;
            expect(Result.isErr(innerResult)).toBe(true);
            expect((innerResult as any).error).toBe('error');
        });
    });

    describe('ResultT over Reader', () => {
        const RT = ResultT<'Reader', string>(readerMonad);

        it('should combine Result and Reader semantics', () => {
            const r = RT.of(42);
            const result = r.run().run({ config: 'test' }); // Reader<Env, Result<number, string>>
            expect(Result.isOk(result)).toBe(true);
            expect((result as any).value).toBe(42);
        });

        it('should access environment', () => {
            const r = RT.lift(Reader.ask<Env>())
                .map(env => env.config.length);
            const result = r.run().run({ config: 'hello' });
            expect((result as any).value).toBe(5);
        });

        it('should handle errors with environment', () => {
            const r = RT.from(Reader.from((env: Env) => 
                env.config.length > 0 ? Result.ok(env.config) : Result.err('empty')
            ));
            
            expect(Result.isOk(r.run().run({ config: 'test' }))).toBe(true);
            expect(Result.isErr(r.run().run({ config: '' }))).toBe(true);
        });
    });

    describe('ResultT over Writer', () => {
        const RT = ResultT<'Writer', string>(writerMonad);

        it('should combine Result and Writer semantics', () => {
            const r = RT.of(42);
            const result = r.run(); // Writer<Result<number, string>>
            expect((result as any).log).toBe('');
            const innerResult = (result as any).value;
            expect(Result.isOk(innerResult)).toBe(true);
            expect((innerResult as any).value).toBe(42);
        });

        it('should accumulate logs with successful results', () => {
            const r = RT.lift(Writer.of(5, 'start'))
                .flatMap(x => RT.lift(Writer.of(x * 2, ' middle')))
                .flatMap(x => RT.lift(Writer.of(x + 1, ' end')));
            const result = r.run();
            expect((result as any).log).toBe('start middle end');
            const innerResult = (result as any).value;
            expect((innerResult as any).value).toBe(11);
        });

        it('should short-circuit on error but preserve log', () => {
            const r = RT.lift(Writer.of(5, 'start'))
                .flatMap(x => RT.from(Writer.of(Result.err<number, string>('error'), ' error')))
                .flatMap(x => RT.lift(Writer.of(x + 1, ' end')));
            const result = r.run();
            expect((result as any).log).toBe('start error');
            const innerResult = (result as any).value;
            expect(Result.isErr(innerResult)).toBe(true);
        });
    });
});

// ==================== WriterT Tests ====================

describe('WriterT Combinations', () => {
    describe('WriterT over Identity', () => {
        const WT = WriterT(identityMonad, stringMonoid);

        it('should lift values correctly', () => {
            const w = WT.of(42);
            const result = w.run();
            expect(result).toEqual([42, '']);
        });

        it('should map values preserving log', () => {
            const w = WT.from([10, 'log']).map(x => x * 2);
            const result = w.run();
            expect(result).toEqual([20, 'log']);
        });

        it('should accumulate logs in flatMap', () => {
            const w = WT.from([5, 'a'])
                .flatMap(x => WT.from([x * 2, 'b']))
                .flatMap(x => WT.from([x + 1, 'c']));
            const result = w.run();
            expect(result).toEqual([11, 'abc']);
        });
    });

    describe('WriterT over Maybe', () => {
        const WT = WriterT(maybeMonad, stringMonoid);

        it('should combine Writer and Maybe semantics', () => {
            const w = WT.of(42);
            const result = w.run(); // Maybe<[number, string]>
            expect(Maybe.isSome(result)).toBe(true);
            expect((result as any).value).toEqual([42, '']);
        });

        it('should handle None', () => {
            const w = WT.from(Maybe.none<[number, string]>());
            const result = w.run();
            expect(Maybe.isNone(result)).toBe(true);
        });

        it('should accumulate logs when Some', () => {
            const w = WT.from(Maybe.some<[number, string]>([5, 'start']))
                .flatMap(x => WT.from(Maybe.some<[number, string]>([x * 2, ' end'])));
            const result = w.run();
            expect(Maybe.isSome(result)).toBe(true);
            expect((result as any).value).toEqual([10, 'start end']);
        });
    });

    describe('WriterT over Result', () => {
        const WT = WriterT(resultMonad, stringMonoid);

        it('should combine Writer and Result semantics', () => {
            const w = WT.of(42);
            const result = w.run(); // Result<[number, string], string>
            expect(Result.isOk(result)).toBe(true);
            expect((result as any).value).toEqual([42, '']);
        });

        it('should handle errors', () => {
            const w = WT.from(Result.err<[number, string], string>('error'));
            const result = w.run();
            expect(Result.isErr(result)).toBe(true);
            expect((result as any).error).toBe('error');
        });

        it('should accumulate logs on success', () => {
            const w = WT.from(Result.ok<[number, string], string>([5, 'a']))
                .flatMap(x => WT.from(Result.ok<[number, string], string>([x * 2, 'b'])));
            const result = w.run();
            expect((result as any).value).toEqual([10, 'ab']);
        });
    });

    describe('WriterT over Reader', () => {
        const WT = WriterT(readerMonad, stringMonoid);

        it('should combine Writer and Reader semantics', () => {
            const w = WT.of(42);
            const result = w.run().run({ config: 'test' }); // Reader<Env, [number, string]>
            expect(result).toEqual([42, '']);
        });

        it('should access environment and accumulate logs', () => {
            const w = WT.lift(Reader.ask<Env>())
                .map(env => env.config.length)
                .flatMap(len => WT.from(Reader.of<Env, [number, string]>([len * 2, ' computed'])));
            const result = w.run().run({ config: 'test' });
            expect(result).toEqual([8, ' computed']);
        });
    });
});

// ==================== Double-Nested Transformer Tests ====================

describe('Double-Nested Transformers', () => {
    describe('MaybeT over ReaderT over Identity', () => {
        const RT = ReaderT(identityMonad);
        const readerTMonad: Required<MonadTransDescriptor<'ReaderT'>> = {
            of: <A>(a: A) => RT.of<string, A>(a),
            flatMap: <A, B>(m: any, f: (a: A) => any) => m.flatMap(f),
            map: <A, B>(m: any, f: (a: A) => B) => m.map(f),
        };
        const MRT = MaybeT(readerTMonad);

        it('should stack MaybeT over ReaderT', () => {
            const m = MRT.of(42);
            const result = m.run().run('env'); // ReaderT<string, Identity, Maybe<number>>
            expect(Maybe.isSome(result)).toBe(true);
            expect((result as any).value).toBe(42);
        });

        it('should handle None in MaybeT layer', () => {
            const m = MRT.from(RT.from((_: string) => Maybe.none<number>()));
            const result = m.run().run('env');
            expect(Maybe.isNone(result)).toBe(true);
        });

        it('should compose both effects', () => {
            const m = MRT.from(RT.from((env: string) => Maybe.some(env.length)))
                .flatMap(len => MRT.of(len * 2));
            const result = m.run().run('hello');
            expect((result as any).value).toBe(10);
        });
    });

    describe('ResultT over MaybeT over Identity', () => {
        const MT = MaybeT(identityMonad);
        const maybeTMonad: Required<MonadTransDescriptor<'MaybeT'>> = {
            of: <A>(a: A) => MT.of(a),
            flatMap: <A, B>(m: any, f: (a: A) => any) => m.flatMap(f),
            map: <A, B>(m: any, f: (a: A) => B) => m.map(f),
        };
        const RMT = ResultT<'MaybeT', string>(maybeTMonad);

        it('should stack ResultT over MaybeT', () => {
            const r = RMT.of(42);
            const result = r.run().run(); // MaybeT<Identity, Result<number, string>>
            expect(Maybe.isSome(result)).toBe(true);
            const innerResult = (result as any).value;
            expect(Result.isOk(innerResult)).toBe(true);
            expect((innerResult as any).value).toBe(42);
        });

        it('should handle None in MaybeT layer', () => {
            const r = RMT.from(MT.from(Maybe.none()));
            const result = r.run().run();
            expect(Maybe.isNone(result)).toBe(true);
        });

        it('should handle Err in ResultT layer', () => {
            const r = RMT.from(MT.from(Maybe.some(Result.err('error'))));
            const result = r.run().run();
            expect(Maybe.isSome(result)).toBe(true);
            const innerResult = (result as any).value;
            expect(Result.isErr(innerResult)).toBe(true);
        });

        it('should short-circuit on Err', () => {
            const r = RMT.from(MT.of(Result.err<number, string>('error')))
                .flatMap(x => RMT.of(x * 100));
            const result = r.run().run();
            const innerResult = (result as any).value;
            expect(Result.isErr(innerResult)).toBe(true);
        });
    });

    describe('WriterT over ResultT over Identity', () => {
        const RT = ResultT<'Identity', string>(identityMonad);
        const resultTMonad: Required<MonadTransDescriptor<'ResultT'>> = {
            of: <A>(a: A) => RT.of(a),
            flatMap: <A, B>(m: any, f: (a: A) => any) => m.flatMap(f),
            map: <A, B>(m: any, f: (a: A) => B) => m.map(f),
        };
        const WRT = WriterT(resultTMonad, stringMonoid);

        it('should stack WriterT over ResultT', () => {
            const w = WRT.of(42);
            const result = w.run().run(); // ResultT<Identity, string, [number, string]>
            expect(Result.isOk(result)).toBe(true);
            expect((result as any).value).toEqual([42, '']);
        });

        it('should accumulate logs', () => {
            const w = WRT.from(RT.of<[number, string]>([5, 'start']))
                .flatMap(x => WRT.from(RT.of<[number, string]>([x * 2, ' end'])));
            const result = w.run().run();
            expect((result as any).value).toEqual([10, 'start end']);
        });

        it('should handle errors in ResultT layer', () => {
            const w = WRT.from(RT.from(Result.err<[number, string], string>('error')));
            const result = w.run().run();
            expect(Result.isErr(result)).toBe(true);
        });
    });

    describe('ReaderT over WriterT over Identity', () => {
        const WT = WriterT(identityMonad, stringMonoid);
        const writerTMonad: Required<MonadTransDescriptor<'WriterT'>> = {
            of: <A>(a: A) => WT.of(a),
            flatMap: <A, B>(m: any, f: (a: A) => any) => m.flatMap(f),
            map: <A, B>(m: any, f: (a: A) => B) => m.map(f),
        };
        const RWT = ReaderT(writerTMonad);

        it('should stack ReaderT over WriterT', () => {
            const r = RWT.of<string, number>(42);
            const result = r.run('env'); // WriterT<Identity, string, number>
            expect(result.run()).toEqual([42, '']);
        });

        it('should access environment and accumulate logs', () => {
            const r = RWT.from((env: string) => WT.from([env.length, 'computed']))
                .flatMap(len => RWT.from((_: string) => WT.from([len * 2, ' doubled'])));
            const result = r.run('hello');
            expect(result.run()).toEqual([10, 'computed doubled']);
        });
    });
});

// ==================== Triple-Nested Transformer Tests ====================

describe('Triple-Nested Transformers', () => {
    describe('MaybeT over ReaderT over ResultT over Identity', () => {
        const RT_Result = ResultT<'Identity', string>(identityMonad);
        const resultTMonad: Required<MonadTransDescriptor<'ResultT'>> = {
            of: <A>(a: A) => RT_Result.of(a),
            flatMap: <A, B>(m: any, f: (a: A) => any) => m.flatMap(f),
            map: <A, B>(m: any, f: (a: A) => B) => m.map(f),
        };
        const RT_Reader = ReaderT(resultTMonad);
        const readerTMonad: Required<MonadTransDescriptor<'ReaderT'>> = {
            of: <A>(a: A) => RT_Reader.of<string, A>(a),
            flatMap: <A, B>(m: any, f: (a: A) => any) => m.flatMap(f),
            map: <A, B>(m: any, f: (a: A) => B) => m.map(f),
        };
        const MRT = MaybeT(readerTMonad);

        it('should handle three transformer layers', () => {
            const m = MRT.of(42);
            const result = m.run().run('env').run(); // ReaderT<string, ResultT<Identity, string, Maybe<number>>>
            expect(Result.isOk(result)).toBe(true);
            const maybeValue = (result as any).value;
            expect(Maybe.isSome(maybeValue)).toBe(true);
            expect((maybeValue as any).value).toBe(42);
        });

        it('should short-circuit on None', () => {
            const m = MRT.from(RT_Reader.from((_: string) => RT_Result.from(Result.ok(Maybe.none()))))
                .flatMap(x => MRT.of(x));
            const result = m.run().run('env').run();
            expect(Result.isOk(result)).toBe(true);
            expect(Maybe.isNone((result as any).value)).toBe(true);
        });

        it('should short-circuit on Result error', () => {
            const m = MRT.from(RT_Reader.from((_: string) => RT_Result.from(Result.err('error'))))
                .flatMap(x => MRT.of(x));
            const result = m.run().run('env').run();
            expect(Result.isErr(result)).toBe(true);
        });

        it('should compose all three effects', () => {
            const m = MRT.from(RT_Reader.from((env: string) => 
                RT_Result.of(Maybe.some(env.length))
            )).flatMap(len => MRT.of(len * 2));
            const result = m.run().run('hello').run();
            expect(Result.isOk(result)).toBe(true);
            const maybeValue = (result as any).value;
            expect((maybeValue as any).value).toBe(10);
        });
    });

    describe('WriterT over ResultT over ReaderT over Identity', () => {
        const RT_Reader = ReaderT(identityMonad);
        const readerTMonad: Required<MonadTransDescriptor<'ReaderT'>> = {
            of: <A>(a: A) => RT_Reader.of<string, A>(a),
            flatMap: <A, B>(m: any, f: (a: A) => any) => m.flatMap(f),
            map: <A, B>(m: any, f: (a: A) => B) => m.map(f),
        };
        const RT_Result = ResultT<'ReaderT', string>(readerTMonad);
        const resultTMonad: Required<MonadTransDescriptor<'ResultT'>> = {
            of: <A>(a: A) => RT_Result.of(a),
            flatMap: <A, B>(m: any, f: (a: A) => any) => m.flatMap(f),
            map: <A, B>(m: any, f: (a: A) => B) => m.map(f),
        };
        const WRT = WriterT(resultTMonad, stringMonoid);

        it('should handle three transformer layers with all effects', () => {
            const w = WRT.of(42);
            const result = w.run().run().run('env'); // ReaderT<string, ResultT<Identity, [number, string]>>
            expect(Result.isOk(result)).toBe(true);
            expect((result as any).value).toEqual([42, '']);
        });

        it('should accumulate logs and access environment', () => {
            const w = WRT.from(RT_Result.lift(RT_Reader.from((env: string) => [env.length, 'initial'] as [number, string])))
                .flatMap(len => WRT.from(RT_Result.of([len * 2, 'computed doubled'])));
            const result = w.run().run().run('hello');
            expect(Result.isOk(result)).toBe(true);
            expect((result as any).value[0]).toBe(10);
            expect((result as any).value[1]).toContain('doubled');
        });

        it('should handle Result errors while preserving other effects', () => {
            const w = WRT.from(RT_Result.from(RT_Reader.from((env: string) => 
                env.length > 0 ? Result.ok<[number, string], string>([env.length, 'log']) : Result.err('empty')
            )));
            
            const successResult = w.run().run().run('hello');
            expect(Result.isOk(successResult)).toBe(true);
            
            const errorResult = w.run().run().run('');
            expect(Result.isErr(errorResult)).toBe(true);
        });
    });
});

// ==================== Monad Law Tests for All Combinations ====================

describe('Monad Laws - Comprehensive', () => {
    const testMonadLaws = <T>(
        name: string,
        of: <A>(a: A) => T,
        extract: (t: T) => any,
        value: number,
        f: (x: number) => T,
        g: (x: number) => T
    ) => {
        describe(`${name} - Monad Laws`, () => {
            it('should satisfy left identity: of(a).flatMap(f) === f(a)', () => {
                const left = extract((of(value) as any).flatMap(f));
                const right = extract(f(value));
                // Compare values, not object instances
                expect(JSON.stringify(left)).toEqual(JSON.stringify(right));
            });

            it('should satisfy right identity: m.flatMap(of) === m', () => {
                const m = of(value);
                const left = extract((m as any).flatMap((x: number) => of(x)));
                const right = extract(m);
                // Compare values, not object instances
                expect(JSON.stringify(left)).toEqual(JSON.stringify(right));
            });

            it('should satisfy associativity: m.flatMap(f).flatMap(g) === m.flatMap(x => f(x).flatMap(g))', () => {
                const m = of(value);
                const left = extract((m as any).flatMap(f).flatMap(g));
                const right = extract((m as any).flatMap((x: number) => (f(x) as any).flatMap(g)));
                // Compare values, not object instances
                expect(JSON.stringify(left)).toEqual(JSON.stringify(right));
            });
        });
    };

    // MaybeT over Identity
    const MT_Id = MaybeT(identityMonad);
    testMonadLaws(
        'MaybeT<Identity>',
        (a: number) => MT_Id.of(a),
        (t) => t.run(),
        5,
        (x: number) => MT_Id.of(x * 2),
        (x: number) => MT_Id.of(x + 1)
    );

    // ReaderT over Identity
    const RT_Id = ReaderT(identityMonad);
    testMonadLaws(
        'ReaderT<Identity>',
        (a: number) => RT_Id.of<string, number>(a),
        (t) => t.run('env'),
        5,
        (x: number) => RT_Id.of<string, number>(x * 2),
        (x: number) => RT_Id.of<string, number>(x + 1)
    );

    // ResultT over Identity
    const RT_Id_Result = ResultT<'Identity', string>(identityMonad);
    testMonadLaws(
        'ResultT<Identity>',
        (a: number) => RT_Id_Result.of(a),
        (t) => t.run(),
        5,
        (x: number) => RT_Id_Result.of(x * 2),
        (x: number) => RT_Id_Result.of(x + 1)
    );

    // WriterT over Identity
    const WT_Id = WriterT(identityMonad, stringMonoid);
    testMonadLaws(
        'WriterT<Identity>',
        (a: number) => WT_Id.of(a),
        (t) => t.run(),
        5,
        (x: number) => WT_Id.of(x * 2),
        (x: number) => WT_Id.of(x + 1)
    );
});

// ==================== Edge Cases and Error Handling ====================

describe('Edge Cases and Special Scenarios', () => {
    describe('Empty and Default Values', () => {
        it('MaybeT should handle None propagation correctly', () => {
            const MT = MaybeT(identityMonad);
            const result = MT.from(Maybe.none<number>())
                .map(x => x * 2)
                .flatMap(x => MT.of(x + 1))
                .map(x => x * 3)
                .run();
            expect(Maybe.isNone(result)).toBe(true);
        });

        it('ResultT should handle Err propagation correctly', () => {
            const RT = ResultT<'Identity', string>(identityMonad);
            const result = RT.from(Result.err<number, string>('initial error'))
                .map(x => x * 2)
                .flatMap(x => RT.of(x + 1))
                .map(x => x * 3)
                .run();
            expect(Result.isErr(result)).toBe(true);
            expect((result as any).error).toBe('initial error');
        });

        it('WriterT should handle empty logs correctly', () => {
            const WT = WriterT(identityMonad, stringMonoid);
            const result = WT.of(42).run();
            expect(result).toEqual([42, '']);
        });
    });

    describe('Complex Compositions', () => {
        it('should handle long chains of operations', () => {
            const MT = MaybeT(identityMonad);
            let m = MT.of(1);
            for (let i = 0; i < 10; i++) {
                m = m.flatMap(x => MT.of(x + 1));
            }
            const result = m.run();
            expect((result as any).value).toBe(11);
        });

        it('should handle alternating map and flatMap operations', () => {
            const RT = ResultT<'Identity', string>(identityMonad);
            const result = RT.of(2)
                .map(x => x * 2)
                .flatMap(x => RT.of(x + 1))
                .map(x => x * 3)
                .flatMap(x => RT.of(x - 1))
                .run();
            expect((result as any).value).toBe(14); // ((2 * 2 + 1) * 3) - 1
        });
    });

    describe('Type Consistency', () => {
        it('should maintain types through transformer stack', () => {
            const MT = MaybeT(maybeMonad);
            const m: typeof MT extends { of: (a: number) => infer R } ? R : never = MT.of(42);
            const result = m.map(x => x.toString()).run();
            expect(Maybe.isSome(result)).toBe(true);
            const inner = (result as any).value;
            expect(Maybe.isSome(inner)).toBe(true);
            expect(typeof (inner as any).value).toBe('string');
        });
    });
});
