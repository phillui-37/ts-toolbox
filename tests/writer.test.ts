import { describe, it, expect } from 'vitest';
import Writer from '../src/typeclass/writer.js';

describe('typeclass - Writer', () => {
    describe('Constructors', () => {
        it('creates Writer with of', () => {
            const writer = Writer.of(42);
            expect(writer.value).toBe(42);
            expect(writer.log).toBe('');
        });

        it('creates Writer with value and log', () => {
            const writer = Writer.of(42, 'initial log;');
            expect(writer.value).toBe(42);
            expect(writer.log).toBe('initial log;');
        });

        it('creates Writer with tell', () => {
            const writer = Writer.tell('log message');
            expect(writer.value).toBe(undefined);
            expect(writer.log).toBe('log message');
        });
    });

    describe('map (Functor)', () => {
        it('maps over the value', () => {
            const writer = Writer.of(5, 'start;');
            const mapped = writer.map(x => x * 2);
            expect(mapped.value).toBe(10);
            expect(mapped.log).toBe('start;');
        });

        it('map preserves the log', () => {
            const writer = Writer.of(5, 'log1;');
            const mapped = writer.map(x => x + 3);
            expect(mapped.value).toBe(8);
            expect(mapped.log).toBe('log1;');
        });

        it('map can change types', () => {
            const writer = Writer.of(42, 'log;');
            const mapped = writer.map(x => `Value: ${x}`);
            expect(mapped.value).toBe('Value: 42');
            expect(mapped.log).toBe('log;');
        });

        it('chained maps work correctly', () => {
            const writer = Writer.of(2, 'start;')
                .map(x => x + 1)
                .map(x => x * 2)
                .map(x => `Result: ${x}`);
            expect(writer.value).toBe('Result: 6');
            expect(writer.log).toBe('start;');
        });

        it('map with empty log', () => {
            const writer = Writer.of(10);
            const mapped = writer.map(x => x * 2);
            expect(mapped.value).toBe(20);
            expect(mapped.log).toBe('');
        });
    });

    describe('flatMap (Monad)', () => {
        it('flatMap chains computations', () => {
            const writer = Writer.of(5, 'start;');
            const chained = writer.flatMap(x => Writer.of(x * 2, 'double;'));
            expect(chained.value).toBe(10);
            expect(chained.log).toBe('start;double;');
        });

        it('flatMap accumulates logs', () => {
            const writer = Writer.of(2, 'log1;')
                .flatMap(x => Writer.of(x + 1, 'log2;'))
                .flatMap(x => Writer.of(x * 2, 'log3;'));
            expect(writer.value).toBe(6);
            expect(writer.log).toBe('log1;log2;log3;');
        });

        it('flatMap with empty logs', () => {
            const writer = Writer.of(5)
                .flatMap(x => Writer.of(x * 2));
            expect(writer.value).toBe(10);
            expect(writer.log).toBe('');
        });

        it('flatMap handles mixed empty and non-empty logs', () => {
            const writer = Writer.of(5, 'start;')
                .flatMap(x => Writer.of(x + 1))
                .flatMap(x => Writer.of(x * 2, 'end;'));
            expect(writer.value).toBe(12);
            expect(writer.log).toBe('start;end;');
        });

        it('flatMap can use tell for logging', () => {
            const writer = Writer.of(5, 'start;')
                .flatMap(x => Writer.tell('processing;').flatMap(() => Writer.of(x * 2, 'done;')));
            expect(writer.value).toBe(10);
            expect(writer.log).toBe('start;processing;done;');
        });
    });

    describe('tell combinator', () => {
        it('tell creates writer with log only', () => {
            const writer = Writer.tell('message');
            expect(writer.value).toBe(undefined);
            expect(writer.log).toBe('message');
        });

        it('tell can be chained with flatMap', () => {
            const writer = Writer.tell('log1;')
                .flatMap(() => Writer.tell('log2;'))
                .flatMap(() => Writer.of(42, 'log3;'));
            expect(writer.value).toBe(42);
            expect(writer.log).toBe('log1;log2;log3;');
        });

        it('tell with map ignores the undefined value', () => {
            const writer = Writer.tell('log;')
                .flatMap(() => Writer.of(10, 'value;'));
            expect(writer.value).toBe(10);
            expect(writer.log).toBe('log;value;');
        });
    });

    describe('Log Accumulation', () => {
        it('accumulates logs through multiple operations', () => {
            const writer = Writer.of(1, 'start;')
                .map(x => x + 1)
                .flatMap(x => Writer.of(x * 2, 'double;'))
                .map(x => x + 5)
                .flatMap(x => Writer.of(x, 'end;'));
            expect(writer.value).toBe(9);
            expect(writer.log).toBe('start;double;end;');
        });

        it('accumulates with tell in pipeline', () => {
            const writer = Writer.of(5, 'init;')
                .flatMap(x => Writer.tell('step1;').flatMap(() => Writer.of(x + 1)))
                .flatMap(x => Writer.tell('step2;').flatMap(() => Writer.of(x * 2)))
                .flatMap(x => Writer.of(x, 'final;'));
            expect(writer.value).toBe(12);
            expect(writer.log).toBe('init;step1;step2;final;');
        });

        it('handles complex logging patterns', () => {
            const compute = (x: number, op: string): Writer<number> => 
                Writer.tell(`[${op}] `).flatMap(() => Writer.of(x, `result=${x}; `));

            const writer = Writer.of(10, 'start; ')
                .flatMap(x => compute(x + 5, 'add'))
                .flatMap(x => compute(x * 2, 'multiply'))
                .flatMap(x => Writer.of(x, 'end.'));

            expect(writer.value).toBe(30);
            expect(writer.log).toBe('start; [add] result=15; [multiply] result=30; end.');
        });
    });

    describe('Monad Laws', () => {
        const f = (x: number) => Writer.of(x * 2, 'f;');
        const g = (x: number) => Writer.of(x + 3, 'g;');

        it('satisfies left identity: of(a).flatMap(f) === f(a)', () => {
            const a = 5;
            const left = Writer.of(a).flatMap(f);
            const right = f(a);
            expect(left.value).toBe(right.value);
            expect(left.log).toBe(right.log);
        });

        it('satisfies right identity: m.flatMap(of) === m', () => {
            const m = Writer.of(5, 'log;');
            const left = m.flatMap(x => Writer.of(x));
            expect(left.value).toBe(m.value);
            expect(left.log).toBe(m.log);
        });

        it('satisfies associativity: m.flatMap(f).flatMap(g) === m.flatMap(x => f(x).flatMap(g))', () => {
            const m = Writer.of(5, 'start;');
            const left = m.flatMap(f).flatMap(g);
            const right = m.flatMap(x => f(x).flatMap(g));
            expect(left.value).toBe(right.value);
            expect(left.log).toBe(right.log);
        });
    });

    describe('Functor Laws', () => {
        it('satisfies identity: m.map(x => x) === m', () => {
            const m = Writer.of(5, 'log;');
            const mapped = m.map(x => x);
            expect(mapped.value).toBe(m.value);
            expect(mapped.log).toBe(m.log);
        });

        it('satisfies composition: m.map(f).map(g) === m.map(x => g(f(x)))', () => {
            const m = Writer.of(5, 'log;');
            const f = (x: number) => x * 2;
            const g = (x: number) => x + 3;

            const left = m.map(f).map(g);
            const right = m.map(x => g(f(x)));
            expect(left.value).toBe(right.value);
            expect(left.log).toBe(right.log);
        });
    });

    describe('Edge Cases', () => {
        it('handles null and undefined values', () => {
            const writerNull = Writer.of(null, 'null;');
            expect(writerNull.value).toBe(null);
            expect(writerNull.log).toBe('null;');

            const writerUndefined = Writer.of(undefined, 'undefined;');
            expect(writerUndefined.value).toBe(undefined);
            expect(writerUndefined.log).toBe('undefined;');
        });

        it('handles complex objects', () => {
            const obj = { a: 1, b: { c: 2 } };
            const writer = Writer.of(obj, 'object;');
            const mapped = writer.map(o => o.b.c);
            expect(mapped.value).toBe(2);
            expect(mapped.log).toBe('object;');
        });

        it('handles arrays', () => {
            const arr = [1, 2, 3];
            const writer = Writer.of(arr, 'array;');
            const mapped = writer.map(a => a.length);
            expect(mapped.value).toBe(3);
            expect(mapped.log).toBe('array;');
        });

        it('handles empty string logs', () => {
            const writer = Writer.of(42, '')
                .flatMap(x => Writer.of(x * 2, ''))
                .flatMap(x => Writer.of(x + 1, ''));
            expect(writer.value).toBe(85);
            expect(writer.log).toBe('');
        });

        it('handles very long log chains', () => {
            let writer = Writer.of(0, 'start;');
            for (let i = 0; i < 10; i++) {
                writer = writer.flatMap(x => Writer.of(x + 1, `step${i};`));
            }
            expect(writer.value).toBe(10);
            expect(writer.log).toBe('start;step0;step1;step2;step3;step4;step5;step6;step7;step8;step9;');
        });

        it('log concatenation is associative', () => {
            const w1 = Writer.of(1, 'a;');
            const w2 = Writer.of(2, 'b;');
            const w3 = Writer.of(3, 'c;');

            const left = w1.flatMap(() => w2).flatMap(() => w3);
            const right = w1.flatMap(() => w2.flatMap(() => w3));

            expect(left.value).toBe(right.value);
            expect(left.log).toBe(right.log);
            expect(left.log).toBe('a;b;c;');
        });

        it('works with computation-heavy pipelines', () => {
            const factorial = (n: number): Writer<number> => {
                if (n <= 1) return Writer.of(1, `factorial(${n})=1; `);
                return Writer.of(n, `step n=${n}; `)
                    .flatMap(x => factorial(x - 1)
                        .map(f => x * f)
                    );
            };

            const result = factorial(5);
            expect(result.value).toBe(120);
            expect(result.log).toContain('step n=5;');
            expect(result.log).toContain('factorial(1)=1;');
        });
    });
});
