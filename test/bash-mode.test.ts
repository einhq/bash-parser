import bashParser from '../src/parse.ts';
import utils from './_utils.ts';

Deno.test('bash-mode', async (t) => {
  await t.step('alias on reserved word', () => {
    const result = bashParser('if world', {
      mode: 'bash',
      resolveAlias: (name) => {
        return name === 'if' ? 'echo' : undefined;
      },
    });
    utils.checkResults(result, {
      type: 'Script',
      commands: [{
        type: 'Command',
        name: { type: 'Word', text: 'echo' },
        suffix: [{ type: 'Word', text: 'world' }],
      }],
    });
  });

  await t.step('parameter substitution with Substring Expansion', () => {
    const result = bashParser('echo ${text:2:4}', { mode: 'bash' });

    utils.checkResults((result as any).commands[0].suffix[0].expansion[0], {
      loc: {
        start: 0,
        end: 10,
      },
      parameter: 'text',
      type: 'ParameterExpansion',
      op: 'substring',
      offset: 2,
      length: 4,
    });
  });

  await t.step('parameter substitution with prefix', () => {
    const result = bashParser('echo ${!text*}', { mode: 'bash' });
    utils.checkResults((result as any).commands[0].suffix[0].expansion[0], {
      loc: {
        start: 0,
        end: 8,
      },
      type: 'ParameterExpansion',
      op: 'prefix',
      prefix: 'text',
      expandWords: false,
    });
  });

  await t.step('parameter substitution with prefix and word expansion', () => {
    const result = bashParser('echo ${!text@}', { mode: 'bash' });

    utils.checkResults((result as any).commands[0].suffix[0].expansion[0], {
      loc: {
        start: 0,
        end: 8,
      },
      prefix: 'text',
      type: 'ParameterExpansion',
      op: 'prefix',
      expandWords: true,
    });
  });

  await t.step('parameter substitution: length is optional', () => {
    const result = bashParser('echo ${text:2}', { mode: 'bash' });

    utils.checkResults((result as any).commands[0].suffix[0].expansion[0], {
      loc: {
        start: 0,
        end: 8,
      },
      parameter: 'text',
      type: 'ParameterExpansion',
      op: 'substring',
      offset: 2,
    });
  });

  await t.step('parameter substitution with string replacement', () => {
    const result = bashParser('echo ${var/a/b}', { mode: 'bash' });
    utils.checkResults((result as any).commands[0].suffix[0].expansion[0], {
      loc: {
        start: 0,
        end: 9,
      },
      type: 'ParameterExpansion',
      op: 'stringReplace',
      parameter: 'var',
      substitute: 'a',
      replace: 'b',
      globally: false,
    });
  });

  await t.step('parameter substitution with string replacement - globally', () => {
    const result = bashParser('echo ${var//a/b}', { mode: 'bash' });
    utils.checkResults((result as any).commands[0].suffix[0].expansion[0], {
      loc: {
        start: 0,
        end: 10,
      },
      type: 'ParameterExpansion',
      op: 'stringReplace',
      parameter: 'var',
      substitute: 'a',
      replace: 'b',
      globally: true,
    });
  });

  await t.step('parameter substitution with array indices', () => {
    const result = bashParser('echo ${!text[*]}', { mode: 'bash' });

    utils.checkResults((result as any).commands[0].suffix[0].expansion[0], {
      loc: {
        start: 0,
        end: 10,
      },
      type: 'ParameterExpansion',
      op: 'arrayIndices',
      parameter: 'text',
      expandWords: false,
    });
  });

  await t.step('parameter substitution with array indices and word expansion', () => {
    const result = bashParser('echo ${!text[@]}', { mode: 'bash' });

    utils.checkResults((result as any).commands[0].suffix[0].expansion[0], {
      loc: {
        start: 0,
        end: 10,
      },
      parameter: 'text',
      type: 'ParameterExpansion',
      op: 'arrayIndices',
      expandWords: true,
    });
  });

  await t.step('parameter substitution with case change upper case and pattern', () => {
    const result = bashParser('echo ${text^t}', { mode: 'bash' });

    utils.checkResults((result as any).commands[0].suffix[0].expansion[0], {
      loc: {
        start: 0,
        end: 8,
      },
      parameter: 'text',
      pattern: 't',
      type: 'ParameterExpansion',
      op: 'caseChange',
      case: 'upper',
      globally: false,
    });
  });

  await t.step('parameter substitution with case change upper case globally and pattern', () => {
    const result = bashParser('echo ${text^^t}', { mode: 'bash' });

    utils.checkResults((result as any).commands[0].suffix[0].expansion[0], {
      loc: {
        start: 0,
        end: 9,
      },
      parameter: 'text',
      pattern: 't',
      type: 'ParameterExpansion',
      op: 'caseChange',
      case: 'upper',
      globally: true,
    });
  });

  await t.step('parameter substitution with case change lower case and pattern', () => {
    const result = bashParser('echo ${text,t}', { mode: 'bash' });

    utils.checkResults((result as any).commands[0].suffix[0].expansion[0], {
      loc: {
        start: 0,
        end: 8,
      },
      parameter: 'text',
      pattern: 't',
      type: 'ParameterExpansion',
      op: 'caseChange',
      case: 'lower',
      globally: false,
    });
  });

  await t.step('parameter substitution with case change lower case globally and pattern', () => {
    const result = bashParser('echo ${text,,t}', { mode: 'bash' });

    utils.checkResults((result as any).commands[0].suffix[0].expansion[0], {
      loc: {
        start: 0,
        end: 9,
      },
      parameter: 'text',
      pattern: 't',
      type: 'ParameterExpansion',
      op: 'caseChange',
      case: 'lower',
      globally: true,
    });
  });

  await t.step('parameter substitution with case change upper case and default pattern', () => {
    const result = bashParser('echo ${text^}', { mode: 'bash' });
    utils.checkResults((result as any).commands[0].suffix[0].expansion[0], {
      loc: {
        start: 0,
        end: 7,
      },
      parameter: 'text',
      pattern: '?',
      type: 'ParameterExpansion',
      op: 'caseChange',
      case: 'upper',
      globally: false,
    });
  });

  await t.step('parameter substitution with case change upper case globally and default pattern', () => {
    const result = bashParser('echo ${text^^}', { mode: 'bash' });

    utils.checkResults((result as any).commands[0].suffix[0].expansion[0], {
      loc: {
        start: 0,
        end: 8,
      },
      parameter: 'text',
      pattern: '?',
      type: 'ParameterExpansion',
      op: 'caseChange',
      case: 'upper',
      globally: true,
    });
  });

  await t.step('parameter substitution with case change lower case and default pattern', () => {
    const result = bashParser('echo ${text,}', { mode: 'bash' });

    utils.checkResults((result as any).commands[0].suffix[0].expansion[0], {
      loc: {
        start: 0,
        end: 7,
      },
      parameter: 'text',
      pattern: '?',
      type: 'ParameterExpansion',
      op: 'caseChange',
      case: 'lower',
      globally: false,
    });
  });

  await t.step('parameter substitution with case change lower case globally and default pattern', () => {
    const result = bashParser('echo ${text,,}', { mode: 'bash' });
    utils.checkResults((result as any).commands[0].suffix[0].expansion[0], {
      loc: {
        start: 0,
        end: 8,
      },
      parameter: 'text',
      pattern: '?',
      type: 'ParameterExpansion',
      op: 'caseChange',
      case: 'lower',
      globally: true,
    });
  });

  await t.step('parameter substitution with transformation:quoted', () => {
    const result = bashParser('echo ${text@Q}', { mode: 'bash' });
    utils.checkResults((result as any).commands[0].suffix[0].expansion[0], {
      loc: {
        start: 0,
        end: 8,
      },
      parameter: 'text',
      type: 'ParameterExpansion',
      op: 'transformation',
      kind: 'quoted',
    });
  });

  await t.step('parameter substitution with transformation:escape', () => {
    const result = bashParser('echo ${text@E}', { mode: 'bash' });
    utils.checkResults((result as any).commands[0].suffix[0].expansion[0], {
      loc: {
        start: 0,
        end: 8,
      },
      parameter: 'text',
      type: 'ParameterExpansion',
      op: 'transformation',
      kind: 'escape',
    });
  });

  await t.step('parameter substitution with transformation:prompt', () => {
    const result = bashParser('echo ${text@P}', { mode: 'bash' });
    utils.checkResults((result as any).commands[0].suffix[0].expansion[0], {
      loc: {
        start: 0,
        end: 8,
      },
      parameter: 'text',
      type: 'ParameterExpansion',
      op: 'transformation',
      kind: 'prompt',
    });
  });

  await t.step('parameter substitution with transformation:assignment', () => {
    const result = bashParser('echo ${text@A}', { mode: 'bash' });
    utils.checkResults((result as any).commands[0].suffix[0].expansion[0], {
      loc: {
        start: 0,
        end: 8,
      },
      parameter: 'text',
      type: 'ParameterExpansion',
      op: 'transformation',
      kind: 'assignment',
    });
  });

  await t.step('parameter substitution with transformation:flags', () => {
    const result = bashParser('echo ${text@a}', { mode: 'bash' });

    utils.checkResults((result as any).commands[0].suffix[0].expansion[0], {
      loc: {
        start: 0,
        end: 8,
      },
      parameter: 'text',
      type: 'ParameterExpansion',
      op: 'transformation',
      kind: 'flags',
    });
  });

  await t.step('parameter substitution with indirection', () => {
    const result = bashParser('echo ${!text}', { mode: 'bash' });

    utils.checkResults((result as any).commands[0].suffix[0].expansion[0], {
      loc: {
        start: 0,
        end: 7,
      },
      word: 'text',
      type: 'ParameterExpansion',
      op: 'indirection',
    });
  });
});
