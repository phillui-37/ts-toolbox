# TS Toolbox

<p align="left">
  <a href="https://www.npmjs.com/package/@phillui/ts-toolbox">
    <img src="https://img.shields.io/npm/v/@phillui/ts-toolbox" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@phillui/ts-toolbox">
    <img src="https://img.shields.io/npm/dm/@phillui/ts-toolbox" alt="npm downloads" />
  </a>
  <a href="https://github.com/phillui-37/ts-toolbox/blob/main/LICENSE">
    <img src="https://img.shields.io/npm/l/@phillui/ts-toolbox" alt="license" />
  </a>
  <a href="https://bundlephobia.com/package/@phillui/ts-toolbox">
    <img src="https://img.shields.io/bundlephobia/minzip/@phillui/ts-toolbox" alt="bundle size" />
  </a>
  <img src="https://img.shields.io/badge/types-Included-blue" alt="types included" />
  <img src="https://img.shields.io/badge/tree--shakeable-yes-success" alt="tree-shakeable" />
</p>

A comprehensive TypeScript functional programming library featuring monads, monad transformers, optics, and utility functions. Fully typed with extensive test coverage.

## Features

### 🎯 Monads
Type-safe monadic containers for functional composition:
- **Maybe** - Optional value handling (`Some` | `None`)
- **Result** - Error handling without exceptions (`Ok` | `Err`)
- **Reader** - Dependency injection and environment access
- **Writer** - Log/state accumulation with monoid support

### 🔄 Monad Transformers
Stack multiple monadic effects:
- **MaybeT** - Optional values in any monad
- **ResultT** - Error handling in any monad
- **ReaderT** - Environment access in any monad
- **WriterT** - Log accumulation in any monad

### 🔍 Optics
Functional data manipulation:
- **Lens** - Composable getters and setters for nested data
- **Prism** - Optional getters and setters for sum types

### 🛠️ Utility Functions
Functional programming essentials:
- Function composition (`pipe`, `compose`)
- Higher-order functions (`curry`, `flip`, `uncurry`)
- Logic utilities (`all`, `any`, `select`)
- Type guards (`truthy`, `falsy`, `isNotNil`)
- And many more...

## Installation

```bash
npm install @phillui/ts-toolbox
# or
pnpm add @phillui/ts-toolbox
# or
yarn add @phillui/ts-toolbox
```

## Quick Start

### Maybe Monad
```typescript
import { Maybe } from '@phillui/ts-toolbox';

const safeDivide = (a: number, b: number): Maybe<number> =>
  b === 0 ? Maybe.none() : Maybe.some(a / b);

const result = safeDivide(10, 2)
  .map(x => x * 2)
  .flatMap(x => safeDivide(x, 5))
  .getOr(0); // 2
```

### Result Monad
```typescript
import { Result } from '@phillui/ts-toolbox';

const parseNumber = (str: string): Result<number, string> => {
  const num = parseInt(str);
  return isNaN(num) ? Result.err('Not a number') : Result.ok(num);
};

parseNumber('42')
  .map(x => x * 2)
  .mapError(e => `Error: ${e}`)
  .consume(
    value => console.log(`Success: ${value}`),
    error => console.log(error)
  );
```

### Reader Monad
```typescript
import { Reader } from '@phillui/ts-toolbox';

interface Config {
  apiUrl: string;
  timeout: number;
}

const getApiUrl = Reader.from<Config, string>(config => config.apiUrl);
const getFullUrl = getApiUrl.map(url => `${url}/api/v1`);

const config: Config = { apiUrl: 'https://example.com', timeout: 5000 };
console.log(getFullUrl.run(config)); // https://example.com/api/v1
```

### Writer Monad
```typescript
import { Writer } from '@phillui/ts-toolbox';

const computation = Writer.of<number, string>(5)
  .flatMap(x => Writer.tell(`Processing ${x}`, x * 2))
  .flatMap(x => Writer.tell(`Doubled to ${x}`, x + 10));

const [result, logs] = computation.run();
console.log(result); // 20
console.log(logs); // ['Processing 5', 'Doubled to 10']
```

### Monad Transformers
```typescript
import { MaybeT, ResultT, ReaderT, Maybe } from '@phillui/ts-toolbox';

// Stack Maybe over Result
const maybeMonad = {
  of: <A>(a: A) => Maybe.some(a),
  flatMap: <A, B>(m: Maybe<A>, f: (a: A) => Maybe<B>) => m.flatMap(f),
  map: <A, B>(m: Maybe<A>, f: (a: A) => B) => m.map(f)
};

const RT = ResultT(maybeMonad);

const result = RT.of(42)
  .map(x => x * 2)
  .run(); // Maybe<Result<number, E>>
```

### Lenses
```typescript
import { Lens } from '@phillui/ts-toolbox';

interface User {
  name: string;
  address: { city: string };
}

const cityLens = Lens.from<User, string>(
  user => user.address.city,
  city => user => ({ ...user, address: { ...user.address, city } })
);

const user = { name: 'Alice', address: { city: 'NYC' } };
const updated = cityLens.set('LA')(user);
console.log(updated.address.city); // LA
```

### Utility Functions
```typescript
import { pipe, compose, prop, select } from 'ts-toolbox';

// Function composition
const result = pipe(
  5,
  x => x * 2,
  x => x + 3,
  x => x.toString()
); // "13"

// Property access
const getName = prop<{ name: string }>('name');
console.log(getName({ name: 'Alice' })); // Alice

// Conditional execution
const value = select({
  pred: true,
  t: () => 'yes',
  f: () => 'no'
}); // "yes"
```

## API Documentation

### Monads

All monads implement the `MonadLike` interface with:
- `map<U>(fn: (value: T) => U): Monad<U>` - Transform the contained value
- `flatMap<U>(fn: (value: T) => Monad<U>): Monad<U>` - Chain monadic operations

#### Maybe
- `Maybe.some<T>(value: T): Maybe<T>` - Create a Some value
- `Maybe.none<T>(): Maybe<T>` - Create a None value
- `Maybe.isSome(m: Maybe<T>): boolean` - Type guard for Some
- `Maybe.isNone(m: Maybe<T>): boolean` - Type guard for None
- `getOr(defaultValue: T): T` - Extract value or use default
- `getOrElse(fn: () => T): T` - Extract value or compute default
- `or(alternative: Maybe<T>): Maybe<T>` - Alternative if None
- `and(other: Maybe<T>): Maybe<T>` - Chain if Some

#### Result
- `Result.ok<T, E>(value: T): Result<T, E>` - Create an Ok result
- `Result.err<T, E>(error: E): Result<T, E>` - Create an Err result
- `Result.isOk(r: Result<T, E>): boolean` - Type guard for Ok
- `Result.isErr(r: Result<T, E>): boolean` - Type guard for Err
- `mapError<F>(fn: (error: E) => F): Result<T, F>` - Transform error
- `consume(onOk: (value: T) => void, onErr: (error: E) => void): void` - Handle both cases
- `getOr(defaultValue: T): T` - Extract value or use default
- `getOrElse(fn: (error: E) => T): T` - Extract value or compute from error
- `or(alternative: Result<T, E>): Result<T, E>` - Alternative if Err
- `and(other: Result<T, E>): Result<T, E>` - Chain if Ok

#### Reader
- `Reader.of<R, A>(value: A): Reader<R, A>` - Create a constant Reader
- `Reader.from<R, A>(fn: (r: R) => A): Reader<R, A>` - Create from function
- `Reader.ask<R>(): Reader<R, R>` - Access the environment
- `run(env: R): A` - Execute with environment
- `local<R2>(fn: (r2: R2) => R): Reader<R2, A>` - Transform environment

#### Writer
- `Writer.of<T, W>(value: T, log?: W): Writer<T>` - Create a Writer
- `Writer.tell<T, W>(log: W, value: T): Writer<T>` - Create with log
- `run(): [T, W[]]` - Extract value and accumulated logs
- `listen(): Writer<[T, W[]]>` - Access logs without extraction
- `pass(fn: (logs: W[]) => W[]): Writer<T>` - Transform logs

### Monad Transformers

Transformers combine effects from multiple monads:

#### MaybeT, ResultT, ReaderT, WriterT
Each transformer provides:
- `of<A>(value: A)` - Lift a value into the transformer
- `lift<A>(m: InnerMonad<A>)` - Lift inner monad into transformer
- `from<A>(m: FullStack)` - Create from complete monad stack
- `map`, `flatMap` - Standard monadic operations
- `run()` - Execute the transformer stack

### Optics

#### Lens<S, A>
- `Lens.from<S, A>(get, set)` - Create a lens
- `get(obj: S): A` - Extract value
- `set(value: A): (obj: S) => S` - Update value
- `modify(fn: (a: A) => A): (obj: S) => S` - Transform value
- `compose<B>(other: Lens<A, B>): Lens<S, B>` - Compose lenses

#### Prism<S, A>
- `Prism.from<S, A>(preview, review)` - Create a prism
- `preview(obj: S): Maybe<A>` - Try to extract value
- `review(value: A): S` - Construct container
- `modify(fn: (a: A) => A): (obj: S) => S` - Transform if present
- `compose<B>(other: Prism<A, B>): Prism<S, B>` - Compose prisms

### Utility Functions

#### Function Composition
- `pipe(value, ...fns)` - Left-to-right composition
- `compose(...fns)` - Right-to-left composition
- `apply(fn)(...args)` - Apply function to arguments

#### Higher-Order Functions
- `constant(value)` - Create constant function
- `id(value)` - Identity function
- `flip(fn)` - Swap first two arguments
- `uncurry(fn)` - Convert curried to multi-arg function
- `negate(fn)` - Boolean negation

#### Logic Utilities
- `all(...predicates)` - All predicates must pass
- `any(...predicates)` - Any predicate must pass
- `select({ pred, t, f })` - Conditional execution
- `truthy(value)` - Check if truthy
- `falsy(value)` - Check if falsy
- `allTruthy(...values)` - All values truthy
- `anyTruthy(...values)` - Any value truthy

#### Data Access
- `prop(key)` - Get property from object
- `flattenBy(getChildren)` - Flatten tree structure
- `bounded(min, max, inclusive)` - Create range checker
- `isNotNil(value)` - Type guard for non-null/undefined

## Type Safety

All functions and data structures are fully typed with TypeScript. The library uses:
- Higher-Kinded Types (HKT) for monad transformers
- Type guards for runtime type checking
- Generic constraints for type safety
- Branded types where appropriate

## Testing

The library has comprehensive test coverage with 428+ tests covering:
- Monad laws (left identity, right identity, associativity)
- Functor laws
- Transformer laws
- Edge cases and error handling
- Complex transformer combinations

Run tests:
```bash
pnpm test
```

## Building

```bash
pnpm build
```

Outputs:
- UMD bundle: `dist/ts-toolbox.umd.js`
- ES module: `dist/ts-toolbox.es.js`
- Type definitions: `dist/index.d.ts`

## License

MIT

## Contributing

Contributions welcome! Please ensure:
- All tests pass
- New features include tests
- Code follows existing patterns
- Types are properly defined

## Credits

Built with TypeScript, Vite, and Vitest.
Uses [ts-pattern](https://github.com/gvergnaud/ts-pattern) for pattern matching.
