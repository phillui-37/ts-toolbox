/**
 * Lightweight HKT helper to emulate higher-kinded types in TypeScript.
 *
 * We use the familiar pattern: `URItoKind<A>` maps a type-level `URI` to
 * a concrete type constructor applied to `A`. `Kind<URI, A>` indexes into
 * that mapping.
 *
 * Concrete monads in this repo should add entries to `URItoKind<A>`.
 */
import type { Maybe } from './maybe.js';

export interface URItoKind<A> {
    // Identity / simple synchronous monad used in tests: maps to `A`.
    Id: A;
    // Promise-based monad
    Promise: Promise<A>;
    // Array monad
    Array: A[];
    // Maybe container
    Maybe: Maybe<A>;
}

export type URIS = keyof URItoKind<any>;

export type Kind<URI extends URIS, A> = URItoKind<A>[URI];

