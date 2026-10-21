import is from '../../utils/iterable/is.ts';

export type MapFunction<T> = (value: T, idx: number, iter: Iterable<T>) => T | T[] | null;
export type MapperFunction<T> = (it: Iterable<T>) => Iterable<T>;

const map = <T>(transform: MapFunction<T>): MapperFunction<T> => {
  if (typeof transform !== 'function') {
    throw new TypeError('transform argument must be a function');
  }

  return function* (it) {
    if (!is(it)) {
      throw new TypeError('argument must be an iterable');
    }

    let idx = 0;
    for (const item of it) {
      const result = transform(item, idx++, it);

      if (result === null) {
        continue;
      }

      // This makes this into flatMap actually but that is
      // usually what we want
      if (Array.isArray(result)) {
        for (const res of result) {
          yield res;
        }

        continue;
      }

      yield result;
    }
  };
};

export default map;
