type FilterFn<T> = (item: T) => boolean;

const filter = <T>(predicate: FilterFn<T>) => {
  return function* (iter: Iterable<T>): Iterable<T> {
    for (const item of iter) {
      if (predicate(item)) {
        yield item;
      }
    }
  };
};

export default filter;
