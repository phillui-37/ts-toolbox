// Aggregate exports for convenient top-level importing.
// Preserve existing namespace-style exports while adding named exports.
import * as fnUtil from './util/fnUtil.js';
import * as typeclass from './typeclass/index.js';
import { Lens, Maybe, Result, Prism, TaggedComponent, Reader, Writer, Monad, Transformer } from './typeclass/index.js';
export * from './typeclass/hkt.js';
export * from './typeclass/transformer/index.js';
export * from './util/fnUtil.js';
export * from './util/boolean.js';
export * from './util/collections.js';
export * from './util/number.js';
export * from './util/operator.js';

export {
    // Namespaces
    fnUtil,
    typeclass,
    // Named typeclass exports
    Lens,
    Maybe,
    Result,
    Prism,
    TaggedComponent,
    Reader,
    Writer,
    Monad,
    Transformer
};