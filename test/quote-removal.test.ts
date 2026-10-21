import { assertEquals } from '@std/assert';
import bashParser from '../src/parse.ts';
import { unquoteSingleWord } from '../src/utils/unquote-word.ts';
import utils from './_utils.ts';

Deno.test('quote-removal', async (t) => {
  await t.step('remove double quote from string', () => {
    const result = bashParser('"echo"');
    utils.checkResults((result as any).commands[0].name, {
      type: 'Word',
      text: 'echo',
    });
  });

  await t.step('remove single quotes from string', () => {
    const result = bashParser("'echo'");
    utils.checkResults((result as any).commands[0].name, {
      type: 'Word',
      text: 'echo',
    });
  });

  await t.step('remove unnecessary slashes from string', () => {
    const result = bashParser('ec\\%ho');
    utils.checkResults((result as any).commands[0].name, {
      type: 'Word',
      text: 'ec%ho',
    });
  });

  await t.step('not remove quotes from middle of string if escaped', () => {
    const result = bashParser('ec\\\'\\"ho');
    utils.checkResults((result as any).commands[0].name, {
      type: 'Word',
      text: 'ec\'"ho',
    });
  });

  await t.step('keep escaped characters literal, as bash does', () => {
    // Only $'…' decodes escape sequences; inside double quotes a backslash
    // before anything but " \ $ ` is a backslash
    const result = bashParser('"ec\\t\\nho"');
    utils.checkResults((result as any).commands[0].name, {
      type: 'Word',
      text: 'ec\\t\\nho',
    });
  });

  await t.step('not remove special characters', () => {
    const result = bashParser('"ec\tho"');
    utils.checkResults((result as any).commands[0].name, {
      type: 'Word',
      text: 'ec\tho',
    });
  });

  await t.step('single quotes are literal (no escape processing)', () => {
    // Bash single quotes are fully literal: backslash sequences must be preserved
    // verbatim, e.g. \1 must NOT become an octal control char.
    const backref = bashParser("echo 's/(a)/\\1/'");
    utils.checkResults((backref as any).commands[0].suffix[0], {
      type: 'Word',
      text: 's/(a)/\\1/',
    });

    const escapes = bashParser("echo 'a\\n\\t\\\\b'");
    utils.checkResults((escapes as any).commands[0].suffix[0], {
      type: 'Word',
      text: 'a\\n\\t\\\\b',
    });
  });

  await t.step('remove quotes from middle of string', () => {
    const result = bashParser("ec'h'o");
    utils.checkResults((result as any).commands[0].name, {
      type: 'Word',
      text: 'echo',
    });
  });

  await t.step('remove quotes on assignment', () => {
    const result = bashParser('echo="ciao mondo"');
    utils.checkResults((result as any).commands[0].prefix[0], {
      text: 'echo=ciao mondo',
      type: 'AssignmentWord',
    });
  });

  await t.step('remove quotes followed by single quotes', () => {
    const result = bashParser('echo"ciao"\'mondo\'');
    utils.checkResults((result as any).commands[0].name, {
      text: 'echociaomondo',
      type: 'Word',
    });
  });

  await t.step('remove single quotes followed by quotes', () => {
    const result = bashParser('echo\'ciao\'"mondo"');
    utils.checkResults((result as any).commands[0].name, {
      text: 'echociaomondo',
      type: 'Word',
    });
  });

  await t.step('handles empty quoted string', () => {
    const result = bashParser('echo ""');
    utils.checkResults((result as any).commands[0].suffix[0], {
      type: 'Word',
      text: '',
    });
  });

  await t.step('handles empty single quoted string', () => {
    const result = bashParser("echo ''");
    utils.checkResults((result as any).commands[0].suffix[0], {
      type: 'Word',
      text: '',
    });
  });

  await t.step('preserves quotes when expansion is unresolved', () => {
    const result = bashParser('"$var"');
    // When expansion is unresolved, quotes are preserved
    utils.checkResults((result as any).commands[0].name, {
      type: 'Word',
      text: '"$var"',
      expansion: [{
        parameter: 'var',
        type: 'ParameterExpansion',
      }],
    });
  });

  await t.step('handles nested quotes properly', () => {
    const result = bashParser('"outer\'inner\'outer"');
    utils.checkResults((result as any).commands[0].name, {
      type: 'Word',
      text: "outer'inner'outer",
    });
  });

  await t.step('handles single quote inside double quotes', () => {
    const result = bashParser('"it\'s"');
    utils.checkResults((result as any).commands[0].name, {
      type: 'Word',
      text: "it's",
    });
  });

  await t.step('handles escaped dollar in double quotes', () => {
    const result = bashParser('"foo\\$bar"');
    utils.checkResults((result as any).commands[0].name, {
      type: 'Word',
      text: 'foo$bar',
    });
  });

  await t.step('keeps a backslash-n sequence literal', () => {
    const result = bashParser('"line1\\nline2"');
    utils.checkResults((result as any).commands[0].name, {
      type: 'Word',
      text: 'line1\\nline2',
    });
  });

  await t.step("a newline comes from $'…' instead", () => {
    const result = bashParser("$'line1\\nline2'");
    utils.checkResults((result as any).commands[0].name, {
      type: 'Word',
      text: 'line1\nline2',
    });
  });

  await t.step('handles consecutive quoted sections', () => {
    const result = bashParser("'first''second'");
    utils.checkResults((result as any).commands[0].name, {
      type: 'Word',
      text: 'firstsecond',
    });
  });

  await t.step('handles mixed quote styles', () => {
    const result = bashParser('\'single\'"double"');
    utils.checkResults((result as any).commands[0].name, {
      type: 'Word',
      text: 'singledouble',
    });
  });

  await t.step('does not process non-WORD tokens', () => {
    const result = bashParser('echo hello');
    // The command name is a word, check it was processed
    utils.checkResults((result as any).commands[0].name, {
      type: 'Word',
      text: 'echo',
    });
  });
});

/**
 * Quote removal works on one word at a time: the tokenizer has already
 * delimited it, so it is not split again, and a `#` in it starts no comment.
 */
Deno.test('quote removal takes the word as one word', async (t) => {
  const wordsOf = (source: string): string[] => {
    const ast = bashParser(source);
    // deno-lint-ignore no-explicit-any
    const command = (ast as any).commands[0];

    // deno-lint-ignore no-explicit-any
    return [command.name.text, ...(command.suffix ?? []).map((w: any) => w.text)];
  };

  await t.step('a # inside a word is data, not a comment', () => {
    // A `#` inside a word is part of it
    assertEquals(wordsOf('echo a#b'), ['echo', 'a#b']);
    assertEquals(wordsOf('echo red=#fff'), ['echo', 'red=#fff']);
    assertEquals(wordsOf('echo "#tag"'), ['echo', '#tag']);
  });

  await t.step('a real comment is still one, because the tokenizer takes it', () => {
    assertEquals(wordsOf('echo a # b'), ['echo', 'a']);
    assertEquals(wordsOf('echo a #b'), ['echo', 'a']);
  });

  await t.step('unquoteSingleWord removes quotes and nothing else', () => {
    assertEquals(unquoteSingleWord('a"b c"d'), 'ab cd');
    assertEquals(unquoteSingleWord("'a b'"), 'a b');
    assertEquals(unquoteSingleWord('a\\ b'), 'a b');
    assertEquals(unquoteSingleWord("$'a\\tb'"), 'a\tb');
  });

  await t.step('unquoteSingleWord keeps blanks, metacharacters and #', () => {
    assertEquals(unquoteSingleWord('custom message'), 'custom message');
    assertEquals(unquoteSingleWord('a  b'), 'a  b');
    assertEquals(unquoteSingleWord('a>b|c;d'), 'a>b|c;d');
    assertEquals(unquoteSingleWord('a#b'), 'a#b');
  });
});

Deno.test('a word given to ${x:-…} keeps all of itself', async (t) => {
  const wordOf = (source: string) => {
    const result = bashParser(source);

    // deno-lint-ignore no-explicit-any
    return (result as any).commands[0].name.expansion[0].word;
  };

  await t.step('blanks, runs of blanks, and quotes inside it', () => {
    assertEquals((wordOf('${x:?must be set}')).text, 'must be set');
    assertEquals((wordOf('${x:-a  b}')).text, 'a  b');
    assertEquals((wordOf('${x:-a "b c" d}')).text, 'a b c d');
  });

  await t.step('metacharacters, which are not operators here', () => {
    assertEquals((wordOf('${x:-a>b}')).text, 'a>b');
    assertEquals((wordOf('${x:-a|b}')).text, 'a|b');
  });
});
