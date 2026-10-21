import { assertEquals } from '@std/assert';
import { applyVisitor } from '../src/tokenizer/apply-visitor.ts';
import { mkToken } from '../src/tokenizer/token.ts';
import type { TokenIf } from '../src/tokenizer/types.ts';

Deno.test('applyVisitor', async (t) => {
  await t.step('applies visitor method for matching token type', () => {
    const visitor = {
      // deno-lint-ignore no-explicit-any
      WORD(tk: any) {
        return tk.setType('MODIFIED_WORD');
      },
    };

    const apply = applyVisitor(visitor);
    const token = mkToken('WORD', 'hello');
    const iterable = [token];

    const result = apply(token, 0, iterable) as TokenIf;
    assertEquals(result.type, 'MODIFIED_WORD');
  });

  await t.step('returns token unchanged when no matching visitor method', () => {
    const visitor = {
      // deno-lint-ignore no-explicit-any
      WORD(tk: any) {
        return tk.setType('MODIFIED');
      },
    };

    const apply = applyVisitor(visitor);
    const token = mkToken('NUMBER', '42');
    const iterable = [token];

    const result = apply(token, 0, iterable) as TokenIf;
    assertEquals(result.type, 'NUMBER');
    assertEquals(result.value, '42');
  });

  await t.step('calls defaultMethod when token type not in visitor', () => {
    const visitor = {
      // deno-lint-ignore no-explicit-any
      defaultMethod(tk: any) {
        return tk.setType('DEFAULT_HANDLED');
      },
    };

    const apply = applyVisitor(visitor);
    const token = mkToken('UNKNOWN', 'test');
    const iterable = [token];

    const result = apply(token, 0, iterable) as TokenIf;
    assertEquals(result.type, 'DEFAULT_HANDLED');
  });

  await t.step('specific method takes precedence over defaultMethod', () => {
    const visitor = {
      // deno-lint-ignore no-explicit-any
      WORD(tk: any) {
        return tk.setType('SPECIFIC');
      },
      // deno-lint-ignore no-explicit-any
      defaultMethod(tk: any) {
        return tk.setType('DEFAULT');
      },
    };

    const apply = applyVisitor(visitor);
    const token = mkToken('WORD', 'hello');
    const iterable = [token];

    const result = apply(token, 0, iterable) as TokenIf;
    assertEquals(result.type, 'SPECIFIC');
  });

  await t.step('visitor can modify token value', () => {
    const visitor = {
      // deno-lint-ignore no-explicit-any
      WORD(tk: any) {
        return tk.setValue('modified');
      },
    };

    const apply = applyVisitor(visitor);
    const token = mkToken('WORD', 'original');
    const iterable = [token];

    const result = apply(token, 0, iterable) as TokenIf;
    assertEquals(result.value, 'modified');
  });

  await t.step('visitor receives iterable for lookahead', () => {
    // deno-lint-ignore no-explicit-any
    let receivedIterable: any = null;

    const visitor = {
      // deno-lint-ignore no-explicit-any
      WORD(tk: any, iterable: any) {
        receivedIterable = iterable;
        return tk;
      },
    };

    const apply = applyVisitor(visitor);
    const token = mkToken('WORD', 'hello');
    const iterable = [token];

    apply(token, 0, iterable);
    assertEquals(receivedIterable !== null, true);
  });

  await t.step('empty visitor returns token unchanged', () => {
    const visitor = {};

    const apply = applyVisitor(visitor);
    const token = mkToken('WORD', 'hello');
    const iterable = [token];

    const result = apply(token, 0, iterable) as TokenIf;
    assertEquals(result.type, 'WORD');
    assertEquals(result.value, 'hello');
  });
});
