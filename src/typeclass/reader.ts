import type { MonadLike } from './monad.js';

/**
 * Reader monad: represents a computation that reads from a shared environment `R`.
 * Satisfies MonadLike laws.
 */
export interface Reader<R, A> extends MonadLike<A> {
    run(r: R): A;
    map<B>(fn: (a: A) => B): Reader<R, B>;
    flatMap<B>(fn: (a: A) => Reader<R, B>): Reader<R, B>;
}

class ReaderImpl<R, A> implements Reader<R, A> {
    constructor(readonly fn: (r: R) => A) {
        this.run = this.run.bind(this);
        this.map = this.map.bind(this);
        this.flatMap = this.flatMap.bind(this);
    }

    run(r: R): A {
        return this.fn(r);
    }

    map<B>(fn: (a: A) => B): Reader<R, B> {
        return new ReaderImpl((r: R) => fn(this.run(r)));
    }

    flatMap<B>(fn: (a: A) => Reader<R, B>): Reader<R, B> {
        return new ReaderImpl((r: R) => fn(this.run(r)).run(r));
    }
}

export namespace Reader {
    export const of = <R, A>(a: A): Reader<R, A> => new ReaderImpl(() => a);

    export const ask = <R>(): Reader<R, R> => new ReaderImpl((r: R) => r);

    export const from = <R, A>(fn: (r: R) => A): Reader<R, A> => new ReaderImpl(fn);
}

export default Reader;
