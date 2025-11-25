import type { MonadLike, MonadTransDescriptor } from '../monad.js';
import { Result } from '../result.js';
import type { Kind, URItoKind } from '../hkt.js';
import { match, P } from 'ts-pattern';


/**
 * ResultT<M, E, A>: monad transformer that combines Result with an inner monad `M<Result<A, E>>`.
 * Also known as ExceptT in Haskell.
 * Represents: `M<Result<A, E>>`
 * Satisfies MonadLike laws.
 */
export interface ResultT<URI extends keyof URItoKind<any>, E, A> extends MonadLike<A> {
    run(): Kind<URI, Result<A, E>>;
    map<B>(fn: (a: A) => B): ResultT<URI, E, B>;
    flatMap<B>(fn: (a: A) => ResultT<URI, E, B>): ResultT<URI, E, B>;
}

class ResultTImpl<URI extends keyof URItoKind<any>, E, A> implements ResultT<URI, E, A> {
    constructor(readonly m: Kind<URI, Result<A, E>>, readonly monad: MonadTransDescriptor<URI>) {
        this.run = this.run.bind(this);
        this.map = this.map.bind(this);
        this.flatMap = this.flatMap.bind(this);
    }

    run(): Kind<URI, Result<A, E>> {
        return this.m;
    }

    map<B>(fn: (a: A) => B): ResultT<URI, E, B> {
        const monad = this.monad;
            const mapped: Kind<URI, Result<B, E>> = monad.map?.<Result<A, E>, Result<B, E>>(this.m, (result: Result<A, E>) =>
                match<Result<A, E>>(result)
                    .with(P.when(Result.isOk), (ok: any) => ok.map(fn))
                    .with(P.when(Result.isErr), (err: any) => Result.err<B, E>(err.error))
                    .run()
            ) ?? monad.flatMap<Result<A, E>, Result<B, E>>(this.m, (result: Result<A, E>) =>
                match<Result<A, E>>(result)
                    .with(P.when(Result.isOk), (ok: any) => monad.of<Result<B, E>>(ok.map(fn)))
                    .with(P.when(Result.isErr), (err: any) => monad.of<Result<B, E>>(Result.err<B, E>(err.error)))
                    .run()
            );

        return new ResultTImpl<URI, E, B>(mapped, monad);
    }

    flatMap<B>(fn: (a: A) => ResultT<URI, E, B>): ResultT<URI, E, B> {
        const monad = this.monad;
            const flatMapped: Kind<URI, Result<B, E>> = monad.flatMap<Result<A, E>, Result<B, E>>(this.m, (result: Result<A, E>) =>
                match<Result<A, E>>(result)
                    .with(P.when(Result.isOk), (ok: any) => fn(ok.value).run())
                    .with(P.when(Result.isErr), (err: any) => monad.of<Result<B, E>>(Result.err<B, E>(err.error)))
                    .run()
            );

        return new ResultTImpl<URI, E, B>(flatMapped, monad);
    }
}

/**
 * Create a ResultT transformer factory for a given inner monad.
 */
export function ResultT<URI extends keyof URItoKind<any>, E>(monad: Required<MonadTransDescriptor<URI>>) {
    return {
        of: <A>(a: A): ResultT<URI, E, A> => new ResultTImpl(monad.of<Result<A, E>>(Result.ok(a)), monad),
        from: <A>(m: Kind<URI, Result<A, E>>): ResultT<URI, E, A> => new ResultTImpl(m, monad),
        lift: <A>(m: Kind<URI, A>): ResultT<URI, E, A> => new ResultTImpl(
            (monad.map?.<A, Result<A, E>>(m, (a: A) => Result.ok<A, E>(a)) ?? monad.flatMap<A, Result<A, E>>(m, (a: A) => monad.of<Result<A, E>>(Result.ok<A, E>(a)))),
            monad
        ),
    } as const;
}

export default ResultT;
