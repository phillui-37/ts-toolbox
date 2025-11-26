import { describe, it, expect } from 'vitest';
import Reader from '../src/typeclass/reader.js';

describe('typeclass - Reader', () => {
    interface Env {
        x: number;
        y: string;
        config: {
            debug: boolean;
            maxRetries: number;
        };
    }

    describe('Constructors', () => {
        it('creates Reader with of', () => {
            const reader = Reader.of<Env, number>(42);
            const env: Env = { x: 1, y: 'test', config: { debug: true, maxRetries: 3 } };
            expect(reader.run(env)).toBe(42);
        });

        it('creates Reader with from', () => {
            const reader = Reader.from<Env, number>((env: Env) => env.x * 2);
            const env: Env = { x: 5, y: 'test', config: { debug: true, maxRetries: 3 } };
            expect(reader.run(env)).toBe(10);
        });

        it('creates Reader with ask to access environment', () => {
            const reader = Reader.ask<Env>();
            const env: Env = { x: 1, y: 'hello', config: { debug: false, maxRetries: 5 } };
            expect(reader.run(env)).toBe(env);
        });
    });

    describe('run', () => {
        it('executes the reader computation with environment', () => {
            const reader = Reader.from<Env, number>((env: Env) => env.x + 10);
            const env: Env = { x: 5, y: 'test', config: { debug: true, maxRetries: 3 } };
            expect(reader.run(env)).toBe(15);
        });

        it('runs multiple times with different environments', () => {
            const reader = Reader.from<Env, number>((env: Env) => env.x * 2);
            const env1: Env = { x: 5, y: 'test', config: { debug: true, maxRetries: 3 } };
            const env2: Env = { x: 10, y: 'test', config: { debug: true, maxRetries: 3 } };
            expect(reader.run(env1)).toBe(10);
            expect(reader.run(env2)).toBe(20);
        });
    });

    describe('map (Functor)', () => {
        it('maps over the result of reader computation', () => {
            const reader = Reader.from<Env, number>((env: Env) => env.x);
            const mapped = reader.map(x => x * 2);
            const env: Env = { x: 5, y: 'test', config: { debug: true, maxRetries: 3 } };
            expect(mapped.run(env)).toBe(10);
        });

        it('map can change types', () => {
            const reader = Reader.from<Env, number>((env: Env) => env.x);
            const mapped = reader.map(x => `Value: ${x}`);
            const env: Env = { x: 42, y: 'test', config: { debug: true, maxRetries: 3 } };
            expect(mapped.run(env)).toBe('Value: 42');
        });

        it('chained maps work correctly', () => {
            const reader = Reader.from<Env, number>((env: Env) => env.x);
            const result = reader
                .map(x => x + 1)
                .map(x => x * 2)
                .map(x => `Result: ${x}`);
            const env: Env = { x: 2, y: 'test', config: { debug: true, maxRetries: 3 } };
            expect(result.run(env)).toBe('Result: 6');
        });

        it('map preserves environment access', () => {
            const reader = Reader.from<Env, number>((env: Env) => env.x);
            const mapped = reader.map(x => x * 2);
            const env1: Env = { x: 5, y: 'test', config: { debug: true, maxRetries: 3 } };
            const env2: Env = { x: 10, y: 'test', config: { debug: true, maxRetries: 3 } };
            expect(mapped.run(env1)).toBe(10);
            expect(mapped.run(env2)).toBe(20);
        });
    });

    describe('flatMap (Monad)', () => {
        it('flatMap chains computations with same environment', () => {
            const reader = Reader.from<Env, number>((env: Env) => env.x);
            const chained = reader.flatMap(x => 
                Reader.from<Env, number>((env: Env) => x + env.config.maxRetries)
            );
            const env: Env = { x: 5, y: 'test', config: { debug: true, maxRetries: 3 } };
            expect(chained.run(env)).toBe(8);
        });

        it('flatMap can access environment multiple times', () => {
            const reader = Reader.ask<Env>().flatMap(env =>
                Reader.of<Env, string>(`${env.y}:${env.x}`)
            );
            const env: Env = { x: 42, y: 'hello', config: { debug: true, maxRetries: 3 } };
            expect(reader.run(env)).toBe('hello:42');
        });

        it('chained flatMaps work correctly', () => {
            const reader = Reader.from<Env, number>((env: Env) => env.x)
                .flatMap(x => Reader.of<Env, number>(x + 1))
                .flatMap(x => Reader.of<Env, number>(x * 2))
                .flatMap(x => Reader.of<Env, string>(`Result: ${x}`));
            const env: Env = { x: 2, y: 'test', config: { debug: true, maxRetries: 3 } };
            expect(reader.run(env)).toBe('Result: 6');
        });

        it('flatMap allows complex environment-dependent logic', () => {
            const reader = Reader.ask<Env>().flatMap(env =>
                env.config.debug
                    ? Reader.of<Env, string>(`Debug: ${env.x}`)
                    : Reader.of<Env, string>(`Value: ${env.x}`)
            );
            const debugEnv: Env = { x: 42, y: 'test', config: { debug: true, maxRetries: 3 } };
            const prodEnv: Env = { x: 42, y: 'test', config: { debug: false, maxRetries: 3 } };
            expect(reader.run(debugEnv)).toBe('Debug: 42');
            expect(reader.run(prodEnv)).toBe('Value: 42');
        });
    });

    describe('ask combinator', () => {
        it('ask provides access to environment', () => {
            const reader = Reader.ask<Env>();
            const env: Env = { x: 1, y: 'test', config: { debug: true, maxRetries: 3 } };
            expect(reader.run(env).x).toBe(1);
            expect(reader.run(env).y).toBe('test');
        });

        it('ask can be composed with map', () => {
            const reader = Reader.ask<Env>().map(env => env.config.maxRetries);
            const env: Env = { x: 1, y: 'test', config: { debug: true, maxRetries: 5 } };
            expect(reader.run(env)).toBe(5);
        });

        it('ask can be composed with flatMap', () => {
            const reader = Reader.ask<Env>().flatMap(env =>
                Reader.of<Env, number>(env.x * env.config.maxRetries)
            );
            const env: Env = { x: 3, y: 'test', config: { debug: true, maxRetries: 4 } };
            expect(reader.run(env)).toBe(12);
        });
    });

    describe('Monad Laws', () => {
        const f = (x: number) => Reader.of<Env, number>(x * 2);
        const g = (x: number) => Reader.of<Env, number>(x + 3);
        const env: Env = { x: 5, y: 'test', config: { debug: true, maxRetries: 3 } };

        it('satisfies left identity: of(a).flatMap(f) === f(a)', () => {
            const a = 5;
            const left = Reader.of<Env, number>(a).flatMap(f);
            const right = f(a);
            expect(left.run(env)).toBe(right.run(env));
        });

        it('satisfies right identity: m.flatMap(of) === m', () => {
            const m = Reader.of<Env, number>(5);
            const left = m.flatMap(x => Reader.of<Env, number>(x));
            expect(left.run(env)).toBe(m.run(env));
        });

        it('satisfies associativity: m.flatMap(f).flatMap(g) === m.flatMap(x => f(x).flatMap(g))', () => {
            const m = Reader.of<Env, number>(5);
            const left = m.flatMap(f).flatMap(g);
            const right = m.flatMap(x => f(x).flatMap(g));
            expect(left.run(env)).toBe(right.run(env));
        });
    });

    describe('Functor Laws', () => {
        const env: Env = { x: 5, y: 'test', config: { debug: true, maxRetries: 3 } };

        it('satisfies identity: m.map(x => x) === m', () => {
            const m = Reader.of<Env, number>(5);
            const mapped = m.map(x => x);
            expect(mapped.run(env)).toBe(m.run(env));
        });

        it('satisfies composition: m.map(f).map(g) === m.map(x => g(f(x)))', () => {
            const m = Reader.of<Env, number>(5);
            const f = (x: number) => x * 2;
            const g = (x: number) => x + 3;

            const left = m.map(f).map(g);
            const right = m.map(x => g(f(x)));
            expect(left.run(env)).toBe(right.run(env));
        });
    });

    describe('Edge Cases', () => {
        it('handles null and undefined values', () => {
            const readerNull = Reader.of<Env, null>(null);
            const env: Env = { x: 1, y: 'test', config: { debug: true, maxRetries: 3 } };
            expect(readerNull.run(env)).toBe(null);

            const readerUndefined = Reader.of<Env, undefined>(undefined);
            expect(readerUndefined.run(env)).toBe(undefined);
        });

        it('handles complex return types', () => {
            const reader = Reader.from<Env, { sum: number; product: number }>((env: Env) => ({
                sum: env.x + env.config.maxRetries,
                product: env.x * env.config.maxRetries
            }));
            const env: Env = { x: 3, y: 'test', config: { debug: true, maxRetries: 4 } };
            const result = reader.run(env);
            expect(result.sum).toBe(7);
            expect(result.product).toBe(12);
        });

        it('handles nested environment access', () => {
            const reader = Reader.from<Env, number>((env: Env) => 
                env.config.debug ? env.config.maxRetries * 2 : env.config.maxRetries
            );
            const debugEnv: Env = { x: 1, y: 'test', config: { debug: true, maxRetries: 3 } };
            const prodEnv: Env = { x: 1, y: 'test', config: { debug: false, maxRetries: 3 } };
            expect(reader.run(debugEnv)).toBe(6);
            expect(reader.run(prodEnv)).toBe(3);
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

            const logMessage = (msg: string) => Reader.from<AppEnv, void>((env: AppEnv) => {
                env.logger.log(`[${env.config.appName}] ${msg}`);
            });

            const reader = logMessage('Starting app')
                .flatMap(() => logMessage('Processing'))
                .flatMap(() => Reader.of<AppEnv, string>('Done'));

            const env: AppEnv = { logger, config: { appName: 'TestApp' } };
            const result = reader.run(env);
            
            expect(result).toBe('Done');
            expect(logs).toEqual([
                '[TestApp] Starting app',
                '[TestApp] Processing'
            ]);
        });

        it('can compose multiple ask calls', () => {
            const reader = Reader.ask<Env>()
                .flatMap(env1 => Reader.ask<Env>()
                    .map(env2 => env1.x + env2.config.maxRetries)
                );
            const env: Env = { x: 5, y: 'test', config: { debug: true, maxRetries: 3 } };
            expect(reader.run(env)).toBe(8);
        });
    });
});
