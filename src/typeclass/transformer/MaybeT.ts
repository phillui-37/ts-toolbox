import type { MonadLike, MonadTransDescriptor } from '../monad.js';
import { Maybe } from '../maybe.js';
import { match, P } from 'ts-pattern';
import type { Kind, URItoKind } from '../hkt.js';

/**
 * MaybeT<M, A>: monad transformer that combines Maybe with an inner monad `M<Maybe<A>>`.
 * Represents: `M<Maybe<A>>`
 * Satisfies MonadLike laws.
 */
export interface MaybeT<URI extends keyof URItoKind<any>, A> extends MonadLike<A> {
    run(): Kind<URI, Maybe<A>>;
    map<B>(fn: (a: A) => B): MaybeT<URI, B>;
    flatMap<B>(fn: (a: A) => MaybeT<URI, B>): MaybeT<URI, B>;
}

class MaybeTImpl<URI extends keyof URItoKind<any>, A> implements MaybeT<URI, A> {
    constructor(readonly m: Kind<URI, Maybe<A>>, readonly monad: MonadTransDescriptor<URI>) {
        this.run = this.run.bind(this);
        this.map = this.map.bind(this);
        this.flatMap = this.flatMap.bind(this);
    }

    run(): Kind<URI, Maybe<A>> {
        return this.m;
    }

    map<B>(fn: (a: A) => B): MaybeT<URI, B> {
        // Map over the outer monad `Kind<URI, ...>` and then map the inner `Maybe` when present.
        // If the inner monad exposes `map`, we can perform the mapping directly
        // inside that functor. Otherwise, we use `flatMap` + `of` as a fallback
        // to produce the same `M<Maybe<B>>` shape.
        const monad = this.monad;
        const mapped: Kind<URI, Maybe<B>> = monad.map?.<Maybe<A>, Maybe<B>>(this.m, (maybe: Maybe<A>) =>
            match<Maybe<A>>(maybe)
                .with(P.when(Maybe.isSome), (some: any) => some.map(fn))
                .otherwise(() => Maybe.none<B>())
        ) ?? monad.flatMap<Maybe<A>, Maybe<B>>(this.m, (maybe: Maybe<A>) =>
            match<Maybe<A>>(maybe)
                .with(P.when(Maybe.isSome), (some: any) => monad.of<Maybe<B>>(some.map(fn)))
                .otherwise(() => monad.of<Maybe<B>>(Maybe.none<B>()))
        );

        return new MaybeTImpl<URI, B>(mapped, monad);
    }

    flatMap<B>(fn: (a: A) => MaybeT<URI, B>): MaybeT<URI, B> {
        // flatMap must short-circuit when the inner Maybe is None.
        // For each `Maybe<A>` inside `M`, if it's `Some(a)` we call `fn(a)`
        // which returns a `MaybeT<M,B>`; we then return its `.run()` (an
        // `M<Maybe<B>>`). If it's `None`, we must return an `M<Maybe<B>>`
        // that contains that same `None` (using `monad.of(None)`).
        //
        // This preserves the monadic sequencing semantics while allowing
        // the outer monad `M` to control effects.
        const monad = this.monad;
        const flatMapped: Kind<URI, Maybe<B>> = monad.flatMap<Maybe<A>, Maybe<B>>(this.m, (maybe: Maybe<A>) =>
            match<Maybe<A>>(maybe)
                .with(P.when(Maybe.isSome), (some: any) => fn(some.value).run())
                .otherwise(() => monad.of<Maybe<B>>(Maybe.none<B>()))
        );

        return new MaybeTImpl<URI, B>(flatMapped, monad);
    }
}

/**
 * Create a MaybeT transformer factory for a given inner monad.
 */
export function MaybeT<URI extends keyof URItoKind<any>>(monad: Required<MonadTransDescriptor<URI>>) {
    return {
        of: <A>(a: A): MaybeT<URI, A> => new MaybeTImpl(monad.of<Maybe<A>>(Maybe.some(a)), monad),
        from: <A>(m: Kind<URI, Maybe<A>>): MaybeT<URI, A> => new MaybeTImpl(m, monad),
        lift: <A>(m: Kind<URI, A>): MaybeT<URI, A> => new MaybeTImpl(
            (monad.map?.<A, Maybe<A>>(m, (a: A) => Maybe.some(a)) ?? monad.flatMap<A, Maybe<A>>(m, (a: A) => monad.of<Maybe<A>>(Maybe.some(a)))),
            monad
        ),
    } as const;
}

export default MaybeT;
