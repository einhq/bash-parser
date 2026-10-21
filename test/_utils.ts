import { assertEquals, assertObjectMatch } from '@std/assert';
import type { AstSourceLocation } from '../src/ast/types.ts';

export const mkloc2 = function mkloc(startLine: number, startColumn: number, endLine: number, endColumn: number, startChar: number, endChar: number): AstSourceLocation {
  return {
    start: { row: startLine, col: startColumn, char: startChar },
    end: { row: endLine, col: endColumn, char: endChar },
  };
};

export const checkResults = (actual: any, expected: any) => {
  if (
    actual !== null &&
    expected !== null &&
    typeof actual === 'object' &&
    typeof expected === 'object'
  ) {
    assertObjectMatch(actual as Record<string, unknown>, expected);
  } else {
    assertEquals(actual, expected);
  }
};

/** The items of an array, as an iterable. */
export const fromArray = function* <T>(array: T[]): IterableIterator<T> {
  for (const item of array) {
    yield item;
  }
};

/** The items of an iterable, in an array. */
export const toArray = <T>(iterable: Iterable<T>): T[] => {
  const arr: T[] = [];

  for (const item of iterable) {
    arr.push(item);
  }

  return arr;
};

export default {
  mkloc2,
  checkResults,
};
