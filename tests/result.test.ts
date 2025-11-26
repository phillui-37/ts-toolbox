import { describe, it, expect } from 'vitest';
import { Result } from '../src/typeclass/result.js';

describe('typeclass - Result', () => {
    describe('Constructors', () => {
        it('creates Ok with value', () => {
            const ok = Result.ok<number, string>(42);
            expect(Result.isOk(ok)).toBe(true);
            expect(ok.value).toBe(42);
            expect(ok.error).toBeUndefined();
            expect(ok.toString()).toBe('Ok(42)');
        });

        it('creates Err with error', () => {
            const err = Result.err<number, string>('error message');
            expect(Result.isErr(err)).toBe(true);
            expect(err.error).toBe('error message');
            expect(err.value).toBeUndefined();
            expect(err.toString()).toBe('Err("error message")');
        });

        it('fromTry catches and wraps exceptions', () => {
            const okResult = Result.fromTry(
                () => 10 + 5,
                () => 'error'
            );
            expect(Result.isOk(okResult)).toBe(true);
            expect(okResult.getOr(0)).toBe(15);

            const errResult = Result.fromTry(
                () => { throw new Error('boom'); },
                (err) => (err as Error).message
            );
            expect(Result.isErr(errResult)).toBe(true);
            expect(errResult.error).toBe('boom');
        });

        it('fromTry handles non-Error throws', () => {
            const result = Result.fromTry(
                () => { throw 'string error'; },
                (err) => String(err)
            );
            expect(Result.isErr(result)).toBe(true);
            expect(result.error).toBe('string error');
        });
    });

    describe('Type Guards', () => {
        it('isOk identifies Ok instances', () => {
            expect(Result.isOk(Result.ok(1))).toBe(true);
            expect(Result.isOk(Result.err('error'))).toBe(false);
        });

        it('isErr identifies Err instances', () => {
            expect(Result.isErr(Result.err('error'))).toBe(true);
            expect(Result.isErr(Result.ok(1))).toBe(false);
        });
    });

    describe('map (Functor)', () => {
        it('maps over Ok value', () => {
            const ok = Result.ok<number, string>(5);
            const result = ok.map(x => x * 2);
            expect(result.getOr(0)).toBe(10);
        });

        it('map on Err returns Err unchanged', () => {
            const err = Result.err<number, string>('error');
            const result = err.map(x => x * 2);
            expect(Result.isErr(result)).toBe(true);
            expect(result.error).toBe('error');
        });

        it('map can change value type', () => {
            const ok = Result.ok<number, string>(42);
            const result = ok.map(x => `Value: ${x}`);
            expect(result.getOr('')).toBe('Value: 42');
        });

        it('chained maps work correctly', () => {
            const result = Result.ok<number, string>(2)
                .map(x => x + 1)
                .map(x => x * 2)
                .map(x => `Result: ${x}`);
            expect(result.getOr('')).toBe('Result: 6');
        });

        it('map short-circuits after error', () => {
            let called = false;
            const result = Result.err<number, string>('error')
                .map(x => {
                    called = true;
                    return x * 2;
                });
            expect(called).toBe(false);
            expect(Result.isErr(result)).toBe(true);
        });
    });

    describe('flatMap (Monad)', () => {
        it('flatMap on Ok chains correctly', () => {
            const ok = Result.ok<number, string>(5);
            const result = ok.flatMap(x => Result.ok(x + 10));
            expect(result.getOr(0)).toBe(15);
        });

        it('flatMap on Err returns Err', () => {
            const err = Result.err<number, string>('error');
            const result = err.flatMap(x => Result.ok(x + 10));
            expect(Result.isErr(result)).toBe(true);
            expect(result.error).toBe('error');
        });

        it('flatMap with Err result propagates error', () => {
            const ok = Result.ok<number, string>(5);
            const result = ok.flatMap(_ => Result.err<number, string>('new error'));
            expect(Result.isErr(result)).toBe(true);
            expect(result.error).toBe('new error');
        });

        it('chained flatMaps work correctly', () => {
            const result = Result.ok<number, string>(2)
                .flatMap(x => Result.ok(x + 1))
                .flatMap(x => Result.ok(x * 2))
                .flatMap(x => Result.ok(`Result: ${x}`));
            expect(result.getOr('')).toBe('Result: 6');
        });

        it('flatMap short-circuits on first error', () => {
            let called = false;
            const result = Result.ok<number, string>(2)
                .flatMap(x => Result.ok(x + 1))
                .flatMap(_ => Result.err<number, string>('error'))
                .flatMap(x => {
                    called = true;
                    return Result.ok(x * 100);
                });
            expect(called).toBe(false);
            expect(Result.isErr(result)).toBe(true);
        });
    });

    describe('mapError', () => {
        it('mapError transforms Err value', () => {
            const err = Result.err<number, string>('error');
            const result = err.mapError(e => e.toUpperCase());
            expect(result.error).toBe('ERROR');
        });

        it('mapError on Ok returns Ok unchanged', () => {
            const ok = Result.ok<number, string>(42);
            const result = ok.mapError(e => e.toUpperCase());
            expect(Result.isOk(result)).toBe(true);
            expect(result.value).toBe(42);
        });

        it('mapError can change error type', () => {
            const err = Result.err<number, string>('error');
            const result = err.mapError(e => e.length);
            expect(result.error).toBe(5);
        });

        it('chained mapError works correctly', () => {
            const result = Result.err<number, string>('error')
                .mapError(e => e.toUpperCase())
                .mapError(e => `[${e}]`);
            expect(result.error).toBe('[ERROR]');
        });
    });

    describe('getOr and getOrElse (Extractable)', () => {
        it('getOr returns value from Ok', () => {
            const ok = Result.ok<number, string>(42);
            expect(ok.getOr(0)).toBe(42);
        });

        it('getOr returns default from Err', () => {
            const err = Result.err<number, string>('error');
            expect(err.getOr(99)).toBe(99);
        });

        it('getOrElse returns value from Ok', () => {
            const ok = Result.ok<number, string>(42);
            expect(ok.getOrElse(() => 0)).toBe(42);
        });

        it('getOrElse returns computed default from Err', () => {
            const err = Result.err<number, string>('error');
            let called = false;
            const result = err.getOrElse(() => {
                called = true;
                return 99;
            });
            expect(result).toBe(99);
            expect(called).toBe(true);
        });

        it('getOrElse does not call function for Ok', () => {
            const ok = Result.ok<number, string>(42);
            let called = false;
            const result = ok.getOrElse(() => {
                called = true;
                return 99;
            });
            expect(result).toBe(42);
            expect(called).toBe(false);
        });
    });

    describe('or and and (Alternative)', () => {
        it('or returns first Ok', () => {
            const ok1 = Result.ok<number, string>(1);
            const ok2 = Result.ok<number, string>(2);
            expect(ok1.or(ok2).getOr(0)).toBe(1);
        });

        it('or returns second if first is Err', () => {
            const err = Result.err<number, string>('error');
            const ok = Result.ok<number, string>(2);
            expect(err.or(ok).getOr(0)).toBe(2);
        });

        it('or returns second Err if both are Err', () => {
            const err1 = Result.err<number, string>('error1');
            const err2 = Result.err<number, string>('error2');
            const result = err1.or(err2);
            expect(Result.isErr(result)).toBe(true);
            expect(result.error).toBe('error2');
        });

        it('and returns second if first is Ok', () => {
            const ok1 = Result.ok<number, string>(1);
            const ok2 = Result.ok<number, string>(2);
            expect(ok1.and(ok2).getOr(0)).toBe(2);
        });

        it('and returns first Err', () => {
            const err = Result.err<number, string>('error');
            const ok = Result.ok<number, string>(2);
            expect(Result.isErr(err.and(ok))).toBe(true);
            expect(err.and(ok).error).toBe('error');
        });

        it('and returns second Err if first is Ok and second is Err', () => {
            const ok = Result.ok<number, string>(1);
            const err = Result.err<number, string>('error');
            const result = ok.and(err);
            expect(Result.isErr(result)).toBe(true);
            expect(result.error).toBe('error');
        });
    });

    describe('consume and consumeErr (Effectful)', () => {
        it('consume runs side effect on Ok', () => {
            let sideEffect = 0;
            const ok = Result.ok<number, string>(42);
            const result = ok.consume(x => { sideEffect = x; });
            expect(sideEffect).toBe(42);
            expect(result).toBe(ok);
            expect(result.getOr(0)).toBe(42);
        });

        it('consume does not run on Err', () => {
            let called = false;
            const err = Result.err<number, string>('error');
            const result = err.consume(_ => { called = true; });
            expect(called).toBe(false);
            expect(result).toBe(err);
        });

        it('consumeErr runs side effect on Err', () => {
            let sideEffect = '';
            const err = Result.err<number, string>('error');
            const result = err.consumeErr(e => { sideEffect = e; });
            expect(sideEffect).toBe('error');
            expect(result).toBe(err);
        });

        it('consumeErr does not run on Ok', () => {
            let called = false;
            const ok = Result.ok<number, string>(42);
            const result = ok.consumeErr(_ => { called = true; });
            expect(called).toBe(false);
            expect(result).toBe(ok);
        });

        it('consume and consumeErr can be chained', () => {
            let okEffect = 0;
            let errEffect = '';
            
            const ok = Result.ok<number, string>(42);
            ok.consume(x => { okEffect = x; })
                .consumeErr(e => { errEffect = e; });
            expect(okEffect).toBe(42);
            expect(errEffect).toBe('');

            okEffect = 0;
            errEffect = '';

            const err = Result.err<number, string>('error');
            err.consume(x => { okEffect = x; })
                .consumeErr(e => { errEffect = e; });
            expect(okEffect).toBe(0);
            expect(errEffect).toBe('error');
        });
    });

    describe('Monad Laws', () => {
        const f = (x: number) => Result.ok<number, string>(x * 2);
        const g = (x: number) => Result.ok<number, string>(x + 3);

        it('satisfies left identity: of(a).flatMap(f) === f(a)', () => {
            const a = 5;
            const left = Result.ok<number, string>(a).flatMap(f);
            const right = f(a);
            expect(left.getOr(0)).toBe(right.getOr(0));
        });

        it('satisfies right identity: m.flatMap(of) === m', () => {
            const m = Result.ok<number, string>(5);
            const left = m.flatMap(x => Result.ok(x));
            expect(left.getOr(0)).toBe(m.getOr(0));
        });

        it('satisfies associativity: m.flatMap(f).flatMap(g) === m.flatMap(x => f(x).flatMap(g))', () => {
            const m = Result.ok<number, string>(5);
            const left = m.flatMap(f).flatMap(g);
            const right = m.flatMap(x => f(x).flatMap(g));
            expect(left.getOr(0)).toBe(right.getOr(0));
        });

        it('left identity holds for Err', () => {
            const err = Result.err<number, string>('error');
            const result = err.flatMap(f);
            expect(Result.isErr(result)).toBe(true);
        });

        it('right identity holds for Err', () => {
            const err = Result.err<number, string>('error');
            const result = err.flatMap(x => Result.ok(x));
            expect(Result.isErr(result)).toBe(true);
        });
    });

    describe('Functor Laws', () => {
        it('satisfies identity: m.map(x => x) === m', () => {
            const ok = Result.ok<number, string>(5);
            const mapped = ok.map(x => x);
            expect(mapped.getOr(0)).toBe(ok.getOr(0));

            const err = Result.err<number, string>('error');
            const mappedErr = err.map(x => x);
            expect(Result.isErr(mappedErr)).toBe(true);
            expect(mappedErr.error).toBe('error');
        });

        it('satisfies composition: m.map(f).map(g) === m.map(x => g(f(x)))', () => {
            const m = Result.ok<number, string>(5);
            const f = (x: number) => x * 2;
            const g = (x: number) => x + 3;

            const left = m.map(f).map(g);
            const right = m.map(x => g(f(x)));
            expect(left.getOr(0)).toBe(right.getOr(0));
        });
    });

    describe('Edge Cases', () => {
        it('handles null and undefined in Ok', () => {
            const okNull = Result.ok<null, string>(null);
            expect(Result.isOk(okNull)).toBe(true);
            expect(okNull.value).toBe(null);

            const okUndefined = Result.ok<undefined, string>(undefined);
            expect(Result.isOk(okUndefined)).toBe(true);
            expect(okUndefined.value).toBe(undefined);
        });

        it('handles null and undefined in Err', () => {
            const errNull = Result.err<number, null>(null);
            expect(Result.isErr(errNull)).toBe(true);
            expect(errNull.error).toBe(null);

            const errUndefined = Result.err<number, undefined>(undefined);
            expect(Result.isErr(errUndefined)).toBe(true);
            expect(errUndefined.error).toBe(undefined);
        });

        it('handles complex objects in Ok', () => {
            const obj = { a: 1, b: { c: 2 } };
            const ok = Result.ok<typeof obj, string>(obj);
            expect(ok.map(o => o.b.c).getOr(0)).toBe(2);
        });

        it('handles complex objects in Err', () => {
            const error = { code: 500, message: 'Internal Error' };
            const err = Result.err<number, typeof error>(error);
            expect(err.mapError(e => e.code).error).toBe(500);
        });

        it('toString produces correct output', () => {
            expect(Result.ok(42).toString()).toBe('Ok(42)');
            expect(Result.ok('hello').toString()).toBe('Ok("hello")');
            expect(Result.ok({ x: 1 }).toString()).toBe('Ok({"x":1})');
            expect(Result.err('error').toString()).toBe('Err("error")');
            expect(Result.err(404).toString()).toBe('Err(404)');
        });

        it('handles function composition with mixed Ok/Err', () => {
            const safeDivide = (x: number, y: number): Result<number, string> =>
                y === 0 ? Result.err('Division by zero') : Result.ok(x / y);

            const result1 = Result.ok<number, string>(10)
                .flatMap(x => safeDivide(x, 2))
                .map(x => x + 5);
            expect(result1.getOr(0)).toBe(10);

            const result2 = Result.ok<number, string>(10)
                .flatMap(x => safeDivide(x, 0))
                .map(x => x + 5);
            expect(Result.isErr(result2)).toBe(true);
            expect(result2.error).toBe('Division by zero');
        });

        it('handles error recovery patterns', () => {
            const result = Result.err<number, string>('error')
                .or(Result.err('error2'))
                .or(Result.ok(42));
            expect(result.getOr(0)).toBe(42);
        });
    });
});
