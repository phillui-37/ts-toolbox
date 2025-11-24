import type { MonadLike, MonadTransDescriptor } from '../monad.js';

/**
 * MaybeT<M, A>: monad transformer that combines Maybe with an inner monad `M<Maybe<A>>`.
 * Represents: `M<Maybe<A>>`
 * Satisfies MonadLike laws.
 */
export interface MaybeT<M, A> extends MonadLike<A> {
    run(): M;
    map<B>(fn: (a: A) => B): MaybeT<M, B>;
    flatMap<B>(fn: (a: A) => MaybeT<M, B>): MaybeT<M, B>;
}

class MaybeTImpl<M, A> implements MaybeT<M, A> {
    constructor(readonly m: M, readonly monad: MonadTransDescriptor<M>) {
        this.run = this.run.bind(this);
        this.map = this.map.bind(this);
        this.flatMap = this.flatMap.bind(this);
    }

    run(): M {
        return this.m;
    }

    map<B>(fn: (a: A) => B): MaybeT<M, B> {
        return new MaybeTImpl<M, B>(
            this.monad.map?.(this.m, (maybe: any) => {
                if (maybe && typeof maybe.map === 'function') {
                    return maybe.map(fn);
                }
                return maybe;
            }) ?? this.monad.flatMap(this.m, (maybe: any) => {
                if (maybe && typeof maybe.map === 'function') {
                    return this.monad.of(maybe.map(fn));
                }
                return this.monad.of(maybe);
            }),
            this.monad
        );
    }

    flatMap<B>(fn: (a: A) => MaybeT<M, B>): MaybeT<M, B> {
        return new MaybeTImpl<M, B>(
            this.monad.flatMap(this.m, (maybe: any) => {
                if (maybe && typeof maybe.flatMap === 'function') {
                    return fn(maybe).run();
                }
                return this.monad.map?.(this.m, () => maybe) ?? this.monad.flatMap(this.m, () => this.monad.of(maybe));
            }),
            this.monad
        );
    }
}

/**
 * Create a MaybeT transformer factory for a given inner monad.
 */
export function MaybeT<M>(monad: Required<MonadTransDescriptor<M>>) {
    return {
        of: <A>(a: A): MaybeT<M, A> => new MaybeTImpl(monad.of(a), monad),
        from: <A>(m: any): MaybeT<M, A> => new MaybeTImpl(m, monad),
        lift: <A>(m: any): MaybeT<M, A> => new MaybeTImpl(monad.map(m, (a: A) => ({ isSome: true, value: a })), monad),
    } as const;
}

export default MaybeT;
