import type { MonadLike, MonadTransDescriptor } from '../monad.js';

/**
 * ReaderT<R, M, A>: monad transformer that combines Reader (environment `R`) with an inner monad `M<A>`.
 * Represents: `R -> M<A>`
 * Satisfies MonadLike laws.
 */
export interface ReaderT<R, M, A> extends MonadLike<A> {
    run(r: R): M;
    map<B>(fn: (a: A) => B): ReaderT<R, M, B>;
    flatMap<B>(fn: (a: A) => ReaderT<R, M, B>): ReaderT<R, M, B>;
}

class ReaderTImpl<R, M, A> implements ReaderT<R, M, A> {
    constructor(readonly fn: (r: R) => M, readonly monad: MonadTransDescriptor<M>) {
        this.run = this.run.bind(this);
        this.map = this.map.bind(this);
        this.flatMap = this.flatMap.bind(this);
    }

    run(r: R): M {
        return this.fn(r);
    }

    map<B>(fn: (a: A) => B): ReaderT<R, M, B> {
        return new ReaderTImpl<R, M, B>(
            (r: R) => (this.monad.map?.(this.fn(r), fn) ?? this.monad.flatMap(this.fn(r), (a: A) => this.monad.of(fn(a)))),
            this.monad
        );
    }

    flatMap<B>(fn: (a: A) => ReaderT<R, M, B>): ReaderT<R, M, B> {
        return new ReaderTImpl<R, M, B>(
            (r: R) => this.monad.flatMap(this.run(r), (a: A) => fn(a).run(r)),
            this.monad
        );
    }
}

/**
 * Create a ReaderT transformer factory for a given inner monad.
 * Pass monad operations: `{ of, flatMap, map }`.
 */
export function ReaderT<M>(monad: Required<MonadTransDescriptor<M>>) {
    return {
        of: <R, A>(a: A): ReaderT<R, M, A> => new ReaderTImpl(() => monad.of(a), monad),
        from: <R, A>(fn: (r: R) => any): ReaderT<R, M, A> => new ReaderTImpl(fn, monad),
        lift: <R, A>(m: any): ReaderT<R, M, A> => new ReaderTImpl(() => m, monad),
    } as const;
}

export default ReaderT;
