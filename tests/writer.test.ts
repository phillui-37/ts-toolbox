import { describe, it, expect } from 'vitest';
import Writer from '../src/typeclass/writer.js';

describe('typeclass - Writer', () => {
    it('accumulates logs and composes', () => {
        const w = Writer.of(2, 'start;');
        const mapped = w.map(x => x + 3);
        expect(mapped.value).toBe(5);
        expect(mapped.log).toBe('start;');

        const chained = w.flatMap(x => Writer.of(x * 2, ' *2;'));
        expect(chained.value).toBe(4);
        expect(chained.log).toBe('start; *2;');
    });
});
