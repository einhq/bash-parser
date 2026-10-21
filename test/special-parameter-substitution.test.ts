import { assertEquals } from '@std/assert';
import bashParser from '../src/parse.ts';
import utils from './_utils.ts';

Deno.test('special parameter substitution', async (t) => {
  await t.step('parameter with use default value', () => {
    const result = bashParser('${other:-default_value}');

    utils.checkResults((result as any).commands[0].name, {
      type: 'Word',
      text: '${other:-default_value}',
      expansion: [{
        type: 'ParameterExpansion',
        parameter: 'other',
        word: {
          text: 'default_value',
          type: 'Word',
        },
        op: 'useDefaultValue',
        loc: {
          start: 0,
          end: 22,
        },
      }],
    });
  });

  await t.step('parameter with use default value if unset', () => {
    const result = bashParser('${other-default_value}');

    utils.checkResults((result as any).commands[0].name, {
      type: 'Word',
      text: '${other-default_value}',
      expansion: [{
        type: 'ParameterExpansion',
        parameter: 'other',
        word: {
          text: 'default_value',
          type: 'Word',
        },
        op: 'useDefaultValueIfUnset',
        loc: {
          start: 0,
          end: 21,
        },
      }],
    });
  });

  await t.step('parameter with string length', () => {
    const result = bashParser('${#default_value}');

    utils.checkResults((result as any).commands[0].name, {
      type: 'Word',
      text: '${#default_value}',
      expansion: [{
        type: 'ParameterExpansion',
        parameter: 'default_value',
        op: 'stringLength',
        loc: {
          start: 0,
          end: 16,
        },
      }],
    });
  });

  await t.step('parameter with assign default value', () => {
    const result = bashParser('${other:=default_value}');
    utils.checkResults((result as any).commands[0].name, {
      type: 'Word',
      text: '${other:=default_value}',
      expansion: [{
        type: 'ParameterExpansion',
        parameter: 'other',
        word: {
          text: 'default_value',
          type: 'Word',
        },
        op: 'assignDefaultValue',
        loc: {
          start: 0,
          end: 22,
        },
      }],
    });
  });

  await t.step('parameter with assign default value if unset', () => {
    const result = bashParser('${other=default_value}');
    utils.checkResults((result as any).commands[0].name, {
      type: 'Word',
      text: '${other=default_value}',
      expansion: [{
        type: 'ParameterExpansion',
        parameter: 'other',
        word: {
          text: 'default_value',
          type: 'Word',
        },
        op: 'assignDefaultValueIfUnset',
        loc: {
          start: 0,
          end: 21,
        },
      }],
    });
  });

  await t.step('parameter with other parameter in word', () => {
    const result = bashParser('${other:=default$value}');
    utils.checkResults(structuredClone((result as any).commands[0].name), {
      type: 'Word',
      text: '${other:=default$value}',
      expansion: [{
        type: 'ParameterExpansion',
        parameter: 'other',
        word: {
          text: 'default$value',
          expansion: [{
            type: 'ParameterExpansion',
            parameter: 'value',
            loc: {
              start: 7,
              end: 12,
            },
          }],
          type: 'Word',
        },
        op: 'assignDefaultValue',
        loc: {
          start: 0,
          end: 22,
        },
      }],
    });
  });

  await t.step('parameter with indicate error if null', () => {
    const result = bashParser('${other:?default_value}');
    utils.checkResults((result as any).commands[0].name, {
      text: '${other:?default_value}',
      type: 'Word',
      expansion: [{
        type: 'ParameterExpansion',
        parameter: 'other',
        word: {
          text: 'default_value',
          type: 'Word',
        },
        op: 'indicateErrorIfNull',
        loc: {
          start: 0,
          end: 22,
        },
      }],
    });
  });

  await t.step('parameter with indicate error if unset', () => {
    const result = bashParser('${other?default_value}');
    utils.checkResults((result as any).commands[0].name, {
      text: '${other?default_value}',
      type: 'Word',
      expansion: [{
        type: 'ParameterExpansion',
        parameter: 'other',
        word: {
          text: 'default_value',
          type: 'Word',
        },
        op: 'indicateErrorIfUnset',
        loc: {
          start: 0,
          end: 21,
        },
      }],
    });
  });

  await t.step('parameter with use alternative value', () => {
    const result = bashParser('${other:+default_value}');
    utils.checkResults((result as any).commands[0].name, {
      text: '${other:+default_value}',
      type: 'Word',
      expansion: [{
        type: 'ParameterExpansion',
        parameter: 'other',
        word: {
          text: 'default_value',
          type: 'Word',
        },
        op: 'useAlternativeValue',
        loc: {
          start: 0,
          end: 22,
        },
      }],
    });
  });

  await t.step('parameter with use alternative value if unset', () => {
    const result = bashParser('${other+default_value}');
    utils.checkResults((result as any).commands[0].name, {
      text: '${other+default_value}',
      type: 'Word',
      expansion: [{
        type: 'ParameterExpansion',
        parameter: 'other',
        word: {
          text: 'default_value',
          type: 'Word',
        },
        op: 'useAlternativeValueIfUnset',
        loc: {
          start: 0,
          end: 21,
        },
      }],
    });
  });

  await t.step('parameter with Remove Smallest Suffix Pattern', () => {
    const result = bashParser('${other%default$value}');
    utils.checkResults(structuredClone((result as any).commands[0].name), {
      type: 'Word',
      text: '${other%default$value}',
      expansion: [{
        type: 'ParameterExpansion',
        parameter: 'other',
        word: {
          text: 'default$value',
          expansion: [{
            type: 'ParameterExpansion',
            parameter: 'value',
            loc: {
              start: 7,
              end: 12,
            },
          }],
          type: 'Word',
        },
        op: 'removeSmallestSuffixPattern',
        loc: {
          start: 0,
          end: 21,
        },
      }],
    });
  });

  await t.step('parameter with Remove Smallest Prefix Pattern', () => {
    const result = bashParser('${other#default$value}');
    utils.checkResults(structuredClone((result as any).commands[0].name), {
      type: 'Word',
      text: '${other#default$value}',
      expansion: [{
        type: 'ParameterExpansion',
        parameter: 'other',
        word: {
          text: 'default$value',
          expansion: [{
            type: 'ParameterExpansion',
            parameter: 'value',
            loc: {
              start: 7,
              end: 12,
            },
          }],
          type: 'Word',
        },
        op: 'removeSmallestPrefixPattern',
        loc: {
          start: 0,
          end: 21,
        },
      }],
    });
  });

  await t.step('parameter with Remove Largest Suffix Pattern', () => {
    const result = bashParser('${other%%default$value}');
    utils.checkResults(structuredClone((result as any).commands[0].name), {
      type: 'Word',
      text: '${other%%default$value}',
      expansion: [{
        type: 'ParameterExpansion',
        parameter: 'other',
        word: {
          text: 'default$value',
          expansion: [{
            type: 'ParameterExpansion',
            parameter: 'value',
            loc: {
              start: 7,
              end: 12,
            },
          }],
          type: 'Word',
        },
        op: 'removeLargestSuffixPattern',
        loc: {
          start: 0,
          end: 22,
        },
      }],
    });
  });

  await t.step('parameter with Remove Largest Prefix Pattern', () => {
    const result = bashParser('${other##default$value}');
    utils.checkResults(structuredClone((result as any).commands[0].name), {
      type: 'Word',
      text: '${other##default$value}',
      expansion: [{
        type: 'ParameterExpansion',
        parameter: 'other',
        word: {
          text: 'default$value',
          expansion: [{
            type: 'ParameterExpansion',
            parameter: 'value',
            loc: {
              start: 7,
              end: 12,
            },
          }],
          type: 'Word',
        },
        op: 'removeLargestPrefixPattern',
        loc: {
          start: 0,
          end: 22,
        },
      }],
    });
  });
});

Deno.test('a word that is blank, empty or plain text', async (t) => {
  const wordOf = (source: string) => {
    const result = bashParser(source);

    // deno-lint-ignore no-explicit-any
    return (result as any).commands[0].name.expansion[0].word;
  };

  await t.step('an empty word is absent rather than a parse error', () => {
    // An empty word, `${x:-}`, is no word at all
    assertEquals(wordOf('${other:-}'), undefined);
    assertEquals(wordOf('${other:?}'), undefined);
  });

  await t.step('a word with blanks in it keeps all of it', () => {
    // The word is one word, blanks and all
    assertEquals(wordOf('${other:?must be set}'), { type: 'Word', text: 'must be set' });
    assertEquals(wordOf('${other:-a  b}'), { type: 'Word', text: 'a  b' });
  });

  await t.step('a word that expands still goes through the parser', () => {
    assertEquals((wordOf('${other:-a $B c}')).text, 'a $B c');
    assertEquals((wordOf('${other:-"a b"}')).text, 'a b');
  });
});
