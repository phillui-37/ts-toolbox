import type { MonadLike, MonadTransDescriptor, Monoid } from '../monad.js';
import type { Kind, URItoKind } from '../hkt.js';
import { match, P } from 'ts-pattern';

/**
 * WriterT<M, W, A>: monad transformer that combines Writer (log `W`) with an inner monad `M<[A, W]>`.
 * Represents: `M<[A, W]>` where W is a monoid.
 * Satisfies MonadLike laws.
 */
export interface WriterT<URI extends keyof URItoKind<any>, W, A> extends MonadLike<A> {
    run(): Kind<URI, [A, W]>;
    map<B>(fn: (a: A) => B): WriterT<URI, W, B>;
    flatMap<B>(fn: (a: A) => WriterT<URI, W, B>): WriterT<URI, W, B>;
}

class WriterTImpl<URI extends keyof URItoKind<any>, W, A> implements WriterT<URI, W, A> {
    constructor(readonly m: Kind<URI, [A, W]>, readonly monad: MonadTransDescriptor<URI>, readonly monoid: Monoid<W>) {
        this.run = this.run.bind(this);
        this.map = this.map.bind(this);
        this.flatMap = this.flatMap.bind(this);
    }

    run(): Kind<URI, [A, W]> {
        return this.m;
    }

    map<B>(fn: (a: A) => B): WriterT<URI, W, B> {
        // Map should transform the stored value while preserving the accumulated log.
        const monad = this.monad;
        const mapped: Kind<URI, [B, W]> = monad.map?.<[A, W], [B, W]>(this.m, (pair: [A, W]) =>
            (match<[A, W]>(pair)
                .with(P._, (p: any) => [fn(p[0]), p[1]])
                .run() as unknown) as [B, W]
        ) ?? monad.flatMap<[A, W], [B, W]>(this.m, (pair: [A, W]) =>
            (match<[A, W]>(pair)
                .with(P._, (p: any) => monad.of<[B, W]>([fn(p[0]), p[1]]))
                .run() as unknown) as Kind<URI, [B, W]>
        );

        return new WriterTImpl<URI, W, B>(mapped, monad, this.monoid);
    }

    flatMap<B>(fn: (a: A) => WriterT<URI, W, B>): WriterT<URI, W, B> {
        const monad = this.monad;
        const flatMapped: Kind<URI, [B, W]> = monad.flatMap<[A, W], [B, W]>(this.m, (pair: [A, W]) =>
            match<[A, W]>(pair)
                .with(P._, (p: any) => {
                    const a = p[0];
                    const w = p[1];
                    const nb = fn(a);
                    return monad.flatMap<[B, W], [B, W]>(nb.run(), (inner: [B, W]) =>
                        match<[B, W]>(inner)
                            .with(P._, (q: any) => {
                                const b = q[0];
                                const w2 = q[1];
                                const combined = this.monoid.concat(w, w2);
                                return monad.of<[B, W]>([b, combined]);
                            })
                            .run()
                    );
                })
                .run()
        );

        return new WriterTImpl<URI, W, B>(flatMapped, monad, this.monoid);
    }
}

/**
 * Create a WriterT transformer factory for a given inner monad and monoid.
 */
export function WriterT<URI extends keyof URItoKind<any>, W>(monad: Required<MonadTransDescriptor<URI>>, monoid: Monoid<W>) {
    return {
        of: <A>(a: A): WriterT<URI, W, A> => new WriterTImpl(monad.of<[A, W]>([a, monoid.empty]), monad, monoid),
        from: <A>(m: Kind<URI, [A, W]>): WriterT<URI, W, A> => new WriterTImpl(m, monad, monoid),
        lift: <A>(m: Kind<URI, A>): WriterT<URI, W, A> => new WriterTImpl(
            (monad.map?.<A, [A, W]>(m, (a: A) => [a, monoid.empty]) ?? monad.flatMap<A, [A, W]>(m, (a: A) => monad.of<[A, W]>([a, monoid.empty]))),
            monad,
            monoid
        ),
    } as const;
}

export default WriterT;
