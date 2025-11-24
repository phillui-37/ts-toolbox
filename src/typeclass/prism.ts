import { isNotNil } from "@/util/fnUtil.js";

/**
 * A Prism focuses on a part that may not exist inside a structure. `get` may return `null|undefined`.
 */
export interface Prism<S, A> {
    get(s: S): A | null | undefined;
    set(a: A, s: S): S;
}

export namespace Prism {
    /** Construct a Prism from `get` and `set`. */
    export const of = <S, A>({
        get,
        set
    }: {
        get: (s: S) => A | null | undefined;
        set: (a: A, s: S) => S;
    }): Prism<S, A> => ({
        get,
        set
    });

    /** Compose two prisms. If the first `get` yields nil, composition yields `null`. */
    export const compose = <S, A, B>(
        first: Prism<S, A>,
        second: Prism<A, B>
    ): Prism<S, B> => {
        const get = (s: S): B | null | undefined => {
            const a = first.get(s);
            return isNotNil(a) ? second.get(a) : null;
        };
        const set = (b: B, s: S): S => {
            const a = first.get(s);
            return isNotNil(a) ? first.set(second.set(b, a), s) : s;
        };
        return of({ get, set });
    };

    /** Return the focused value or a provided default when missing. */
    export const getOrElse = <S, A>(prism: Prism<S, A>, s: S, defaultValue: A): A => {
        const ret = prism.get(s);
        return isNotNil(ret) ? ret : defaultValue;
    };
};