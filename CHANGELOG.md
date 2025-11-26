# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-11-26

### Added
- Coverage badge showing 97% test coverage in README.md
- Automated coverage badge update script (`scripts/update-coverage-badge.js`)
- New npm script `test:coverage` for running tests with coverage and auto-updating badge

### Changed
- Improved test coverage from ~94% to 97%
- Added tests for monad transformer fallback paths (when `map` is undefined)
- Added tests for number utility boundary conditions
- Upgraded vitest from v1.3.0 to v4.0.14
- Added @vitest/coverage-v8 v4.0.14 for coverage reporting
- Updated vite.config.js with test coverage configuration

### Fixed
- Writer monad implementation improvements
- Unit test corrections and enhancements

## [1.0.0] - 2025-11-25

### Added

#### Core Monads
- **Maybe Monad** - Optional value handling with `Some` and `None` variants
  - Type guards: `isSome`, `isNone`
  - Methods: `map`, `flatMap`, `getOr`, `getOrElse`, `or`, `and`
  - Full monad law compliance
  
- **Result Monad** - Type-safe error handling without exceptions
  - Variants: `Ok` and `Err`
  - Type guards: `isOk`, `isErr`
  - Methods: `map`, `flatMap`, `mapError`, `consume`, `consumeErr`, `getOr`, `getOrElse`, `or`, `and`
  - Error recovery and transformation patterns
  
- **Reader Monad** - Dependency injection and environment access
  - Methods: `of`, `from`, `ask`, `run`, `local`
  - Environment transformation support
  - Composable dependency injection patterns
  
- **Writer Monad** - Log and state accumulation
  - Methods: `of`, `tell`, `run`, `listen`, `pass`
  - Array-based log accumulation
  - Support for custom monoids

#### Monad Transformers
- **MaybeT** - Stack optional values with any monad
  - Full transformer implementation with `lift` and `from`
  - Preserves inner monad effects
  - Type-safe stacking
  
- **ResultT** - Stack error handling with any monad
  - Error propagation through transformer stack
  - `mapError` support
  - Validation pattern support
  
- **ReaderT** - Stack environment access with any monad
  - Environment injection for any monad
  - Local environment transformation
  - Composable with other transformers
  
- **WriterT** - Stack log accumulation with any monad
  - Configurable monoid for log types (arrays, strings, etc.)
  - `tell` operation in transformer context
  - Log transformation with `pass`

#### Higher-Kinded Types (HKT)
- **URItoKind** interface for type-level monad mapping
  - Support for: `Id`, `Identity`, `Promise`, `Array`, `Maybe`, `Result`, `Reader`, `Writer`
  - Transformer URIs: `MaybeT`, `ReaderT`, `ResultT`, `WriterT`
  - Extensible type system for custom monads

#### Type Classes
- **MonadLike** - Core monad interface
- **Functor** - Functor operations
- **Applicative** - Applicative operations
- **Extractable** - Value extraction interface
- **Alternative** - Alternative operations
- **Effectful** - Side effect interface
- **Monoid** - Monoid operations for Writer
- **MonadTransDescriptor** - Transformer descriptor interface

#### Optics
- **Lens** - Composable getters and setters
  - Methods: `from`, `get`, `set`, `modify`, `compose`
  - Immutable updates
  - Deep property access
  
- **Prism** - Optional getters and setters for sum types
  - Methods: `from`, `preview`, `review`, `modify`, `compose`
  - Maybe-based extraction
  - Type-safe construction

#### Utility Functions

**Function Composition:**
- `pipe` - Left-to-right function composition
- `compose` - Right-to-left function composition
- `apply` - Function application

**Higher-Order Functions:**
- `constant` - Create constant function
- `id` - Identity function
- `flip` - Swap first two arguments
- `flipHof` - Flip higher-order function arguments
- `uncurry` - Convert curried to multi-arg
- `negate` - Boolean negation

**Logic Utilities:**
- `all` - All predicates must pass
- `any` - Any predicate must pass
- `select` - Conditional execution with type safety
- `eq` - Curried equality check
- `ne` - Curried inequality check

**Truthiness Checks:**
- `truthy` - Check if value is truthy
- `falsy` - Check if value is falsy
- `allTruthy` - All values must be truthy
- `anyTruthy` - Any value must be truthy
- `allFalsy` - All values must be falsy
- `anyFalsy` - Any value must be falsy

**Data Manipulation:**
- `prop` - Curried property access
- `flattenBy` - Flatten tree structures
- `bounded` - Create range checker with inclusive/exclusive bounds
- `add` - Curried addition
- `run` - Execute function and return result
- `also` - Execute function for side effects, return original arguments
- `noop` - No-operation function
- `getOrExec` - Get value or execute function
- `isNotNil` - Type guard for non-null/undefined values

### Testing
- 428 comprehensive tests covering all features
- Monad law verification (left identity, right identity, associativity)
- Functor law verification
- Transformer law verification
- Edge case coverage
- Complex multi-level transformer combinations
- All test files:
  - `maybe.test.ts` - 39 tests
  - `result.test.ts` - 50 tests
  - `reader.test.ts` - 26 tests
  - `writer.test.ts` - 31 tests
  - `maybeT.test.ts` - 37 tests
  - `readerT.test.ts` - 39 tests
  - `resultT.test.ts` - 41 tests
  - `writerT.test.ts` - 44 tests
  - `transformer-combinations.test.ts` - 93 tests
  - `lens.test.ts` - 1 test
  - `prism.test.ts` - 1 test
  - `fnUtil.test.ts` - 20 tests
  - Additional tests for tagged components and type classes

### Build System
- Vite-based build system
- TypeScript compilation with declaration files
- UMD and ES module outputs
- Source maps included
- Type definitions exported

### Documentation
- Comprehensive README with examples
- API documentation for all exports
- Quick start guide
- Usage patterns and best practices
- TypeScript integration guide

### Dependencies
- `ts-pattern@^5.9.0` - Pattern matching support
- `typescript@^5.9.3` - TypeScript compiler
- `vite@^7.2.4` - Build tool
- `vitest@^1.3.0` - Testing framework
- `@types/node@^20.9.0` - Node.js type definitions

### Technical Highlights
- Full TypeScript type safety
- Zero runtime dependencies (ts-pattern only)
- Tree-shakeable ES modules
- Immutable data structures
- Functional programming patterns
- Comprehensive error handling
- Lazy evaluation where appropriate
- Support for function currying and partial application

### Package Information
- Package name: `ts-toolbox`
- Version: `1.0.0`
- License: ISC
- Module type: ES Module
- Main entry: `./dist/ts-toolbox.umd.js`
- Module entry: `./dist/ts-toolbox.es.js`
- Types entry: `./dist/index.d.ts`

---

## Future Considerations

Potential features for future releases:
- IO monad for side effects
- State monad for stateful computations
- Continuation monad
- Free monad implementation
- Additional optics (Traversal, Iso)
- Async monad transformers
- Property-based testing
- Performance benchmarks
- More utility functions
- Documentation improvements
