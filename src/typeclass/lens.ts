/**
 * A Lens focuses on a part `A` inside a structure `S` and allows getting and setting that part.
 *
 * Example: a lens for a person's name can get the `name` and set a new `name` producing
 * a new person object.
 */
export interface Lens<S, A> {
    get(s: S): A;
    set(a: A, s: S): S;
}

export namespace Lens {
    /** Create a lens from explicit `get` and `set` functions. */
    export const of = <S, A>({ get, set }: { get: (s: S) => A; set: (a: A, s: S) => S }): Lens<S, A> => ({ get, set });

    /** Compose two lenses to focus deeper: first: S -> A, second: A -> B => result: S -> B */
    export const compose = <S, A, B>(lens1: Lens<S, A>, lens2: Lens<A, B>): Lens<S, B> =>
        of({
            get: (s: S) => lens2.get(lens1.get(s)),
            set: (b: B, s: S) => lens1.set(lens2.set(b, lens1.get(s)), s)
        });
}