import type { MonadLike, MonadTransDescriptor } from '../monad.js';
import type { Kind, URItoKind } from '../hkt.js';

/**
 * ReaderT<R, M, A>: monad transformer that combines Reader (environment `R`) with an inner monad `M<A>`.
 * Represents: `R -> M<A>`
 * Satisfies MonadLike laws.
 */
export interface ReaderT<R, URI extends keyof URItoKind<any>, A> extends MonadLike<A> {
    run(r: R): Kind<URI, A>;
    map<B>(fn: (a: A) => B): ReaderT<R, URI, B>;
    flatMap<B>(fn: (a: A) => ReaderT<R, URI, B>): ReaderT<R, URI, B>;
}

class ReaderTImpl<R, URI extends keyof URItoKind<any>, A> implements ReaderT<R, URI, A> {
    constructor(readonly fn: (r: R) => Kind<URI, A>, readonly monad: MonadTransDescriptor<URI>) {
        this.run = this.run.bind(this);
        this.map = this.map.bind(this);
        this.flatMap = this.flatMap.bind(this);
    }

    run(r: R): Kind<URI, A> {
        return this.fn(r);
    }

    map<B>(fn: (a: A) => B): ReaderT<R, URI, B> {
        const monad = this.monad;
        return new ReaderTImpl<R, URI, B>(
            (r: R) => (monad.map?.<A, B>(this.fn(r), fn) ?? monad.flatMap<A, B>(this.fn(r), (a: A) => monad.of<B>(fn(a)))),
            monad
        );
    }

    flatMap<B>(fn: (a: A) => ReaderT<R, URI, B>): ReaderT<R, URI, B> {
        const monad = this.monad;
        return new ReaderTImpl<R, URI, B>(
            (r: R) => monad.flatMap<A, B>(this.run(r), (a: A) => fn(a).run(r)),
            monad
        );
    }
}

/**
 * Create a ReaderT transformer factory for a given inner monad.
 * Pass monad operations: `{ of, flatMap, map }`.
 */
export function ReaderT<URI extends keyof URItoKind<any>>(monad: Required<MonadTransDescriptor<URI>>) {
    return {
        of: <R, A>(a: A): ReaderT<R, URI, A> => new ReaderTImpl(() => monad.of<A>(a), monad),
        from: <R, A>(fn: (r: R) => Kind<URI, A>): ReaderT<R, URI, A> => new ReaderTImpl(fn, monad),
        lift: <R, A>(m: Kind<URI, A>): ReaderT<R, URI, A> => new ReaderTImpl(() => m, monad),
    } as const;
}

export default ReaderT;
