import is from '../../utils/iterable/is.ts';

export interface LookaheadIterable<T> extends Iterable<T> {
  ahead(idx: number): T | undefined;
  behind(idx: number): T | undefined;
}

const lookahead = <T>(it: Iterable<T>, size: number = 1): LookaheadIterable<T> => {
  if (size < 1) {
    throw new RangeError('size argument must be greater than 0');
  }

  if (!is(it)) {
    throw new TypeError('argument must be an iterable');
  }

  const behindCache: (T | undefined)[] = new Array(size + 1);
  const aheadCache: T[] = [];

  const iterator = it[Symbol.iterator]();

  const resultIterable: LookaheadIterable<T> = {
    ahead(idx: number): T | undefined {
      if (idx > size) {
        throw new RangeError(`cannot look ahead of ${idx} position, currently depth is ${size}`);
      }

      if (idx < 1) {
        throw new RangeError('look ahead index must be greater than 0');
      }

      return aheadCache[idx - 1];
    },
    behind(idx: number): T | undefined {
      if (idx > size) {
        throw new RangeError(`cannot look behind of ${idx} position, currently depth is ${size}`);
      }

      if (idx < 1) {
        throw new RangeError('look behind index must be greater than 0');
      }

      return behindCache[idx];
    },
    [Symbol.iterator]() {
      return {
        next(): IteratorResult<T> {
          let item = iterator.next();

          while (!item.done && aheadCache.length <= size) {
            aheadCache.push(item.value);
            item = iterator.next();
          }

          if (!item.done) {
            aheadCache.push(item.value);
          }

          if (item.done && aheadCache.length === 0) {
            return { done: true, value: undefined };
          }

          const value = aheadCache.shift() as T;

          behindCache.unshift(value);
          behindCache.pop();

          return { done: false, value };
        },
      };
    },
  };

  return resultIterable;
};

lookahead.depth = (size: number) => <T>(iterable: Iterable<T>): LookaheadIterable<T> => lookahead(iterable, size);

export default lookahead;
