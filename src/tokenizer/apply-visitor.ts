import type { TokenIf, Visitor } from './types.ts';

export const applyVisitor = (visitor: Visitor) => (tk: TokenIf, _idx: number, iterable: Iterable<TokenIf>) => {
  if (tk.type in visitor) {
    const visit = visitor[tk.type];
    return visit(tk, iterable);
  }

  if ('defaultMethod' in visitor) {
    const visit = visitor.defaultMethod;
    return visit(tk, iterable);
  }

  return tk;
};
