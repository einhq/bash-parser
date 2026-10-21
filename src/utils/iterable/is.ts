export default <T>(it: any): it is Iterable<T> => {
  return it != null && typeof it[Symbol.iterator] === 'function';
};
