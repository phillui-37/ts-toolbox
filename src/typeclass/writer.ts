import type { MonadLike } from './monad.js';

/**
 * Writer monad with a `string` log. The log is concatenated when chaining.
 * Satisfies MonadLike laws with string monoid.
 */
export interface Writer<T> extends MonadLike<T> {
    readonly value: T;
    readonly log: string;
    map<U>(fn: (v: T) => U): Writer<U>;
    flatMap<U>(fn: (v: T) => Writer<U>): Writer<U>;
}

class WriterImpl<T> implements Writer<T> {
    constructor(readonly value: T, readonly log: string) {
        this.map = this.map.bind(this);
        this.flatMap = this.flatMap.bind(this);
    }

    map<U>(fn: (v: T) => U): Writer<U> {
        return new WriterImpl(fn(this.value), this.log);
    }

    flatMap<U>(fn: (v: T) => Writer<U>): Writer<U> {
        const res = fn(this.value);
        return new WriterImpl(res.value, this.log + res.log);
    }
}

export namespace Writer {
    export const of = <T>(value: T, log = ''): Writer<T> => new WriterImpl(value, log);

    export const tell = (msg: string): Writer<void> => new WriterImpl(undefined, msg);
}

export default Writer;
