import { describe, expect, it } from "vitest";
import { prop, flattenBy } from '../src';

describe('collections', () => {
    it('prop gets nested properties safely', () => {
        const getCity = prop('user.address.city');
        expect(getCity({ user: { address: { city: 'NY' } } })).toBe('NY');
        const getMissing = prop('a.b.c');
        expect(getMissing({} as any)).toBeUndefined();
    });

      it('flattenBy works for arrays and objects', () => {
        const users = [{ name: 'A' }, { name: 'B' }];
        const names = flattenBy((u: any) => u.name)(users);
        expect(names).toEqual(['A', 'B']);
    
        const dict = { a: { id: 1 }, b: { id: 2 } };
        const ids = flattenBy((x: any) => x.id)(dict as any);
        expect(ids).toEqual({ a: 1, b: 2 });
      });
})