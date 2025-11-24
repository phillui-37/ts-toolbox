import { describe, it, expect } from 'vitest';
import { Lens } from '../src/typeclass/lens.js';

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
