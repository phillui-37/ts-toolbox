import { match, P } from "ts-pattern";

// MARK: Eq

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
export const eq = (a: any) => (b: any) => a === b;

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
export const ne = (a: any) => (b: any) => a !== b;

// MARK: Ord
/**
 * Creates a function that checks if a value is less than another value.
 *
 * @param a - The value to compare against, which is on bigger size
 * @returns A function that returns true if its argument less than the provided value
 * @example
 * const lessThanZero = lt(0);
 * lessThanZero(0); // returns false
 * lessThanZero(-1); // returns true
 */
export function lt(a: string): (b: string) => boolean
export function lt(a: number | bigint): (b: number | bigint) => boolean;
export function lt<T extends string | number | bigint>(a: T) {
    return (b: T) => a > b;
}

/**
 * Creates a function that checks if a value is less than or equal another value.
 *
 * @param a - The value to compare against, which is on bigger size
 * @returns A function that returns true if its argument less than or equal the provided value
 * @example
 * const lessThanOrEqualZero = lt(0);
 * lessThanOrEqualZero(1); // returns false
 * lessThanOrEqualZero(0); // returns true
 * lessThanOrEqualZero(-1); // returns true
 */
export function le(a: string): (b: string) => boolean
export function le(a: number | bigint): (b: number | bigint) => boolean;
export function le<T extends string | number | bigint>(a: T) {
    return (b: T) => a >= b;
}

/**
 * Creates a function that checks if a value is greater than another value.
 *
 * @param a - The value to compare against, which is on bigger size
 * @returns A function that returns true if its argument greater than the provided value
 * @example
 * const greaterThanZero = lt(0);
 * greaterThanZero(0); // returns false
 * greaterThanZero(1); // returns true
 */
export function gt(a: string): (b: string) => boolean
export function gt(a: number | bigint): (b: number | bigint) => boolean;
export function gt<T extends string | number | bigint>(a: T) {
    return (b: T) => a < b;
}

/**
 * Creates a function that checks if a value is greater than or equal another value.
 *
 * @param a - The value to compare against, which is on bigger size
 * @returns A function that returns true if its argument greater than or equal the provided value
 * @example
 * const greaterThanOrEqualZero = lt(0);
 * greaterThanOrEqualZero(-1); // returns false
 * greaterThanOrEqualZero(0); // returns true
 * greaterThanOrEqualZero(1); // returns true
 */
export function ge(a: string): (b: string) => boolean
export function ge(a: number | bigint): (b: number | bigint) => boolean;
export function ge<T extends string | number | bigint>(a: T) {
    return (b: T) => a <= b;
}

// MARK: arithmetic

/**
 * Creates a function that adds a number to its argument.
 *
 * @param a - The number to add
 * @returns A function that adds the provided number to its argument
 * @example
 * const add5 = add(5);
 * add5(10); // returns 15
 */
// @ts-ignore
export function add(a: number): (b: number) => number;
export function add(a: bigint): (b: bigint | number) => bigint;
export function add(a: number | bigint): (b: bigint) => bigint;
export function add(a: number | bigint) {
    return (b: number | bigint) => match([a, b])
        .with([P.bigint, P.bigint], ([a, b]) => a + b)
        .with([P.number, P.number], ([a, b]) => a + b)
        .otherwise(([a, b]) => BigInt(a) + BigInt(b));
}

/**
 * Creates a function that subtract a number to its argument
 * 
 * @param a The number to be subtracted
 * @returns A function that the number subtracted from as argument
 * @example
 * const sub5 = sub(5);
 * sub5(10); // returns 5
 */
// @ts-ignore
export function sub(a: number): (b: number) => number;
export function sub(a: bigint): (b: bigint | number) => bigint;
export function sub(a: number | bigint): (b: bigint) => bigint;
export function sub(a: number | bigint) {
    return (b: number | bigint) => match([a, b])
        .with([P.bigint, P.bigint], ([a, b]) => b - a)
        .with([P.number, P.number], ([a, b]) => b - a)
        .otherwise(([a, b]) => BigInt(b) - BigInt(a));
}

/**
 * Creates a function that multiple a number to its argument
 * 
 * @param a The number to be multiplied
 * @returns A function that multiple the number as argument
 * @example
 * const mul5 = mul(5);
 * mul5(10); // returns 50
 */
// @ts-ignore
export function mul(a: number): (b: number) => number;
export function mul(a: bigint): (b: bigint | number) => bigint;
export function mul(a: number | bigint): (b: bigint) => bigint;
export function mul(a: number | bigint) {
    return (b: number | bigint) => match([a, b])
        .with([P.bigint, P.bigint], ([a, b]) => a * b)
        .with([P.number, P.number], ([a, b]) => a * b)
        .otherwise(([a, b]) => BigInt(a) * BigInt(b));
}

/**
 * Creates a function that divide a number from its argument
 * 
 * @param a denominator
 * @returns A function accepts numerator as argument
 * @example
 * const div5 = div(5);
 * div5(10); // returns 2
 */
// @ts-ignore
export function div(a: number): (b: number) => number;
export function div(a: bigint): (b: bigint | number) => bigint;
export function div(a: number | bigint): (b: bigint) => bigint;
export function div(a: number | bigint) {
    return (b: number | bigint) => match([a, b])
        .with([P.bigint, P.bigint], ([a, b]) => b / a)
        .with([P.number, P.number], ([a, b]) => b / a)
        .otherwise(([a, b]) => BigInt(b) / BigInt(a));
}

/**
 * Creates a function that divide a number and returns floor int from its argument
 * 
 * @param a denominator
 * @returns A function accepts numerator as argument
 * @example
 * const floorDiv5 = floorDiv(5);
 * floorDiv5(11); // returns 2
 */
export function floorDiv(a: number) {
    return (b: number) => Math.floor(b / a);
}

/**
 * Creates a function that divide a number and returns ceil int from its argument
 * 
 * @param a denominator
 * @returns A function accepts numerator as argument
 * @example
 * const ceilDiv5 = ceilDiv(5);
 * ceilDiv5(11); // returns 3
 */
export function ceilDiv(a: number) {
    return (b: number) => Math.ceil(b / a);
}

/**
 * Creates a function that power a number from its argument
 * 
 * @param a power/exponent
 * @returns A function accepts base as argument
 * @example
 * const pow2 = pow(2);
 * pow2(5); // returns 25
 */
// @ts-ignore
export function pow(a: number): (b: number) => number;
export function pow(a: bigint): (b: bigint | number) => bigint;
export function pow(a: number | bigint): (b: bigint) => bigint;
export function pow(a: number|bigint) {
    return (b: number|bigint) => match([a, b])
        .with([P.bigint, P.bigint], ([a, b]) => b ** a)
        .with([P.number, P.number], ([a, b]) => Math.pow(b, a))
        .otherwise(([a, b]) => BigInt(b) ** BigInt(a));
}

// MARK: type

/**
 * Creates a function that check class instance
 * 
 * @param cls class to be checked
 * @returns A function accepts instance as argument
 * @example
 * const isLogger = instance(Logger);
 * const logger = new Logger();
 * isLogger(logger); // returns true
 */
export function instance(cls: any) {
    return (ins: any) => ins instanceof cls;
}

/**
 * Creates a function that check typeof
 * 
 * @param t expected type
 * @returns A function accepts instance as argument
 * @example
 * const isStr = isType('string');
 * isStr('foo'); // returns true
 * isStr(1); // returns false
 */
export function isType(t: 'bigint' | 'number' | 'boolean' | 'string' | 'object' | 'undefined' | 'symbol' | 'function') {
    return (ins: any) => typeof ins === t;
}

// MARK: bit
/**
 * Creates a function that shift right by digits to its argument
 * 
 * @param a digits to shift right
 * @returns A function that accept number to be shifted right as arg
 * @example
 * const shr2 = shr(2);
 * shr2(16); // returns 4
 */
export function shr(a: number) {
    return (b: number) => b >> a;
}

/**
 * Creates a function that shift left by digits to its argument
 * 
 * @param a digits to shift left
 * @returns A function that accept number to be shifted left as arg
 * @example
 * const shl2 = shl(2);
 * shl2(16); // returns 64
 */
export function shl(a: number) {
    return (b: number) => b << a;
}