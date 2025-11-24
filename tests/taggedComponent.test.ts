import { describe, it, expect } from 'vitest';
import TaggedComponent from '../src/typeclass/taggedComponent.js';

describe('typeclass - TaggedComponent', () => {
    it('wraps and stringifies', () => {
        const t = TaggedComponent.of('x', 42);
        expect(t.tag).toBe('x');
        expect(t.content).toBe(42);
        expect(t.toString()).toBe('TaggedComponent(x, 42)');
    });
});
