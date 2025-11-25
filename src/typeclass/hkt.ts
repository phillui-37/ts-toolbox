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
import type { Result } from './result.js';
import type { Reader } from './reader.js';
import type { Writer } from './writer.js';
import type { MaybeT } from './transformer/MaybeT.js';
import type { ReaderT } from './transformer/ReaderT.js';
import type { ResultT } from './transformer/ResultT.js';
import type { WriterT } from './transformer/WriterT.js';

export interface URItoKind<A> {
    // Identity / simple synchronous monad used in tests: maps to `A`.
    Id: A;
    Identity: A;
    // Promise-based monad
    Promise: Promise<A>;
    // Array monad
    Array: A[];
    // Maybe container
    Maybe: Maybe<A>;
    // Result container (error handling)
    Result: Result<A, any>;
    // Reader monad (environment/dependency injection)
    Reader: Reader<any, A>;
    // Writer monad (log accumulation)
    Writer: Writer<A>;
    // Monad transformers
    MaybeT: MaybeT<any, A>;
    ReaderT: ReaderT<any, any, A>;
    ResultT: ResultT<any, any, A>;
    WriterT: WriterT<any, any, A>;
}

export type URIS = keyof URItoKind<any>;

export type Kind<URI extends URIS, A> = URItoKind<A>[URI];

