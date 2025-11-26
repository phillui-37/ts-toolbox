import { describe, expect, it } from "vitest";
import { eq, ne, add, lt, le, gt, ge, sub, mul, div, floorDiv, ceilDiv, pow, instance, isType, shr, shl } from '../src';

describe('operator', () => {
    it('eq and ne behave as strict equality', () => {
        const isZero = eq(0);
        expect(isZero(0)).toBe(true);
        expect(isZero('0' as any)).toBe(false);
        const notZero = ne(0);
        expect(notZero(1)).toBe(true);
        expect(notZero(0)).toBe(false);
    });

    it('ordering comparision', () => {
        const lt0 = lt(0);
        expect(lt0(-1)).toBe(true);
        expect(lt0(0)).toBe(false);

        const le0 = le(0);
        expect(le0(0)).toBe(true);
        expect(le0(1)).toBe(false);

        const gt0 = gt(0);
        expect(gt0(0)).toBe(false);
        expect(gt0(1)).toBe(true);

        const ge0 = ge(0);
        expect(ge0(0)).toBe(true);
        expect(ge0(-1)).toBe(false);
    });

    it('arithmetic', () => {
        const add5 = add(5);
        expect(add5(10)).toBe(15);

        const sub5 = sub(5);
        expect(sub5(10)).toBe(5);

        const mul5 = mul(5);
        expect(mul5(10)).toBe(50);

        const div5 = div(5);
        expect(div5(10)).toBe(2);

        const floorDiv5 = floorDiv(5);
        expect(floorDiv5(11)).toBe(2);

        const ceilDiv5 = ceilDiv(5);
        expect(ceilDiv5(11)).toBe(3);

        const pow2 = pow(2);
        expect(pow2(5)).toBe(25);
    });

    it('type', () => {
        class Test {};
        const test = new Test();
        expect(instance(Test)(test)).toBe(true);

        expect(isType('object')({})).toBe(true);
    });

    it('bit', () => {
        expect(shr(2)(16)).toBe(4);
        expect(shl(2)(16)).toBe(64);
    });
});