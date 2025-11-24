import { describe, it, expect } from 'vitest';
import { Result } from '../src/typeclass/result.js';

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
