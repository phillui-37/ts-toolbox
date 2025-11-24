/**
 * Simple wrapper that attaches a `tag` to arbitrary `content`.
 * Useful for carrying extra typing/metadata alongside a value.
 */
export default class TaggedComponent<T> {
    constructor(
        readonly tag: string,
        readonly content: T
    ) {
        this.toString = this.toString.bind(this);
    }

    static of<T>(tag: string, content: T) {
        return new TaggedComponent(tag, content);
    }

    toString() {
        return `TaggedComponent(${this.tag}, ${this.content})`;
    }
}
