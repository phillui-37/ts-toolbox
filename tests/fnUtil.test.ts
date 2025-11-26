import { describe, it, expect, vi } from 'vitest';
import {
  constant,
  id,
  pipe,
  compose,
  apply,
  run,
  also,
  noop,
  flip,
  flipHof,
  negate,
  all,
  any,
  uncurry,
  getOrExec,
} from '../src/util/fnUtil.js';

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


  it('getOrExec returns value or executes function', () => {
    expect(getOrExec(2)).toBe(2 as any);
    expect((getOrExec as any)(() => 3)).toBe(3);
  });
});
