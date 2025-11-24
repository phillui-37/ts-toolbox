import { describe, it, expect, vi } from 'vitest';
import {
  constant,
  id,
  prop,
  pipe,
  compose,
  apply,
  eq,
  ne,
  flattenBy,
  run,
  also,
  noop,
  flip,
  flipHof,
  negate,
  add,
  select,
  falsy,
  allFalsy,
  anyFalsy,
  truthy,
  allTruthy,
  anyTruthy,
  all,
  any,
  uncurry,
  bounded,
  getOrExec,
} from '@/util/fnUtil.js';

describe('fnUtil', () => {
  it('constant always returns the same value', () => {
    const alwaysTrue = constant(true);
    expect(alwaysTrue()).toBe(true);
    expect(alwaysTrue(1, 2, 3)).toBe(true);

    const foo = constant({ a: 1 });
    expect(foo().a).toBe(1);
  });

  it('id returns value unchanged', () => {
    const obj = { x: 1 };
    expect(id(obj)).toBe(obj);
    expect(id(5)).toBe(5);
  });

  it('prop gets nested properties safely', () => {
    const getCity = prop('user.address.city');
    expect(getCity({ user: { address: { city: 'NY' } } })).toBe('NY');
    const getMissing = prop('a.b.c');
    expect(getMissing({} as any)).toBeUndefined();
  });

  it('pipe and compose compose functions correctly', () => {
    const addOne = (x: number) => x + 1;
    const double = (x: number) => x * 2;
    const p = pipe(addOne, double);
    expect(p(3)).toBe(8);
    const c = compose(double, addOne);
    expect(c(3)).toBe(8);
  });

  it('apply applies a function to args', () => {
    const add = (a: number, b: number) => a + b;
    const applyAdd = apply(add);
    expect(applyAdd(2, 3)).toBe(5);
  });

  it('eq and ne behave as strict equality', () => {
    const isZero = eq(0);
    expect(isZero(0)).toBe(true);
    expect(isZero('0' as any)).toBe(false);
    const notZero = ne(0);
    expect(notZero(1)).toBe(true);
    expect(notZero(0)).toBe(false);
  });

  it('flattenBy works for arrays and objects', () => {
    const users = [{ name: 'A' }, { name: 'B' }];
    const names = flattenBy((u: any) => u.name)(users);
    expect(names).toEqual(['A', 'B']);

    const dict = { a: { id: 1 }, b: { id: 2 } };
    const ids = flattenBy((x: any) => x.id)(dict as any);
    expect(ids).toEqual({ a: 1, b: 2 });
  });

  it('run invokes the function and returns result', () => {
    const add = (a: number, b: number) => a + b;
    expect(run(add)(2, 3)).toBe(5);
  });

  it('also runs side effect and returns original args', () => {
    const spy = vi.fn();
    const f = also(spy);
    const returned = f(1, 2);
    expect(spy).toHaveBeenCalledWith(1, 2);
    expect(returned).toEqual([1, 2]);
  });

  it('noop returns undefined', () => {
    expect(noop()).toBeUndefined();
    expect(noop(1, 2)).toBeUndefined();
  });

  it('flip flips argument order', () => {
    const join = (a: string, b: string) => a + b;
    const flipped = flip(join);
    expect(flipped('1', '2')).toBe('21');
  });

  it('flipHof flips curried functions', () => {
    const curried = (a: number) => (b: number) => a - b;
    const flipped = flipHof(curried);
    expect(flipped(2)(5)).toBe(3); // flipped: b -> a => original a-b => 5-2 = 3
  });

  it('negate negates boolean functions', () => {
    const isEven = (n: number) => n % 2 === 0;
    const isOdd = negate(isEven);
    expect(isOdd(3)).toBe(true);
    expect(isOdd(4)).toBe(false);
  });

  it('add returns adder function', () => {
    const add5 = add(5);
    expect(add5(10)).toBe(15);
  });

  it('select chooses correct branch for boolean and function predicate', () => {
    expect(select({ pred: true, t: () => 'yes', f: () => 'no' })).toBe('yes');
    expect(select({ pred: false, t: () => 'yes', f: () => 'no' })).toBe('no');
    expect(select({ pred: () => 1 > 0, t: () => 1 })).toBe(1);
    expect(select({ pred: () => false })).toBeUndefined();
  });

  it('falsy/truthy helpers work', () => {
    expect(falsy(0)).toBe(true);
    expect(truthy(1)).toBe(true);
    expect(allFalsy(0, '', null)).toBe(true);
    expect(anyFalsy(0, 1)).toBe(true);
    expect(allTruthy(1, 'a', true)).toBe(true);
    expect(anyTruthy(0, 'a')).toBe(true);
  });

  it('all and any combine predicates', () => {
    const pos = (n: number) => n > 0;
    const even = (n: number) => n % 2 === 0;
    const allPred = all(pos, even);
    expect(allPred(4)).toBe(true);
    expect(allPred(-2)).toBe(false);

    const anyPred = any(pos, even);
    expect(anyPred(-2)).toBe(true); // even
    expect(anyPred(-3)).toBe(false);
  });

  it('uncurry converts curried function to binary function', () => {
    const curried = (a: number) => (b: number) => a + b;
    const uncurried = uncurry(curried);
    expect(uncurried(2, 3)).toBe(5);
  });

  it('bounded clamps values according to inclusive flags', () => {
    const b1 = bounded(0, 10); // inclusive default
    expect(b1(-1)).toBe(0);
    expect(b1(11)).toBe(10);
    expect(b1(5)).toBe(5);

    const b2 = bounded(0, 10, { min: false, max: false });
    expect(b2(0)).toBe(0); // since min comparison is <= in exclusive mode, 0 <= 0 -> true -> returns min
  });

  it('getOrExec returns value or executes function', () => {
    expect(getOrExec(2)).toBe(2 as any);
    expect((getOrExec as any)(() => 3)).toBe(3);
  });
});
