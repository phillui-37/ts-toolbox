import { describe, it, expect } from 'vitest';
import Reader from '../src/typeclass/reader.js';

describe('typeclass - Reader', () => {
    it('reads environment and composes', () => {
        const r = Reader.from((env: { x: number }) => env.x + 1);
        const doubled = r.map(v => v * 2);
        expect(doubled.run({ x: 2 })).toBe(6);

        const chain = r.flatMap(v => Reader.of<{ x: number }, number>(v * 3));
        expect(chain.run({ x: 2 })).toBe(9);
    });
});
