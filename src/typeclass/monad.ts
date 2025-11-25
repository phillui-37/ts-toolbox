/**
 * Core monad interface: the minimal contract all monads must satisfy.
 * Implements functor (map) and monad (flatMap) laws.
 */
export interface MonadLike<A> {
    /**
     * Map over the value(s) inside the monad.
     * Also known as `fmap` in Haskell.
     */
    map<B>(fn: (a: A) => B): MonadLike<B>;

    /**
     * Bind: compose monadic computations.
     * Also known as `>>=` in Haskell or `flatMap` / `chain` in JS.
     */
    flatMap<B>(fn: (a: A) => MonadLike<B>): MonadLike<B>;
}

/**
 * Functor interface: subset of monad with only map.
 */
export interface Functor<A> {
    map<B>(fn: (a: A) => B): Functor<B>;
}

/**
 * Applicative interface: functor + apply (for parallel composition).
 */
export interface Applicative<A> extends Functor<A> {
    ap<B>(fab: Applicative<(a: A) => B>): Applicative<B>;
}

/**
 * Optional/Maybe-like interface for extracting values with defaults.
 */
export interface Extractable<A> {
    getOr(defaultValue: A): A;
    getOrElse(fn: () => A): A;
}

/**
 * Alternative interface: choice/or combinator for monads.
 */
export interface Alternative<A> {
    or(other: Alternative<A>): Alternative<A>;
    and(other: Alternative<A>): Alternative<A>;
}

/**
 * Side-effect interface: consume/observe without breaking the monad chain.
 */
export interface Effectful<A> {
    consume(fn: (a: A) => void): Effectful<A>;
}

/**
 * Common monoid interface: a type with an identity element and an associative operation.
 */
export interface Monoid<A> {
    empty: A;
    concat(a: A, b: A): A;
}

import type { Kind, URIS } from './hkt.js';

/**
 * Monad transformer descriptor: specifies how to lift an inner monad (identified by `URI`)
 * into transformer operations typed as `Kind<URI, A>`.
 */
export interface MonadTransDescriptor<URI extends URIS> {
    of: <A>(a: A) => Kind<URI, A>;
    flatMap: <A, B>(m: Kind<URI, A>, fn: (a: A) => Kind<URI, B>) => Kind<URI, B>;
    map?: <A, B>(m: Kind<URI, A>, fn: (a: A) => B) => Kind<URI, B>;
}
