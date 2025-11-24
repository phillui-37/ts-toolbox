import { describe, it, expect } from 'vitest';

import { Lens } from '../src/typeclass/lens.js';
import { Maybe } from '../src/typeclass/maybe.js';
import { Prism } from '../src/typeclass/prism.js';
import { Result } from '../src/typeclass/result.js';
import TaggedComponent from '../src/typeclass/taggedComponent.js';

describe('typeclass - Lens', () => {
    it('gets and sets nested values via composition', () => {
        type Person = { name: string; address: { city: string } };
        const addressLens = Lens.of<Person, Person['address']>({
            get: (p) => p.address,
            set: (a, p) => ({ ...p, address: a })
        });

        const cityLens = Lens.of<Person['address'], string>({
            get: (a) => a.city,
            set: (c, a) => ({ ...a, city: c })
        });

        const personCity = Lens.compose(addressLens, cityLens);
        const p = { name: 'A', address: { city: 'Old' } };
        expect(personCity.get(p)).toBe('Old');
        const newP = personCity.set('New', p);
        expect(newP.address.city).toBe('New');
        expect(p.address.city).toBe('Old');
    });
});

describe('typeclass - Maybe', () => {
    it('some and none behave as expected', () => {
        const a = Maybe.some(2);
        expect(a.map(x => x * 2).getOr(0)).toBe(4);
        expect(a.flatMap(x => Maybe.some(x + 1)).getOr(0)).toBe(3);

        const n = Maybe.none<number>();
        expect(n.getOr(10)).toBe(10);
        expect(n.getOrElse(() => 20)).toBe(20);
        expect(Maybe.fromNullable(null)).toBe(Maybe.none());
        expect(Maybe.isNone(n)).toBe(true);
        expect(Maybe.isSome(a)).toBe(true);
    });
});

describe('typeclass - Prism', () => {
    it('compose and getOrElse work for optional nested values', () => {
        type Inner = { b: number };
        type Outer = { a?: Inner };

        const aPrism = Prism.of<Outer, Inner>({
            get: (s) => s.a,
            set: (a, s) => ({ ...s, a })
        });

        const bPrism = Prism.of<Inner, number>({
            get: (i) => i.b,
            set: (b, i) => ({ ...i, b })
        });

        const composed = Prism.compose(aPrism, bPrism);
        const obj: Outer = { a: { b: 5 } };
        expect(composed.get(obj)).toBe(5);
        expect(Prism.getOrElse(composed, { }, 99)).toBe(99);
        const updated = composed.set(10, obj);
        expect(composed.get(updated)).toBe(10);
    });
});

describe('typeclass - Result', () => {
    it('ok/err map and mapError behave', () => {
        const ok = Result.ok<number, string>(3);
        expect(ok.map(x => x + 1).getOr(0)).toBe(4);

        const e = Result.err<number, string>('bad');
        expect(e.map(x => x + 1).getOr(0)).toBe(0);
        expect(e.mapError(s => s.toUpperCase()).toString()).toContain('Err("BAD")');

        const fromTryOk = Result.fromTry(() => 1 + 1, () => 'no');
        expect(fromTryOk.getOr(0)).toBe(2);

        const fromTryErr = Result.fromTry(() => { throw new Error('boom'); }, (err) => String((err as Error).message));
        expect(Result.isErr(fromTryErr)).toBe(true);
    });
});

describe('typeclass - TaggedComponent', () => {
    it('wraps and stringifies', () => {
        const t = TaggedComponent.of('x', 42);
        expect(t.tag).toBe('x');
        expect(t.content).toBe(42);
        expect(t.toString()).toBe('TaggedComponent(x, 42)');
    });
});
