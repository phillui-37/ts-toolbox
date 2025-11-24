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
export declare const constant: <T>(value: T) => (..._: any[]) => T;
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
export declare const id: <T>(value: T) => T;
/**
 * Creates a function that returns the value of a specified property path from an object.
 * Supports nested property access using dot notation.
 *
 * @template T - The type of the object
 * @param path - The property path to access (e.g., 'a.b.c.d')
 * @returns A function that extracts the specified property from an object
 * @example
 * const getNestedValue = prop('user.address.city');
 * getNestedValue({ user: { address: { city: 'New York' } } }); // returns 'New York'
 * const getName = prop('name');
 * getName({ name: 'John', age: 30 }); // returns 'John'
 */
export declare const prop: <T>(path: string) => (obj: T) => any;
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
export declare const pipe: <T extends any[], U, R>(fn1: (...args: T) => U, fn2: (arg: U) => R) => (...args: T) => R;
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
export declare const compose: <T extends any[], U, R>(fn2: (arg: U) => R, fn1: (...args: T) => U) => (...args: T) => R;
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
export declare const apply: <T extends any[], U>(fn: (...args: T) => U) => (...args: T) => U;
/**
 * Creates a function that checks if a value is equal to another value.
 *
 * @param a - The value to compare against
 * @returns A function that returns true if its argument equals the provided value
 * @example
 * const isZero = eq(0);
 * isZero(0); // returns true
 * isZero(1); // returns false
 */
export declare const eq: (a: any) => (b: any) => boolean;
/**
 * Creates a function that checks if a value is not equal to another value.
 *
 * @param a - The value to compare against
 * @returns A function that returns true if its argument does not equal the provided value
 * @example
 * const isNotZero = ne(0);
 * isNotZero(0); // returns false
 * isNotZero(1); // returns true
 */
export declare const ne: (a: any) => (b: any) => boolean;
/**
 * Creates a function that flattens an object or array by applying an extractor function to each item.
 *
 * @template K - The type of keys in the object or indices in the array
 * @template T - The type of the object or array to flatten
 * @template Item - The type of items in the object or array
 * @template R - The return type after flattening
 * @param extractor - Function to extract values from each item
 * @returns A function that flattens the provided object or array
 * @example
 * const getNames = flattenBy(user => user.name);
 * getNames([{name: 'John'}, {name: 'Jane'}]); // returns ['John', 'Jane']
 * getNames({user1: {name: 'John'}, user2: {name: 'Jane'}}); // returns {user1: 'John', user2: 'Jane'}
 */
export declare function flattenBy<K extends string | symbol | number, T extends Record<K, any> | any[], Item extends T[keyof T], R extends T extends any[] ? Item[] : {
    [K in keyof T]: Item;
}>(extractor: (item: Item) => R): (obj: T) => R;
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
export declare function run<T extends any[], R>(fn: (...param: T) => R): (...param: T) => R;
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
export declare function also<T extends any[]>(fn: (...param: T) => unknown): (...param: T) => T;
/**
 * No operation function.
 * @param _ - Any arguments, useless
 * @returns undefined
 * @example
 * const result = noop(); // returns undefined
 */
export declare function noop(..._: any[]): undefined;
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
export declare function flip<T extends any[], R>(fn: (...args: T) => R): (...args: T) => R;
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
export declare function flipHof<A, B, R>(fn: (a: A) => (b: B) => R): (b: B) => (a: A) => R;
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
export declare function negate<T extends any[]>(fn: (...args: T) => boolean): (...args: T) => boolean;
/**
 * Creates a function that adds a number to its argument.
 *
 * @param a - The number to add
 * @returns A function that adds the provided number to its argument
 * @example
 * const add5 = add(5);
 * add5(10); // returns 15
 */
export declare function add(a: number): (b: number) => number;
/**
 * Conditionally selects and executes one of two functions based on a predicate.
 *
 * @param arg - The argument object.
 * @param arg.pred - The predicate to determine which function to execute. Can be a boolean or a function returning a boolean.
 * @param arg.ok - The function to execute if the predicate is true.
 * @param arg.no - The function to execute if the predicate is false.
 * @returns The result of either the `ok` or `no` function, depending on the predicate.
 * @example
 * select({
 *   pred: () => 1 > 0,
 *   ok: () => 'yes',
 *   no: () => 'no'
 * }); // returns 'yes'
 */
export declare function select<A, B>(arg: {
    pred: boolean | (() => boolean);
    ok: () => A;
    no: () => B;
}): A | B;
export declare function select<A, _B>(arg: {
    pred: boolean | (() => boolean);
    ok: () => A;
}): A | undefined;
export declare function select<_A, B>(arg: {
    pred: boolean | (() => boolean);
    no: () => B;
}): B | undefined;
export declare function select<_A, _B>(arg: {
    pred: boolean | (() => boolean);
}): undefined;
/**
 * Creates a function that negates the result of a function.
 *
 * @param args - The argument to negate.
 * @returns A function that negates the result of the provided function.
 * @example
 * const isEven = (n) => n % 2 === 0;
 * const isOdd = not(isEven);
 * isOdd(3); // returns true
 */
export declare function falsy(args: any): boolean;
/**
 * Creates a function that checks if all the provided arguments are falsy.
 *
 * @param args - The arguments to check.
 * @returns A function that returns true if all the arguments are falsy.
 * @example
 * const isEven = (n) => n % 2 === 0;
 * const isOdd = allFalsy(isEven);
 * isOdd(3); // returns true
 */
export declare function allFalsy(...args: any[]): boolean;
/**
 * Creates a function that checks if any of the provided arguments are falsy.
 *
 * @param args - The arguments to check.
 * @returns A function that returns true if any of the arguments are falsy.
 * @example
 * const isEven = (n) => n % 2 === 0;
 * const isOdd = anyFalsy(isEven);
 * isOdd(3); // returns true
 */
export declare function anyFalsy(...args: any[]): boolean;
/**
 * Creates a function that returns the truthiness of a value.
 *
 * @param args - The argument to check.
 * @returns A function that returns the truthiness of the provided function.
 * @example
 * const isEven = (n) => n % 2 === 0;
 * const isOdd = truthy(isEven);
 * isOdd(3); // returns true
 */
export declare function truthy(args: any): boolean;
/**
 * Creates a function that checks if all the provided arguments are truthy.
 *
 * @param args - The arguments to check.
 * @returns A function that returns true if all the arguments are truthy.
 * @example
 * const isEven = (n) => n % 2 === 0;
 * const isOdd = allTruthy(isEven);
 * isOdd(3); // returns true
 */
export declare function allTruthy(...args: any[]): boolean;
/**
 * Creates a function that checks if any of the provided arguments are truthy.
 *
 * @param args - The arguments to check.
 * @returns A function that returns true if any of the arguments are truthy.
 * @example
 * const isEven = (n) => n % 2 === 0;
 * const isOdd = anyTruthy(isEven);
 * isOdd(3); // returns true
 */
export declare function anyTruthy(...args: any[]): boolean;
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
export declare function all<T extends any[]>(...getter: ((...args: T) => boolean)[]): (...args: T) => boolean;
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
export declare function any<T extends any[]>(...getter: ((...args: T) => boolean)[]): (...args: T) => boolean;
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
export declare function uncurry<A, B, R>(fn: (a: A) => (b: B) => R): (a: A, b: B) => R;
/**
 * Creates a function that limits a number to a specified range.
 *
 * @param min - The minimum value of the range.
 * @param max - The maximum value of the range.
 * @param inclusive - Whether to include the minimum and maximum values in the range.
 * @returns A function that limits the provided number to the specified range.
 * @example
 * const bounded = bounded(0, 100);
 * bounded(50); // returns 50
 * bounded(150); // returns 100
 */
export declare function bounded(min: number, max: number, inclusive?: {
    min: boolean;
    max: boolean;
}): (value: number) => number;
/**
 * If the value is a function, execute it and return the result. Otherwise, return the value.
 *
 * @param value - The value to execute or return.
 * @returns The result of the function execution or the original value.
 * @example
 * const result = getOrExec(() => 1 + 1); // returns 2
 * const result2 = getOrExec(2); // returns 2
 */
export declare function getOrExec<T>(value: T extends Function ? (() => T) : T): any;
//# sourceMappingURL=fnUtil.d.ts.map