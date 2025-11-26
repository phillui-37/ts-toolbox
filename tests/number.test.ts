import { describe, expect, it } from "vitest";
import { bounded } from "../src";

describe('number', () => {
    it('bounded clamps values according to inclusive flags', () => {
        const b1 = bounded(0, 10); // inclusive default
        expect(b1(-1)).toBe(0);
        expect(b1(11)).toBe(10);
        expect(b1(5)).toBe(5);

        const b2 = bounded(0, 10, { min: false, max: false });
        expect(b2(0)).toBe(0); // since min comparison is <= in exclusive mode, 0 <= 0 -> true -> returns min
    });
});