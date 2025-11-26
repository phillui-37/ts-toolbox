/**
 * Creates a function that always returns the same value regardless of input.
 *
 * @template T - The type of the constant value
 * @param value - The value to be returned by the constant function
 * @returns A function that always returns the provided value
 * @example
 * const alwaysTrue = constant(true);
 * alwaysTrue(); // returns true
 * alwaysTrue(123); // still returns true
 */
export const constant =
    <T>(value: T) =>
        (..._: any[]) =>
            value;

/**
 * Identity function that returns the input value unchanged.
 *
 * @template T - The type of the value
 * @param value - The value to return
 * @returns The same value that was passed in
 * @example
 * id(5); // returns 5
 * id({ name: 'John' }); // returns { name: 'John' }
 */
export const id = <T>(value: T) => value;

/**
 * Composes two functions by passing the result of the first function as an argument to the second function.
 *
 * @template T - The type of arguments for the first function
 * @template U - The return type of the first function and input type of the second function
 * @template R - The return type of the second function
 * @param fn1 - The first function to execute
 * @param fn2 - The second function that receives the result of the first function
 * @returns A function that applies fn1 and then fn2
 * @example
 * const addOne = (x) => x + 1;
 * const double = (x) => x * 2;
 * const addOneThenDouble = pipe(addOne, double);
 * addOneThenDouble(3); // returns 8 (double(addOne(3)))
 */
export const pipe =
    <T extends any[], U, R>(fn1: (...args: T) => U, fn2: (arg: U) => R) =>
        (...args: T): R =>
            fn2(fn1(...args));

/**
 * Composes two functions in reverse order compared to pipe.
 *
 * @template T - The type of arguments for the first function
 * @template U - The return type of the first function and input type of the second function
 * @template R - The return type of the second function
 * @param fn2 - The second function to execute
 * @param fn1 - The first function that provides input to the second function
 * @returns A function that applies fn1 and then fn2
 * @example
 * const addOne = (x) => x + 1;
 * const double = (x) => x * 2;
 * const doubleAfterAddOne = compose(double, addOne);
 * doubleAfterAddOne(3); // returns 8 (double(addOne(3)))
 */
export const compose =
    <T extends any[], U, R>(fn2: (arg: U) => R, fn1: (...args: T) => U) =>
        (...args: T): R =>
            fn2(fn1(...args));

/**
 * Creates a function that applies the provided function to its arguments.
 * Useful for partial application and function composition.
 *
 * @template T - The type of arguments the function accepts
 * @template U - The return type of the function
 * @param fn - The function to apply
 * @returns A function that applies the provided function to its arguments
 * @example
 * const add = (a, b) => a + b;
 * const applyAdd = apply(add);
 * applyAdd(2, 3); // returns 5
 */
export const apply =
    <T extends any[], U>(fn: (...args: T) => U) =>
        (...args: T): U =>
            fn(...args);


/**
 * Creates a function that applies the provided function to its arguments.
 * Inspired by Kotlin's run function but modified to match JavaScript behavior.
 *
 * @template T - The type of arguments the function accepts
 * @template R - The return type of the function
 * @param fn - The function to run
 * @returns A function that applies the provided function to its arguments
 * @example
 * const add = (a, b) => a + b;
 * const runAdd = run(add);
 * runAdd(2, 3); // returns 5
 */
export function run<T extends any[], R>(fn: (...param: T) => R) {
    return (...param: T) => {
        return fn(...param);
    };
}

/**
 * Creates a function that applies the provided function to its arguments and returns the original arguments.
 * Useful for performing side effects while preserving the original values.
 * Inspired by Kotlin's also function.
 *
 * @template T - The type of arguments
 * @param fn - The function to apply for side effects
 * @returns A function that applies the provided function and returns the original arguments
 * @example
 * const logValue = also(value => console.log(value));
 * const result = logValue(5); // logs 5 and returns 5
 */
export function also<T extends any[]>(fn: (...param: T) => unknown) {
    return (...param: T) => {
        fn(...param);
        return param;
    };
}

/**
 * No operation function.
 * @param _ - Any arguments, useless
 * @returns undefined
 * @example
 * const result = noop(); // returns undefined
 */
export function noop(..._: any[]) {
    return undefined;
}

/**
 * Flips the order of arguments in a function.
 *
 * @template T - The type of arguments the function accepts
 * @template R - The return type of the function
 * @param fn - The function to flip the arguments of
 * @returns A function that flips the order of its arguments
 * @example
 * const add = (a, b) => a + b;
 * const flippedAdd = flip(add);
 * flippedAdd(2, 3); // returns 5
 */
export function flip<T extends any[], R>(fn: (...args: T) => R) {
    return (...args: T) => fn(...(args.reverse() as T));
}

/**
 * Flips the order of arguments in a higher-order function.
 *
 * @template A - The type of the first argument
 * @template B - The type of the second argument
 * @template R - The return type of the function
 * @param fn - The function to flip the arguments of
 * @returns A function that flips the order of its arguments
 * @example
 * const add = (a, b) => a + b;
 * const flippedAdd = flipHof(add);
 * flippedAdd(2, 3); // returns 5
 */
export function flipHof<A, B, R>(fn: (a: A) => (b: B) => R) {
    return (b: B) => (a: A) => fn(a)(b);
}

/**
 * Creates a function that checks if all the provided functions return true for the given arguments.
 *
 * @param getter - The array of functions to check.
 * @returns A function that returns true if all the provided functions return true for the given arguments.
 * @example
 * const isEven = (n) => n % 2 === 0;
 * const isOdd = (n) => n % 2 !== 0;
 * const isPositive = (n) => n > 0;
 * const allTrue = all(isEven, isOdd, isPositive);
 */
export function all<T extends any[]>(...getter: ((...args: T) => boolean)[]) {
    return (...args: T) => getter.every(fn => fn(...args));
}

/**
 * Creates a function that checks if any of the provided functions return true for the given arguments.
 *
 * @param getter - The array of functions to check.
 * @returns A function that returns true if any of the provided functions return true for the given arguments.
 * @example
 * const isEven = (n) => n % 2 === 0;
 * const isOdd = (n) => n % 2 !== 0;
 * const isPositive = (n) => n > 0;
 * const anyTrue = any(isEven, isOdd, isPositive);
 */
export function any<T extends any[]>(...getter: ((...args: T) => boolean)[]) {
    return (...args: T) => getter.some(fn => fn(...args));
}

/**
 * Converts a curried binary function to a function that takes both arguments at once.
 *
 * @template A - The type of the first argument
 * @template B - The type of the second argument
 * @template R - The return type of the function
 * @param fn - The curried function to uncurry
 * @returns A function that takes both arguments at once
 * @example
 * const curriedAdd = (a: number) => (b: number) => a + b;
 * const add = uncurry2(curriedAdd);
 * add(2, 3); // returns 5
 */
export function uncurry<A, B, R>(fn: (a: A) => (b: B) => R) {
    return (a: A, b: B): R => fn(a)(b);
}

/**
 * If the value is a function, execute it and return the result. Otherwise, return the value.
 *
 * @param value - The value to execute or return.
 * @returns The result of the function execution or the original value.
 * @example
 * const result = getOrExec(() => 1 + 1); // returns 2
 * const result2 = getOrExec(2); // returns 2
 */
export function getOrExec<T>(value: T extends Function ? (() => T) : T): T {
    if (typeof value === 'function') {
        return value();
    }
    return value as T;
}

/**
 * check the value is null/undefined or not
 */
export function isNotNil<T>(value: T | null | undefined): value is T {
    return value !== null && value !== undefined;
}

/**
 * Negates the result of a function.
 *
 * @template T - The type of arguments the function accepts
 * @param fn - The function to negate
 * @returns A function that negates the result of the provided function
 * @example
 * const isEven = (n) => n % 2 === 0;
 * const isOdd = negate(isEven);
 * isOdd(3); // returns true
 */
export function negate<T extends any[]>(fn: (...args: T) => boolean) {
    return (...args: T) => !fn(...args);
}