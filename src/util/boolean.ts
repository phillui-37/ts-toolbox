

/**
 * Conditionally selects and executes one of two functions based on a predicate.
 *
 * @param arg - The argument object.
 * @param arg.pred - The predicate to determine which function to execute. Can be a boolean or a function returning a boolean.
 * @param arg.t - The function to execute if the predicate is true.
 * @param arg.f - The function to execute if the predicate is false.
 * @returns The result of either the `ok` or `no` function, depending on the predicate.
 * @example
 * select({
 *   pred: () => 1 > 0,
 *   t: () => 'yes',
 *   f: () => 'no'
 * }); // returns 'yes'
 */
export function select<A, B>(arg: { pred: boolean | (() => boolean), t: () => A, f: () => B }): A | B;
export function select<A, _B>(arg: { pred: boolean | (() => boolean), t: () => A }): A | undefined;
export function select<_A, B>(arg: { pred: boolean | (() => boolean), f: () => B }): B | undefined;
export function select<_A, _B>(arg: { pred: boolean | (() => boolean) }): undefined;

export function select<A, B>(arg: { pred: boolean | (() => boolean), t?: () => A, f?: () => B }): A | B | undefined {
    const cond = typeof arg.pred === 'function' ? arg.pred() : arg.pred;
    if (cond) {
        return arg.t?.();
    }
    return arg.f?.();
}

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
export function falsy(args: any) {
    return !args;
}

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
export function allFalsy(...args: any[]) {
    return args.every(arg => !arg);
}

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
export function anyFalsy(...args: any[]) {
    return args.some(arg => !arg);
}

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
export function truthy(args: any) {
    return !!args;
}

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
export function allTruthy(...args: any[]) {
    return args.every(arg => !!arg);
}

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
export function anyTruthy(...args: any[]) {
    return args.some(arg => !!arg);
}