import type { MonadLike, Extractable, Alternative } from './monad.js';

/**
 * Maybe Monad
 * Represents an optional value: either `Some(value)` or `None`.
 * Satisfies MonadLike, Extractable, and Alternative laws.
 */
export interface Maybe<T> extends MonadLike<T>, Extractable<T>, Alternative<T> {
    readonly value?: T;
    map<U>(fn: (value: T) => U): Maybe<U>;
    flatMap<U>(fn: (value: T) => Maybe<U>): Maybe<U>;
    toString(): string;
}

class Some<T> implements Maybe<T> {
    constructor(readonly value: T) {
        this.map = this.map.bind(this);
        this.flatMap = this.flatMap.bind(this);
        this.getOr = this.getOr.bind(this);
        this.getOrElse = this.getOrElse.bind(this);
        this.or = this.or.bind(this);
        this.and = this.and.bind(this);
        this.toString = this.toString.bind(this);
    }

    map<U>(fn: (value: T) => U): Maybe<U> {
        return new Some(fn(this.value));
    }

    flatMap<U>(fn: (value: T) => Maybe<U>): Maybe<U> {
        return fn(this.value);
    }

    getOr(_: T): T {
        return this.value;
    }

    getOrElse(_: () => T): T {
        return this.value;
    }

    or(_: Maybe<T>): Maybe<T> {
        return this;
    }

    and(other: Maybe<T>): Maybe<T> {
        return other;
    }

    toString(): string {
        return `Some(${JSON.stringify(this.value)})`;
    }
}

class None<T> implements Maybe<T> {
    private constructor() {
        this.map = this.map.bind(this);
        this.flatMap = this.flatMap.bind(this);
        this.getOr = this.getOr.bind(this);
        this.getOrElse = this.getOrElse.bind(this);
        this.or = this.or.bind(this);
        this.and = this.and.bind(this);
        this.toString = this.toString.bind(this);
    }

    static readonly instance = new None<never>();

    map<U>(_: (value: T) => U): Maybe<U> {
        return None.instance as Maybe<U>;
    }

    flatMap<U>(_: (value: T) => Maybe<U>): Maybe<U> {
        return None.instance as Maybe<U>;
    }

    getOr(defaultValue: T): T {
        return defaultValue;
    }

    getOrElse(fn: () => T): T {
        return fn();
    }

    or(other: Maybe<T>): Maybe<T> {
        return other;
    }

    and(_: Maybe<T>): Maybe<T> {
        return this;
    }

    toString(): string {
        return "None";
    }
}

export namespace Maybe {
    export function some<T>(value: T): Maybe<T> {
        return new Some(value);
    }

    export function none<T>(): Maybe<T> {
        return None.instance as Maybe<T>;
    }

    export function isSome<T>(maybe: Maybe<T>): maybe is Some<T> {
        return maybe instanceof Some;
    }

    export function isNone<T>(maybe: Maybe<T>): maybe is None<T> {
        return maybe instanceof None;
    }

    export function isMaybe<T>(obj: any): obj is Maybe<T> {
        return obj instanceof Some || obj instanceof None;
    }

    export function fromNullable<T>(value: T | null | undefined): Maybe<T> {
        return value == null ? none() : some(value);
    }
}
