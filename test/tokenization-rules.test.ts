import { assertEquals } from '@std/assert';
import type { LexerContext, LexerPhase } from '../src/lexer/types.ts';
import enums from '../src/modes/bash/enums/mod.ts';
import rules from '../src/modes/bash/phases/mod.ts';
import { mkToken, type TokenIf } from '../src/tokenizer/mod.ts';
import { fromArray } from './_utils.ts';

const check = (rule: LexerPhase, actual: TokenIf[], expected: TokenIf[]) => {
  const result = [];
  const it = rule({ enums } as LexerContext)(fromArray(actual));

  for (const tk of it) {
    result.push(tk);
  }

  assertEquals(
    JSON.stringify(
      result,
    ),
    JSON.stringify(expected),
  );
};

Deno.test('tokenization-rules', async (t) => {
  await t.step('operatorTokens - identify operator with their tokens', () => {
    check(rules.operatorTokens, [mkToken('OPERATOR', '<<')], [mkToken('DLESS', '<<')]);
  });

  await t.step('reservedWords - identify reserved words or WORD', () => {
    check(
      rules.reservedWords,
      [
        mkToken('TOKEN', 'while'),
        mkToken('TOKEN', 'otherWord'),
      ],
      [
        mkToken('While', 'while'),
        mkToken('WORD', 'otherWord'),
      ],
    );
  });

  await t.step('functionName - replace function name token as NAME', () => {
    const input = [
      mkToken('WORD', 'test', {
        ctx: { maybeStartOfSimpleCommand: true },
      }),
      mkToken('OPEN_PAREN', '('),
      mkToken('CLOSE_PAREN', ')'),
      mkToken('Lbrace', '{'),
      mkToken('WORD', 'body'),
      mkToken('WORD', 'foo'),
      mkToken('WORD', '--lol'),
      mkToken(';', ';'),
      mkToken('Rbrace', '}'),
    ];

    check(rules.functionName, input, [
      mkToken('NAME', 'test', {
        ctx: { maybeStartOfSimpleCommand: true },
      }),
      mkToken('OPEN_PAREN', '('),
      mkToken('CLOSE_PAREN', ')'),
      mkToken('Lbrace', '{'),
      mkToken('WORD', 'body'),
      mkToken('WORD', 'foo'),
      mkToken('WORD', '--lol'),
      mkToken(';', ';'),
      mkToken('Rbrace', '}'),
    ]);
  });
});
