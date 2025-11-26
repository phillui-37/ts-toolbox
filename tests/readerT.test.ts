import { describe, it, expect } from 'vitest';
import { ReaderT } from '../src/typeclass/transformer/ReaderT.js';
import { Maybe } from '../src/typeclass/maybe.js';
import { Result } from '../src/typeclass/result.js';
import type { MonadTransDescriptor } from '../src/typeclass/monad.js';

describe('typeclass - ReaderT', () => {
    interface Env {
        x: number;
        y: string;
        config: {
            debug: boolean;
        };
    }

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

    const env: Env = { x: 5, y: 'hello', config: { debug: true } };

    describe('Constructors', () => {
        it('of creates ReaderT with constant value', () => {
            const RT = ReaderT(identityMonad);
            const rt = RT.of<Env, number>(42);
            const result = rt.run(env);
            expect(result).toBe(42);
        });

        it('of returns same value regardless of environment', () => {
            const RT = ReaderT(identityMonad);
            const rt = RT.of<Env, number>(42);
            const env1: Env = { x: 1, y: 'a', config: { debug: true } };
            const env2: Env = { x: 100, y: 'b', config: { debug: false } };
            expect(rt.run(env1)).toBe(42);
            expect(rt.run(env2)).toBe(42);
        });

        it('from creates ReaderT from environment function', () => {
            const RT = ReaderT(identityMonad);
            const rt = RT.from<Env, number>((e: Env) => e.x * 2);
            expect(rt.run(env)).toBe(10);
        });

        it('from accesses environment properties', () => {
            const RT = ReaderT(identityMonad);
            const rt = RT.from<Env, string>((e: Env) => `${e.y}:${e.x}`);
            expect(rt.run(env)).toBe('hello:5');
        });

        it('lift wraps M<A> into ReaderT', () => {
            const RT = ReaderT(identityMonad);
            const lifted = RT.lift<Env, number>(42);
            expect(lifted.run(env)).toBe(42);
        });

        it('lift ignores environment', () => {
            const RT = ReaderT(identityMonad);
            const lifted = RT.lift<Env, number>(42);
            const env1: Env = { x: 1, y: 'a', config: { debug: true } };
            const env2: Env = { x: 100, y: 'b', config: { debug: false } };
            expect(lifted.run(env1)).toBe(42);
            expect(lifted.run(env2)).toBe(42);
        });
    });

    describe('run', () => {
        it('executes reader computation with environment', () => {
            const RT = ReaderT(identityMonad);
            const rt = RT.from<Env, number>((e: Env) => e.x + 10);
            expect(rt.run(env)).toBe(15);
        });

        it('runs multiple times with different environments', () => {
            const RT = ReaderT(identityMonad);
            const rt = RT.from<Env, number>((e: Env) => e.x * 2);
            const env1: Env = { x: 5, y: 'test', config: { debug: true } };
            const env2: Env = { x: 10, y: 'test', config: { debug: true } };
            expect(rt.run(env1)).toBe(10);
            expect(rt.run(env2)).toBe(20);
        });
    });

    describe('map (Functor)', () => {
        it('maps over the result', () => {
            const RT = ReaderT(identityMonad);
            const rt = RT.from<Env, number>((e: Env) => e.x);
            const mapped = rt.map(x => x * 2);
            expect(mapped.run(env)).toBe(10);
        });

        it('map can change types', () => {
            const RT = ReaderT(identityMonad);
            const rt = RT.from<Env, number>((e: Env) => e.x);
            const mapped = rt.map(x => `Value: ${x}`);
            expect(mapped.run(env)).toBe('Value: 5');
        });

        it('chained maps work correctly', () => {
            const RT = ReaderT(identityMonad);
            const result = RT.from<Env, number>((e: Env) => e.x)
                .map(x => x + 1)
                .map(x => x * 2)
                .map(x => `Result: ${x}`)
                .run(env);
            expect(result).toBe('Result: 12');
        });

        it('map preserves environment access', () => {
            const RT = ReaderT(identityMonad);
            const rt = RT.from<Env, number>((e: Env) => e.x).map(x => x * 2);
            const env1: Env = { x: 5, y: 'test', config: { debug: true } };
            const env2: Env = { x: 10, y: 'test', config: { debug: true } };
            expect(rt.run(env1)).toBe(10);
            expect(rt.run(env2)).toBe(20);
        });
    });

    describe('flatMap (Monad)', () => {
        it('flatMap chains computations with same environment', () => {
            const RT = ReaderT(identityMonad);
            const rt = RT.from<Env, number>((e: Env) => e.x);
            const chained = rt.flatMap(x => 
                RT.from<Env, number>((e: Env) => x + e.x)
            );
            expect(chained.run(env)).toBe(10);
        });

        it('flatMap can access environment multiple times', () => {
            const RT = ReaderT(identityMonad);
            const result = RT.from<Env, string>((e: Env) => e.y)
                .flatMap(y => RT.from<Env, string>((e: Env) => `${y}:${e.x}`))
                .run(env);
            expect(result).toBe('hello:5');
        });

        it('chained flatMaps work correctly', () => {
            const RT = ReaderT(identityMonad);
            const result = RT.from<Env, number>((e: Env) => e.x)
                .flatMap(x => RT.of<Env, number>(x + 1))
                .flatMap(x => RT.of<Env, number>(x * 2))
                .flatMap(x => RT.of<Env, string>(`Result: ${x}`))
                .run(env);
            expect(result).toBe('Result: 12');
        });

        it('flatMap allows complex environment-dependent logic', () => {
            const RT = ReaderT(identityMonad);
            const rt = RT.from<Env, boolean>((e: Env) => e.config.debug)
                .flatMap(debug => RT.from<Env, string>((e: Env) =>
                    debug ? `Debug: ${e.x}` : `Value: ${e.x}`
                ));
            
            const debugEnv: Env = { x: 42, y: 'test', config: { debug: true } };
            const prodEnv: Env = { x: 42, y: 'test', config: { debug: false } };
            expect(rt.run(debugEnv)).toBe('Debug: 42');
            expect(rt.run(prodEnv)).toBe('Value: 42');
        });
    });

    describe('Nested with Maybe monad', () => {
        it('ReaderT<Maybe> handles Some results', () => {
            const RT = ReaderT(maybeMonad);
            const rt = RT.of<Env, number>(42);
            const result = rt.run(env);
            expect(Maybe.isSome(result)).toBe(true);
            expect(result.value).toBe(42);
        });

        it('ReaderT<Maybe> can produce None', () => {
            const RT = ReaderT(maybeMonad);
            const rt = RT.from<Env, Maybe<number>>((e: Env) =>
                e.x > 0 ? Maybe.some(e.x) : Maybe.none()
            );
            const positiveEnv: Env = { x: 5, y: 'test', config: { debug: true } };
            const negativeEnv: Env = { x: -5, y: 'test', config: { debug: true } };
            
            expect(Maybe.isSome(rt.run(positiveEnv))).toBe(true);
            expect(Maybe.isNone(rt.run(negativeEnv))).toBe(true);
        });

        it('map works with Maybe inner monad', () => {
            const RT = ReaderT(maybeMonad);
            const result = RT.from<Env, number>((e: Env) => Maybe.some(e.x))
                .map(x => x * 2)
                .run(env);
            expect(Maybe.isSome(result)).toBe(true);
            expect(result.value).toBe(10);
        });

        it('flatMap works with Maybe inner monad', () => {
            const RT = ReaderT(maybeMonad);
            const result = RT.from<Env, number>((e: Env) => Maybe.some(e.x))
                .flatMap(x => RT.of<Env, number>(x + 3))
                .run(env);
            expect(Maybe.isSome(result)).toBe(true);
            expect(result.value).toBe(8);
        });

        it('lift wraps Maybe values', () => {
            const RT = ReaderT(maybeMonad);
            const lifted = RT.lift<Env, number>(Maybe.some(42));
            const result = lifted.run(env);
            expect(Maybe.isSome(result)).toBe(true);
            expect(result.value).toBe(42);
        });
    });

    describe('Nested with Result monad', () => {
        it('ReaderT<Result> handles Ok results', () => {
            const RT = ReaderT(resultMonad);
            const rt = RT.of<Env, number>(42);
            const result = rt.run(env);
            expect(Result.isOk(result)).toBe(true);
            expect(result.value).toBe(42);
        });

        it('ReaderT<Result> can produce Err', () => {
            const RT = ReaderT(resultMonad);
            const rt = RT.from<Env, Result<number, string>>((e: Env) =>
                e.x > 0 ? Result.ok(e.x) : Result.err('negative value')
            );
            const positiveEnv: Env = { x: 5, y: 'test', config: { debug: true } };
            const negativeEnv: Env = { x: -5, y: 'test', config: { debug: true } };
            
            const okResult = rt.run(positiveEnv);
            expect(Result.isOk(okResult)).toBe(true);
            expect(okResult.value).toBe(5);
            
            const errResult = rt.run(negativeEnv);
            expect(Result.isErr(errResult)).toBe(true);
            expect(errResult.error).toBe('negative value');
        });

        it('map works with Result inner monad', () => {
            const RT = ReaderT(resultMonad);
            const result = RT.from<Env, number>((e: Env) => Result.ok(e.x))
                .map(x => x * 2)
                .run(env);
            expect(Result.isOk(result)).toBe(true);
            expect(result.value).toBe(10);
        });

        it('flatMap works with Result inner monad', () => {
            const RT = ReaderT(resultMonad);
            const result = RT.from<Env, number>((e: Env) => Result.ok(e.x))
                .flatMap(x => RT.of<Env, number>(x + 3))
                .run(env);
            expect(Result.isOk(result)).toBe(true);
            expect(result.value).toBe(8);
        });

        it('lift wraps Result values', () => {
            const RT = ReaderT(resultMonad);
            const lifted = RT.lift<Env, number>(Result.ok(42));
            const result = lifted.run(env);
            expect(Result.isOk(result)).toBe(true);
            expect(result.value).toBe(42);
        });
    });

    describe('Monad Laws', () => {
        const RT = ReaderT(identityMonad);
        const f = (x: number) => RT.of<Env, number>(x * 2);
        const g = (x: number) => RT.of<Env, number>(x + 3);

        it('satisfies left identity: of(a).flatMap(f) === f(a)', () => {
            const a = 5;
            const left = RT.of<Env, number>(a).flatMap(f).run(env);
            const right = f(a).run(env);
            expect(left).toBe(right);
        });

        it('satisfies right identity: m.flatMap(of) === m', () => {
            const m = RT.of<Env, number>(5);
            const left = m.flatMap(x => RT.of<Env, number>(x)).run(env);
            const right = m.run(env);
            expect(left).toBe(right);
        });

        it('satisfies associativity: m.flatMap(f).flatMap(g) === m.flatMap(x => f(x).flatMap(g))', () => {
            const m = RT.of<Env, number>(5);
            const left = m.flatMap(f).flatMap(g).run(env);
            const right = m.flatMap(x => f(x).flatMap(g)).run(env);
            expect(left).toBe(right);
        });
    });

    describe('Functor Laws', () => {
        const RT = ReaderT(identityMonad);

        it('satisfies identity: m.map(x => x) === m', () => {
            const m = RT.of<Env, number>(5);
            const mapped = m.map(x => x).run(env);
            const original = m.run(env);
            expect(mapped).toBe(original);
        });

        it('satisfies composition: m.map(f).map(g) === m.map(x => g(f(x)))', () => {
            const m = RT.of<Env, number>(5);
            const f = (x: number) => x * 2;
            const g = (x: number) => x + 3;

            const left = m.map(f).map(g).run(env);
            const right = m.map(x => g(f(x))).run(env);
            expect(left).toBe(right);
        });
    });

    describe('Transformer Laws', () => {
        it('lift . of === of', () => {
            const RT = ReaderT(identityMonad);
            const a = 42;
            const left = RT.lift<Env, number>(identityMonad.of(a)).run(env);
            const right = RT.of<Env, number>(a).run(env);
            expect(left).toBe(right);
        });

        it('lift preserves monad structure', () => {
            const RT = ReaderT(maybeMonad);
            const inner = Maybe.some(42);
            const lifted = RT.lift<Env, number>(inner).run(env);
            expect(Maybe.isSome(lifted)).toBe(true);
            expect(lifted.value).toBe(42);
        });
    });

    describe('Edge Cases', () => {
        it('handles null values', () => {
            const RT = ReaderT(identityMonad);
            const rt = RT.of<Env, null>(null);
            expect(rt.run(env)).toBe(null);
        });

        it('handles undefined values', () => {
            const RT = ReaderT(identityMonad);
            const rt = RT.of<Env, undefined>(undefined);
            expect(rt.run(env)).toBe(undefined);
        });

        it('handles complex return types', () => {
            const RT = ReaderT(identityMonad);
            const rt = RT.from<Env, { sum: number; product: number }>((e: Env) => ({
                sum: e.x + 10,
                product: e.x * 2
            }));
            const result = rt.run(env);
            expect(result.sum).toBe(15);
            expect(result.product).toBe(10);
        });

        it('handles nested environment access', () => {
            const RT = ReaderT(identityMonad);
            const rt = RT.from<Env, number>((e: Env) => 
                e.config.debug ? e.x * 2 : e.x
            );
            const debugEnv: Env = { x: 5, y: 'test', config: { debug: true } };
            const prodEnv: Env = { x: 5, y: 'test', config: { debug: false } };
            expect(rt.run(debugEnv)).toBe(10);
            expect(rt.run(prodEnv)).toBe(5);
        });

        it('handles dependency injection pattern', () => {
            interface Logger {
                log: (msg: string) => void;
            }
            interface AppEnv {
                logger: Logger;
                config: { appName: string };
            }

            const logs: string[] = [];
            const logger: Logger = { log: (msg) => logs.push(msg) };

            const RT = ReaderT(identityMonad);
            const logMessage = (msg: string) => RT.from<AppEnv, void>((e: AppEnv) => {
                e.logger.log(`[${e.config.appName}] ${msg}`);
            });

            const program = logMessage('Starting')
                .flatMap(() => logMessage('Processing'))
                .flatMap(() => RT.of<AppEnv, string>('Done'));

            const appEnv: AppEnv = { logger, config: { appName: 'TestApp' } };
            const result = program.run(appEnv);
            
            expect(result).toBe('Done');
            expect(logs).toEqual([
                '[TestApp] Starting',
                '[TestApp] Processing'
            ]);
        });

        it('handles safe division with ReaderT<Maybe>', () => {
            const RT = ReaderT(maybeMonad);
            const safeDivide = (x: number, y: number) =>
                RT.from<Env, number>(() =>
                    y === 0 ? Maybe.none() : Maybe.some(x / y)
                );

            const result1 = RT.from<Env, number>((e: Env) => Maybe.some(e.x))
                .flatMap(x => safeDivide(x, 2))
                .map(x => x + 5)
                .run(env);
            expect(Maybe.isSome(result1)).toBe(true);
            expect(result1.value).toBe(7.5);

            const result2 = RT.from<Env, number>((e: Env) => Maybe.some(e.x))
                .flatMap(x => safeDivide(x, 0))
                .map(x => x + 5)
                .run(env);
            expect(Maybe.isNone(result2)).toBe(true);
        });
    });
});
