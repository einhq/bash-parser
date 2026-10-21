import type { LexerPhase } from '../../../lexer/types.ts';
import { applyVisitor, type TokenIf } from '../../../tokenizer/mod.ts';
import compose from '../../../utils/iterable/compose.ts';
import lookahead, { type LookaheadIterable } from '../../../utils/iterable/lookahead.ts';
import map from '../../../utils/iterable/map.ts';
import filterNonNull from '../../../utils/non-null.ts';

const isSeparator = (tk: TokenIf) =>
  tk && (
    tk.is('NEWLINE') ||
    tk.is('NEWLINE_LIST') ||
    tk.is('AND') ||
    tk.is('SEMICOLON') ||
    (tk.is('OPERATOR') && tk.value === ';') ||
    (tk.is('OPERATOR') && tk.value === '&')
  );

const skipJoined = (tk: TokenIf) => {
  if (tk.ctx?.joinedToSeparator) {
    return null;
  }
  return tk;
};

const toSeparatorToken = (tk: TokenIf, iterable?: Iterable<TokenIf>) => {
  if (skipJoined(tk) === null) {
    return null;
  }

  const it = iterable as LookaheadIterable<TokenIf>;
  let newTk = tk.setType('SEPARATOR_OP');

  let i = 1;
  let nextTk = it.ahead(i);
  while (isSeparator(nextTk!)) {
    nextTk!.ctx!.joinedToSeparator = true;
    i++;
    newTk = newTk.appendValue(nextTk!.value!);

    nextTk = it.ahead(i);
  }
  return newTk;
};

const AccumulateSeparators = {
  NEWLINE: skipJoined,
  NEWLINE_LIST: skipJoined,
  SEMICOLON: toSeparatorToken,
  AND: toSeparatorToken,
  OPERATOR: (tk: TokenIf, iterable?: Iterable<TokenIf>) => tk.value === '&' || tk.value === ';' ? toSeparatorToken(tk, iterable as LookaheadIterable<TokenIf>) : tk,
};

/*
 resolve a conflict in grammar by joining a separator_op and the
 separators after it into one separator_op token, so that the POSIX rules

 separator_op     : '&'
          | ';'
          ;
 separator       : separator_op
          | separator_op NEWLINE_LIST
          | NEWLINE_LIST

 are, in this grammar:

 separator : separator_op
          | NEWLINE_LIST
 */
const separator: LexerPhase = () =>
  compose<TokenIf>(
    filterNonNull,
    map(
      applyVisitor(AccumulateSeparators),
    ),
    lookahead.depth(10),
  );

export default separator;
