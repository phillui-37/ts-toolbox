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
export function flattenBy<
    K extends string | symbol | number,
    T extends Record<K, any> | any[],
    Item extends T[keyof T],
    R extends T extends any[] ? Item[] : { [K in keyof T]: Item },
>(extractor: (item: Item) => R): (obj: T) => R {
    return function (obj: T): R {
        if (Array.isArray(obj)) {
            return obj.reduce((acc, item) => [...acc, extractor(item)], [] as unknown as R);
        } else {
            return Object.entries(obj).reduce((acc, [key, value]) => ({ ...acc, [key]: extractor(value) }), {} as R);
        }
    };
}

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
export const prop =
    <T>(path: string) =>
        (obj: T): any => {
            return path.split('.').reduce((acc: any, key) => acc?.[key], obj);
        };