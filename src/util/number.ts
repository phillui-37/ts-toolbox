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
export function bounded(min: number, max: number, inclusive: { min: boolean, max: boolean } = { min: true, max: true }) {
    const minCpFn = inclusive.min ? (value: number) => value < min : (value: number) => value <= min;
    const maxCpFn = inclusive.max ? (value: number) => value > max : (value: number) => value >= max;
    return (value: number) => {
        if (minCpFn(value)) {
            return min;
        }
        if (maxCpFn(value)) {
            return max;
        }
        return value;
    }
}