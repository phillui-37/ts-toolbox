import type { MonadLike, Extractable, Alternative, Effectful } from './monad.js';

/**
 * Result Monad (ExceptT-like)
 * Represents either a success `Ok<T>` or a failure `Err<E>`.
 * Satisfies MonadLike, Extractable, Alternative, and Effectful laws.
 */
export interface Result<T, E> extends MonadLike<T>, Extractable<T>, Alternative<T>, Effectful<T> {
    readonly value?: T;
    readonly error?: E;
    map<U>(fn: (value: T) => U): Result<U, E>;
    flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E>;
    mapError<F>(fn: (error: E) => F): Result<T, F>;
    toString(): string;
    consumeErr(fn: (_: E) => void): Result<T, E>;
}

class Ok<T, E> implements Result<T, E> {
    constructor(readonly value: T) {
        this.map = this.map.bind(this);
        this.flatMap = this.flatMap.bind(this);
        this.mapError = this.mapError.bind(this);
        this.getOr = this.getOr.bind(this);
        this.getOrElse = this.getOrElse.bind(this);
        this.or = this.or.bind(this);
        this.and = this.and.bind(this);
        this.toString = this.toString.bind(this);
        this.consume = this.consume.bind(this);
        this.consumeErr = this.consumeErr.bind(this);
    }

    map<U>(fn: (value: T) => U): Result<U, E> {
        return new Ok(fn(this.value));
    }

    flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
        return fn(this.value);
    }

    mapError<F>(_: (error: E) => F): Result<T, F> {
        return new Ok(this.value);
    }

    getOr(_: T): T {
        return this.value;
    }

    getOrElse(_: () => T): T {
        return this.value;
    }

    or(_: Result<T, E>): Result<T, E> {
        return this;
    }

    and(other: Result<T, E>): Result<T, E> {
        return other;
    }

    toString(): string {
        return `Ok(${JSON.stringify(this.value)})`;
    }

    consume(fn: (_: T) => void) {
        fn(this.value);
        return this;
    }

    consumeErr(_: (_: E) => void): Result<T, E> {
        return this;
    }
}

class Err<T, E> implements Result<T, E> {
    constructor(readonly error: E) {
        this.map = this.map.bind(this);
        this.flatMap = this.flatMap.bind(this);
        this.mapError = this.mapError.bind(this);
        this.getOr = this.getOr.bind(this);
        this.getOrElse = this.getOrElse.bind(this);
        this.or = this.or.bind(this);
        this.and = this.and.bind(this);
        this.toString = this.toString.bind(this);
        this.consume = this.consume.bind(this);
        this.consumeErr = this.consumeErr.bind(this);
    }

    map<U>(_: (value: T) => U): Result<U, E> {
        return new Err(this.error);
    }

    flatMap<U>(_: (value: T) => Result<U, E>): Result<U, E> {
        return new Err(this.error);
    }

    mapError<F>(fn: (error: E) => F): Result<T, F> {
        return new Err(fn(this.error));
    }

    getOr(defaultValue: T): T {
        return defaultValue;
    }

    getOrElse(fn: () => T): T {
        return fn();
    }

    or(other: Result<T, E>): Result<T, E> {
        return other;
    }

    and(_: Result<T, E>): Result<T, E> {
        return this;
    }

    toString(): string {
        return `Err(${JSON.stringify(this.error)})`;
    }

    consume(_: (_: T) => void) {
        return this;
    }

    consumeErr(fn: (_: E) => void): Result<T, E> {
        fn(this.error);
        return this
    }
}

export namespace Result {
    export function ok<T, E>(value: T): Result<T, E> {
        return new Ok(value);
    }

    export function err<T, E>(error: E): Result<T, E> {
        return new Err(error);
    }

    export function isOk<T, E>(result: Result<T, E>): result is Ok<T, E> {
        return result instanceof Ok;
    }

    export function isErr<T, E>(result: Result<T, E>): result is Err<T, E> {
        return result instanceof Err;
    }

    export function fromTry<T, E>(fn: () => T, errorHandler: (error: unknown) => E): Result<T, E> {
        try {
            return ok(fn());
        } catch (error) {
            return err(errorHandler(error));
        }
    }
}
