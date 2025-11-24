import type { MonadLike, MonadTransDescriptor } from '../monad.js';

/**
 * ResultT<M, E, A>: monad transformer that combines Result with an inner monad `M<Result<A, E>>`.
 * Also known as ExceptT in Haskell.
 * Represents: `M<Result<A, E>>`
 * Satisfies MonadLike laws.
 */
export interface ResultT<M, E, A> extends MonadLike<A> {
    run(): M;
    map<B>(fn: (a: A) => B): ResultT<M, E, B>;
    flatMap<B>(fn: (a: A) => ResultT<M, E, B>): ResultT<M, E, B>;
}

class ResultTImpl<M, E, A> implements ResultT<M, E, A> {
    constructor(readonly m: M, readonly monad: MonadTransDescriptor<M>) {
        this.run = this.run.bind(this);
        this.map = this.map.bind(this);
        this.flatMap = this.flatMap.bind(this);
    }

    run(): M {
        return this.m;
    }

    map<B>(fn: (a: A) => B): ResultT<M, E, B> {
        return new ResultTImpl<M, E, B>(
            this.monad.map?.(this.m, (result: any) => {
                if (result && typeof result.map === 'function') {
                    return result.map(fn);
                }
                return result;
            }) ?? this.monad.flatMap(this.m, (result: any) => {
                if (result && typeof result.map === 'function') {
                    return this.monad.of(result.map(fn));
                }
                return this.monad.of(result);
            }),
            this.monad
        );
    }

    flatMap<B>(fn: (a: A) => ResultT<M, E, B>): ResultT<M, E, B> {
        return new ResultTImpl<M, E, B>(
            this.monad.flatMap(this.m, (result: any) => {
                if (result && typeof result.flatMap === 'function') {
                    return fn(result).run();
                }
                return this.monad.map?.(this.m, () => result) ?? this.monad.flatMap(this.m, () => this.monad.of(result));
            }),
            this.monad
        );
    }
}

/**
 * Create a ResultT transformer factory for a given inner monad.
 */
export function ResultT<M, E>(monad: Required<MonadTransDescriptor<M>>) {
    return {
        of: <A>(a: A): ResultT<M, E, A> => new ResultTImpl(monad.of(a), monad),
        from: <A>(m: any): ResultT<M, E, A> => new ResultTImpl(m, monad),
        lift: <A>(m: any): ResultT<M, E, A> => new ResultTImpl(monad.map(m, (a: A) => ({ isOk: true, value: a })), monad),
    } as const;
}

export default ResultT;
