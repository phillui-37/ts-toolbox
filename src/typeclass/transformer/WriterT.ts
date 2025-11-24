import type { MonadLike, MonadTransDescriptor, Monoid } from '../monad.js';

/**
 * WriterT<M, W, A>: monad transformer that combines Writer (log `W`) with an inner monad `M<[A, W]>`.
 * Represents: `M<[A, W]>` where W is a monoid.
 * Satisfies MonadLike laws.
 */
export interface WriterT<M, W, A> extends MonadLike<A> {
    run(): M;
    map<B>(fn: (a: A) => B): WriterT<M, W, B>;
    flatMap<B>(fn: (a: A) => WriterT<M, W, B>): WriterT<M, W, B>;
}

class WriterTImpl<M, W, A> implements WriterT<M, W, A> {
    constructor(readonly m: M, readonly monad: MonadTransDescriptor<M>, readonly monoid: Monoid<W>) {
        this.run = this.run.bind(this);
        this.map = this.map.bind(this);
        this.flatMap = this.flatMap.bind(this);
    }

    run(): M {
        return this.m;
    }

    map<B>(fn: (a: A) => B): WriterT<M, W, B> {
        return this.flatMap((a: A) => {
            const b = fn(a);
            return new WriterTImpl(this.monad.flatMap(this.m, () => [b, this.monoid.empty] as any), this.monad, this.monoid);
        });
    }

    flatMap<B>(fn: (a: A) => WriterT<M, W, B>): WriterT<M, W, B> {
        return new WriterTImpl<M, W, B>(
            this.monad.flatMap(this.m, ([a, w]: [A, W]) => {
                const nb = fn(a);
                return this.monad.flatMap(nb.run(), ([b, w2]: [B, W]) => {
                    const combined = this.monoid.concat(w, w2);
                    return this.monad.flatMap(nb.run(), () => [b, combined] as any);
                });
            }),
            this.monad,
            this.monoid
        );
    }
}

/**
 * Create a WriterT transformer factory for a given inner monad and monoid.
 */
export function WriterT<M, W>(monad: { of: <A>(a: A) => any; flatMap: <A, B>(m: any, fn: (a: A) => any) => any }, monoid: { empty: W; concat: (a: W, b: W) => W }) {
    return {
        of: <A>(a: A): WriterT<M, W, A> => new WriterTImpl(monad.of([a, monoid.empty]), monad, monoid),
        from: <A>(m: any): WriterT<M, W, A> => new WriterTImpl(m, monad, monoid),
        lift: <A>(m: any): WriterT<M, W, A> => new WriterTImpl(monad.flatMap(m, (a: A) => monad.of([a, monoid.empty])), monad, monoid),
    } as const;
}

export default WriterT;
