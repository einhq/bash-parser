import bashParser from '../src/parse.ts';
import utils from './_utils.ts';

Deno.test('word-expansion-mode', async (t) => {
  await t.step('expand on a single word', () => {
    const result = bashParser('ls $var > res.txt', {
      mode: 'word-expansion',
    });

    utils.checkResults({
      type: 'Script',
      commands: [{
        type: 'Command',
        name: {
          type: 'Word',
          text: 'ls $var > res.txt',
          expansion: [{
            parameter: 'var',
            loc: {
              start: 3,
              end: 6,
            },
            type: 'ParameterExpansion',
          }],
        },
      }],
    }, result);
  });

  await t.step('handles empty input', () => {
    const result = bashParser('', {
      mode: 'word-expansion',
    });
    utils.checkResults({
      type: 'Script',
      commands: [],
    }, result);
  });

  await t.step('handles single quoted string', () => {
    const result = bashParser("'hello world'", {
      mode: 'word-expansion',
    });
    utils.checkResults({
      type: 'Script',
      commands: [{
        type: 'Command',
        name: {
          type: 'Word',
          text: 'hello world',
        },
      }],
    }, result);
  });

  await t.step('handles double quoted string with expansion', () => {
    const result = bashParser('"hello $var"', {
      mode: 'word-expansion',
    });
    // In word expansion mode, text includes quotes when unresolved
    // Just verify the expansion is present
    const name = (result as any).commands[0].name;
    utils.checkResults(name, {
      type: 'Word',
      text: '"hello $var"',
    });
    utils.checkResults(name.expansion[0], {
      parameter: 'var',
      type: 'ParameterExpansion',
    });
  });

  await t.step('handles backslash escaping', () => {
    const result = bashParser('hello\\ world', {
      mode: 'word-expansion',
    });
    utils.checkResults({
      type: 'Script',
      commands: [{
        type: 'Command',
        name: {
          type: 'Word',
          text: 'hello world',
        },
      }],
    }, result);
  });

  await t.step('handles line continuation (backslash newline)', () => {
    const result = bashParser('hello\\\nworld', {
      mode: 'word-expansion',
    });
    utils.checkResults({
      type: 'Script',
      commands: [{
        type: 'Command',
        name: {
          type: 'Word',
          text: 'helloworld',
        },
      }],
    }, result);
  });

  await t.step('handles backtick command substitution', () => {
    const result = bashParser('`echo hi`', {
      mode: 'word-expansion',
    });
    // Verify expansion is present
    const expansion = (result as any).commands[0].name.expansion[0];
    utils.checkResults(expansion, {
      command: 'echo hi',
      type: 'CommandExpansion',
    });
  });

  await t.step('handles dollar command substitution', () => {
    const result = bashParser('$(echo hi)', {
      mode: 'word-expansion',
    });
    // Verify expansion is present
    const expansion = (result as any).commands[0].name.expansion[0];
    utils.checkResults(expansion, {
      command: 'echo hi',
      type: 'CommandExpansion',
    });
  });

  await t.step('handles plain text', () => {
    // In word expansion mode, text without special chars is treated as a single word
    const result = bashParser('plaintext', {
      mode: 'word-expansion',
    });
    utils.checkResults({
      type: 'Script',
      commands: [{
        type: 'Command',
        name: {
          type: 'Word',
          text: 'plaintext',
        },
      }],
    }, result);
  });

  await t.step('handles arithmetic expansion', () => {
    const result = bashParser('$((1+2))', {
      mode: 'word-expansion',
    });
    // Verify expansion is present
    const expansion = (result as any).commands[0].name.expansion[0];
    utils.checkResults(expansion, {
      expression: '1+2',
      type: 'ArithmeticExpansion',
    });
  });
});
