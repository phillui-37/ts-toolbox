import { describe, it, expect } from 'vitest';
import { Maybe } from '../src/typeclass/maybe.js';

describe('typeclass - Maybe', () => {
    describe('Constructors', () => {
        it('creates Some with value', () => {
            const some = Maybe.some(42);
            expect(Maybe.isSome(some)).toBe(true);
            expect(some.value).toBe(42);
            expect(some.toString()).toBe('Some(42)');
        });

        it('creates None without value', () => {
            const none = Maybe.none<number>();
            expect(Maybe.isNone(none)).toBe(true);
            expect(none.value).toBeUndefined();
            expect(none.toString()).toBe('None');
        });

        it('reuses None singleton', () => {
            const none1 = Maybe.none<number>();
            const none2 = Maybe.none<string>();
            expect(none1).toBe(none2);
        });

        it('creates from nullable values', () => {
            expect(Maybe.isSome(Maybe.fromNullable(42))).toBe(true);
            expect(Maybe.fromNullable(42).getOr(0)).toBe(42);
            expect(Maybe.isNone(Maybe.fromNullable(null))).toBe(true);
            expect(Maybe.isNone(Maybe.fromNullable(undefined))).toBe(true);
            expect(Maybe.fromNullable(0).getOr(99)).toBe(0); // 0 is not null
            expect(Maybe.fromNullable('').getOr('default')).toBe(''); // empty string is not null
        });
    });

    describe('Type Guards', () => {
        it('isSome identifies Some instances', () => {
            expect(Maybe.isSome(Maybe.some(1))).toBe(true);
            expect(Maybe.isSome(Maybe.none())).toBe(false);
        });

        it('isNone identifies None instances', () => {
            expect(Maybe.isNone(Maybe.none())).toBe(true);
            expect(Maybe.isNone(Maybe.some(1))).toBe(false);
        });

        it('isMaybe identifies Maybe instances', () => {
            expect(Maybe.isMaybe(Maybe.some(1))).toBe(true);
            expect(Maybe.isMaybe(Maybe.none())).toBe(true);
            expect(Maybe.isMaybe(42)).toBe(false);
            expect(Maybe.isMaybe(null)).toBe(false);
            expect(Maybe.isMaybe({})).toBe(false);
        });
    });

    describe('map (Functor)', () => {
        it('maps over Some value', () => {
            const some = Maybe.some(2);
            const result = some.map(x => x * 3);
            expect(result.getOr(0)).toBe(6);
        });

        it('map on None returns None', () => {
            const none = Maybe.none<number>();
            const result = none.map(x => x * 3);
            expect(Maybe.isNone(result)).toBe(true);
        });

        it('map can change types', () => {
            const some = Maybe.some(42);
            const result = some.map(x => `Value: ${x}`);
            expect(result.getOr('')).toBe('Value: 42');
        });

        it('chained maps work correctly', () => {
            const result = Maybe.some(2)
                .map(x => x + 1)
                .map(x => x * 2)
                .map(x => `Result: ${x}`);
            expect(result.getOr('')).toBe('Result: 6');
        });
    });

    describe('flatMap (Monad)', () => {
        it('flatMap on Some chains correctly', () => {
            const some = Maybe.some(5);
            const result = some.flatMap(x => Maybe.some(x + 10));
            expect(result.getOr(0)).toBe(15);
        });

        it('flatMap on None returns None', () => {
            const none = Maybe.none<number>();
            const result = none.flatMap(x => Maybe.some(x + 10));
            expect(Maybe.isNone(result)).toBe(true);
        });

        it('flatMap with None result short-circuits', () => {
            const some = Maybe.some(5);
            const result = some.flatMap(_ => Maybe.none<number>());
            expect(Maybe.isNone(result)).toBe(true);
        });

        it('chained flatMaps work correctly', () => {
            const result = Maybe.some(2)
                .flatMap(x => Maybe.some(x + 1))
                .flatMap(x => Maybe.some(x * 2))
                .flatMap(x => Maybe.some(`Result: ${x}`));
            expect(result.getOr('')).toBe('Result: 6');
        });

        it('flatMap short-circuits on first None', () => {
            const result = Maybe.some(2)
                .flatMap(x => Maybe.some(x + 1))
                .flatMap(_ => Maybe.none<number>())
                .flatMap(x => Maybe.some(x * 100)); // should not execute
            expect(Maybe.isNone(result)).toBe(true);
        });
    });

    describe('getOr and getOrElse (Extractable)', () => {
        it('getOr returns value from Some', () => {
            const some = Maybe.some(42);
            expect(some.getOr(0)).toBe(42);
        });

        it('getOr returns default from None', () => {
            const none = Maybe.none<number>();
            expect(none.getOr(99)).toBe(99);
        });

        it('getOrElse returns value from Some', () => {
            const some = Maybe.some(42);
            expect(some.getOrElse(() => 0)).toBe(42);
        });

        it('getOrElse returns computed default from None', () => {
            const none = Maybe.none<number>();
            let called = false;
            const result = none.getOrElse(() => {
                called = true;
                return 99;
            });
            expect(result).toBe(99);
            expect(called).toBe(true);
        });

        it('getOrElse does not call function for Some', () => {
            const some = Maybe.some(42);
            let called = false;
            const result = some.getOrElse(() => {
                called = true;
                return 99;
            });
            expect(result).toBe(42);
            expect(called).toBe(false);
        });
    });

    describe('or and and (Alternative)', () => {
        it('or returns first Some', () => {
            const some1 = Maybe.some(1);
            const some2 = Maybe.some(2);
            expect(some1.or(some2).getOr(0)).toBe(1);
        });

        it('or returns second if first is None', () => {
            const none = Maybe.none<number>();
            const some = Maybe.some(2);
            expect(none.or(some).getOr(0)).toBe(2);
        });

        it('or returns None if both are None', () => {
            const none1 = Maybe.none<number>();
            const none2 = Maybe.none<number>();
            expect(Maybe.isNone(none1.or(none2))).toBe(true);
        });

        it('and returns second if first is Some', () => {
            const some1 = Maybe.some(1);
            const some2 = Maybe.some(2);
            expect(some1.and(some2).getOr(0)).toBe(2);
        });

        it('and returns None if first is None', () => {
            const none = Maybe.none<number>();
            const some = Maybe.some(2);
            expect(Maybe.isNone(none.and(some))).toBe(true);
        });

        it('and returns None if second is None', () => {
            const some = Maybe.some(1);
            const none = Maybe.none<number>();
            expect(Maybe.isNone(some.and(none))).toBe(true);
        });
    });

    describe('Monad Laws', () => {
        const f = (x: number) => Maybe.some(x * 2);
        const g = (x: number) => Maybe.some(x + 3);

        it('satisfies left identity: of(a).flatMap(f) === f(a)', () => {
            const a = 5;
            const left = Maybe.some(a).flatMap(f);
            const right = f(a);
            expect(left.getOr(0)).toBe(right.getOr(0));
        });

        it('satisfies right identity: m.flatMap(of) === m', () => {
            const m = Maybe.some(5);
            const left = m.flatMap(x => Maybe.some(x));
            expect(left.getOr(0)).toBe(m.getOr(0));
        });

        it('satisfies associativity: m.flatMap(f).flatMap(g) === m.flatMap(x => f(x).flatMap(g))', () => {
            const m = Maybe.some(5);
            const left = m.flatMap(f).flatMap(g);
            const right = m.flatMap(x => f(x).flatMap(g));
            expect(left.getOr(0)).toBe(right.getOr(0));
        });

        it('left identity holds for None', () => {
            const none = Maybe.none<number>();
            const result = none.flatMap(f);
            expect(Maybe.isNone(result)).toBe(true);
        });

        it('right identity holds for None', () => {
            const none = Maybe.none<number>();
            const result = none.flatMap(x => Maybe.some(x));
            expect(Maybe.isNone(result)).toBe(true);
        });
    });

    describe('Functor Laws', () => {
        it('satisfies identity: m.map(x => x) === m', () => {
            const m = Maybe.some(5);
            const mapped = m.map(x => x);
            expect(mapped.getOr(0)).toBe(m.getOr(0));

            const none = Maybe.none<number>();
            const mappedNone = none.map(x => x);
            expect(Maybe.isNone(mappedNone)).toBe(true);
        });

        it('satisfies composition: m.map(f).map(g) === m.map(x => g(f(x)))', () => {
            const m = Maybe.some(5);
            const f = (x: number) => x * 2;
            const g = (x: number) => x + 3;

            const left = m.map(f).map(g);
            const right = m.map(x => g(f(x)));
            expect(left.getOr(0)).toBe(right.getOr(0));
        });
    });

    describe('Edge Cases', () => {
        it('handles null and undefined values correctly', () => {
            const someNull = Maybe.some(null);
            expect(Maybe.isSome(someNull)).toBe(true);
            expect(someNull.value).toBe(null);

            const someUndefined = Maybe.some(undefined);
            expect(Maybe.isSome(someUndefined)).toBe(true);
            expect(someUndefined.value).toBe(undefined);
        });

        it('handles complex objects', () => {
            const obj = { a: 1, b: { c: 2 } };
            const some = Maybe.some(obj);
            expect(some.map(o => o.b.c).getOr(0)).toBe(2);
        });

        it('handles arrays', () => {
            const arr = [1, 2, 3];
            const some = Maybe.some(arr);
            expect(some.map(a => a.length).getOr(0)).toBe(3);
        });

        it('toString produces correct output', () => {
            expect(Maybe.some(42).toString()).toBe('Some(42)');
            expect(Maybe.some('hello').toString()).toBe('Some("hello")');
            expect(Maybe.some({ x: 1 }).toString()).toBe('Some({"x":1})');
            expect(Maybe.none().toString()).toBe('None');
        });

        it('handles function composition with mixed Some/None', () => {
            const safeDivide = (x: number, y: number): Maybe<number> =>
                y === 0 ? Maybe.none() : Maybe.some(x / y);

            const result1 = Maybe.some(10)
                .flatMap(x => safeDivide(x, 2))
                .map(x => x + 5);
            expect(result1.getOr(0)).toBe(10);

            const result2 = Maybe.some(10)
                .flatMap(x => safeDivide(x, 0))
                .map(x => x + 5);
            expect(Maybe.isNone(result2)).toBe(true);
        });
    });
});
