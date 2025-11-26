import { match, P } from 'ts-pattern';
import type { MonadLike } from './monad.js';
import { id } from '@/util/fnUtil.js';

/**
 * Writer monad with a `string` log. The log is concatenated when chaining.
 * Satisfies MonadLike laws with string monoid.
 */
export interface Writer<T> extends MonadLike<T> {
    readonly value: T;
    readonly logs: string[];
    map<U>(fn: (v: T) => U): Writer<U>;
    flatMap<U>(fn: (v: T) => Writer<U>): Writer<U>;
}

class WriterImpl<T> implements Writer<T> {
    readonly logs: string[];
    constructor(readonly value: T, _logs: string[] | string) {
        this.map = this.map.bind(this);
        this.flatMap = this.flatMap.bind(this);
        this.logs = match(_logs)
            .with(P.string, (l) => l ? [l] : [])
            .otherwise(id);
    }

    map<U>(fn: (v: T) => U): Writer<U> {
        return new WriterImpl(fn(this.value), this.logs);
    }

    flatMap<U>(fn: (v: T) => Writer<U>): Writer<U> {
        const res = fn(this.value);
        return new WriterImpl(res.value, [...this.logs, ...res.logs]);
    }
}

export namespace Writer {
    export const of = <T>(value: T, log = ''): Writer<T> => new WriterImpl(value, log);

    export const tell = (msg: string): Writer<void> => new WriterImpl(undefined, msg);
}

export default Writer;
