import { assertEquals } from '@std/assert';
import operatorTokens from '../src/modes/bash/phases/operator-tokens.ts';
import { mkToken } from '../src/tokenizer/token.ts';
import operators from '../src/modes/bash/enums/operators.ts';
import { toArray } from './_utils.ts';

Deno.test('operator-tokens phase', async (t) => {
  const ctx = {
    enums: {
      operators,
    },
  } as any;

  const phase = operatorTokens(ctx);

  await t.step('converts & operator to AND', () => {
    const tokens = [mkToken('OPERATOR', '&')];
    const result = toArray(phase(tokens));
    assertEquals(result[0].type, 'AND');
  });

  await t.step('converts | operator to PIPE', () => {
    const tokens = [mkToken('OPERATOR', '|')];
    const result = toArray(phase(tokens));
    assertEquals(result[0].type, 'PIPE');
  });

  await t.step('converts (( operator to DOUBLE_OPEN_PAREN', () => {
    const tokens = [mkToken('OPERATOR', '((')];
    const result = toArray(phase(tokens));
    assertEquals(result[0].type, 'DOUBLE_OPEN_PAREN');
  });

  await t.step('converts )) operator to DOUBLE_CLOSE_PAREN', () => {
    const tokens = [mkToken('OPERATOR', '))')];
    const result = toArray(phase(tokens));
    assertEquals(result[0].type, 'DOUBLE_CLOSE_PAREN');
  });

  await t.step('converts ( operator to OPEN_PAREN', () => {
    const tokens = [mkToken('OPERATOR', '(')];
    const result = toArray(phase(tokens));
    assertEquals(result[0].type, 'OPEN_PAREN');
  });

  await t.step('converts ) operator to CLOSE_PAREN', () => {
    const tokens = [mkToken('OPERATOR', ')')];
    const result = toArray(phase(tokens));
    assertEquals(result[0].type, 'CLOSE_PAREN');
  });

  await t.step('converts > operator to GREAT', () => {
    const tokens = [mkToken('OPERATOR', '>')];
    const result = toArray(phase(tokens));
    assertEquals(result[0].type, 'GREAT');
  });

  await t.step('converts < operator to LESS', () => {
    const tokens = [mkToken('OPERATOR', '<')];
    const result = toArray(phase(tokens));
    assertEquals(result[0].type, 'LESS');
  });

  await t.step('converts && operator to AND_IF', () => {
    const tokens = [mkToken('OPERATOR', '&&')];
    const result = toArray(phase(tokens));
    assertEquals(result[0].type, 'AND_IF');
  });

  await t.step('converts || operator to OR_IF', () => {
    const tokens = [mkToken('OPERATOR', '||')];
    const result = toArray(phase(tokens));
    assertEquals(result[0].type, 'OR_IF');
  });

  await t.step('converts ;; operator to DSEMI', () => {
    const tokens = [mkToken('OPERATOR', ';;')];
    const result = toArray(phase(tokens));
    assertEquals(result[0].type, 'DSEMI');
  });

  await t.step('converts << operator to DLESS', () => {
    const tokens = [mkToken('OPERATOR', '<<')];
    const result = toArray(phase(tokens));
    assertEquals(result[0].type, 'DLESS');
  });

  await t.step('converts >> operator to DGREAT', () => {
    const tokens = [mkToken('OPERATOR', '>>')];
    const result = toArray(phase(tokens));
    assertEquals(result[0].type, 'DGREAT');
  });

  await t.step('converts <& operator to LESSAND', () => {
    const tokens = [mkToken('OPERATOR', '<&')];
    const result = toArray(phase(tokens));
    assertEquals(result[0].type, 'LESSAND');
  });

  await t.step('converts >& operator to GREATAND', () => {
    const tokens = [mkToken('OPERATOR', '>&')];
    const result = toArray(phase(tokens));
    assertEquals(result[0].type, 'GREATAND');
  });

  await t.step('converts <> operator to LESSGREAT', () => {
    const tokens = [mkToken('OPERATOR', '<>')];
    const result = toArray(phase(tokens));
    assertEquals(result[0].type, 'LESSGREAT');
  });

  await t.step('converts <<- operator to DLESSDASH', () => {
    const tokens = [mkToken('OPERATOR', '<<-')];
    const result = toArray(phase(tokens));
    assertEquals(result[0].type, 'DLESSDASH');
  });

  await t.step('converts >| operator to CLOBBER', () => {
    const tokens = [mkToken('OPERATOR', '>|')];
    const result = toArray(phase(tokens));
    assertEquals(result[0].type, 'CLOBBER');
  });

  await t.step('converts ; operator to SEMICOLON', () => {
    const tokens = [mkToken('OPERATOR', ';')];
    const result = toArray(phase(tokens));
    assertEquals(result[0].type, 'SEMICOLON');
  });

  await t.step('leaves non-OPERATOR tokens unchanged', () => {
    const tokens = [mkToken('WORD', 'hello')];
    const result = toArray(phase(tokens));
    assertEquals(result[0].type, 'WORD');
    assertEquals(result[0].value, 'hello');
  });

  await t.step('leaves OPERATOR with unknown value unchanged', () => {
    const tokens = [mkToken('OPERATOR', 'unknown')];
    const result = toArray(phase(tokens));
    assertEquals(result[0].type, 'OPERATOR');
    assertEquals(result[0].value, 'unknown');
  });

  await t.step('processes multiple tokens', () => {
    const tokens = [
      mkToken('OPERATOR', '|'),
      mkToken('WORD', 'grep'),
      mkToken('OPERATOR', '>'),
    ];
    const result = toArray(phase(tokens));
    assertEquals(result[0].type, 'PIPE');
    assertEquals(result[1].type, 'WORD');
    assertEquals(result[2].type, 'GREAT');
  });
});
