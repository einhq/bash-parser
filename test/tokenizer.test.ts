import { assert } from '@std/assert';
import operators from '../src/modes/bash/enums/operators.ts';
import reducers from '../src/modes/bash/reducers/mod.ts';
import { tokenize as delimiterTokanize } from '../src/tokenizer/mod.ts';
import utils, { toArray } from './_utils.ts';

const mkloc = ([startCol, startRow, startChar]: number[], [endCol, endRow, endChar]: number[]) => {
  return JSON.stringify({
    start: {
      col: startCol,
      row: startRow,
      char: startChar,
    },
    end: {
      col: endCol,
      row: endRow,
      char: endChar,
    },
  });
};

const tokenize = (text: string, keepLoc?: boolean) => {
  const tokenizer = delimiterTokanize(reducers, operators);
  const tokens = toArray(tokenizer(text));

  const results = tokens.map((t) => {
    const r: any = t;
    r[r.type] = r.value;
    delete r.ctx;
    delete r.type;
    delete r.value;

    if (keepLoc && t.loc) {
      r.loc = JSON.stringify(t.loc);
    } else {
      delete r.loc;
    }

    return r;
  });

  return results;
};

Deno.test('tokenize', async (t) => {
  await t.step('parse single operator', () => {
    const result = tokenize('<<');
    utils.checkResults(
      result,
      [
        { DLESS: '<<' },
        { EOF: '' },
      ],
    );
  });

  await t.step('parse word', () => {
    const result = tokenize('abc');
    utils.checkResults(
      result,
      [
        { TOKEN: 'abc' },
        { EOF: '' },
      ],
    );
  });

  await t.step('parse word followed by newline', () => {
    const result = tokenize('abc\n');
    utils.checkResults(
      result,
      [
        { TOKEN: 'abc' },
        { NEWLINE: '\n' },
        { EOF: '' },
      ],
    );
  });

  await t.step('parse invalid operator', () => {
    const result = tokenize('^');
    utils.checkResults(
      result,
      [
        { TOKEN: '^' },
        { EOF: '' },
      ],
    );
  });

  await t.step('emit EOF at end', () => {
    utils.checkResults(
      tokenize(''),
      [{ EOF: '' }],
    );
  });

  await t.step('parse new lines', () => {
    utils.checkResults(
      tokenize('\n'),
      [
        { NEWLINE: '\n' },
        { EOF: '' },
      ],
    );
  });

  await t.step('operator breaks words', () => {
    utils.checkResults(
      tokenize('e<'),
      [
        { TOKEN: 'e' },
        { LESS: '<' },
        { EOF: '' },
      ],
    );
  });

  await t.step('double breaks', () => {
    utils.checkResults(
      tokenize('echo>ciao'),
      [
        { TOKEN: 'echo' },
        { GREAT: '>' },
        { TOKEN: 'ciao' },
        { EOF: '' },
      ],
    );
  });

  await t.step('word breaks operators', () => {
    utils.checkResults(
      tokenize('<e'),
      [
        { LESS: '<' },
        { TOKEN: 'e' },
        { EOF: '' },
      ],
    );
  });

  await t.step('parse two operators on two lines', () => {
    utils.checkResults(
      tokenize('<<\n>>'),
      [
        { DLESS: '<<' },
        { NEWLINE: '\n' },
        { DGREAT: '>>' },
        { EOF: '' },
      ],
    );
  });

  await t.step('parse two operators on one line', () => {
    utils.checkResults(
      tokenize('<< >>'),
      [
        { DLESS: '<<' },
        { DGREAT: '>>' },
        { EOF: '' },
      ],
    );
  });

  await t.step('parse two tokens', () => {
    utils.checkResults(
      tokenize('echo 42'),
      [
        { TOKEN: 'echo' },
        { TOKEN: '42' },
        { EOF: '' },
      ],
    );
  });

  await t.step('parse two tokens on two lines', () => {
    utils.checkResults(
      tokenize('echo\n42'),
      [
        { TOKEN: 'echo' },
        { NEWLINE: '\n' },
        { TOKEN: '42' },
        { EOF: '' },
      ],
    );
  });

  await t.step('keep multiple newlines', () => {
    const result = tokenize('echo\n\n\n42');
    utils.checkResults(
      result,
      [
        { TOKEN: 'echo' },
        { NEWLINE: '\n' },
        { NEWLINE: '\n' },
        { NEWLINE: '\n' },
        { TOKEN: '42' },
        { EOF: '' },
      ],
    );
  });

  await t.step('support escaping chars', () => {
    utils.checkResults(
      tokenize('echo\\<'),
      [
        { TOKEN: 'echo\\<' },
        { EOF: '' },
      ],
    );
  });

  await t.step('character escaping is resetted on each char', () => {
    utils.checkResults(
      tokenize('echo\\<<'),
      [
        { TOKEN: 'echo\\<' },
        { LESS: '<' },
        { EOF: '' },
      ],
    );
  });

  await t.step('support quoting with single', () => {
    const result = tokenize("echo '< world >' other");

    utils.checkResults(
      result,
      [
        { TOKEN: 'echo' },
        { TOKEN: "'< world >'" },
        { TOKEN: 'other' },
        { EOF: '' },
      ],
    );
  });

  await t.step('in single quote escaping single quotes is not working', () => {
    const result = tokenize("'\\''");

    utils.checkResults(
      result,
      [
        { TOKEN: "'\\''" },
        { CONTINUE: "'" },
      ],
    );
  });

  await t.step('single quote does not break words', () => {
    const result = tokenize("a'b'c");

    utils.checkResults(
      result,
      [
        { TOKEN: "a'b'c" },
        { EOF: '' },
      ],
    );
  });

  await t.step('support quoting with double', () => {
    utils.checkResults(
      tokenize('echo "< world >" other'),
      [
        { TOKEN: 'echo' },
        { TOKEN: '"< world >"' },
        { TOKEN: 'other' },
        { EOF: '' },
      ],
    );
  });

  await t.step('escaped double quotes within double quotes', () => {
    const result = tokenize('echo "TEST1 \\"TEST2" ucci ucci');
    utils.checkResults(
      result,
      [
        { TOKEN: 'echo' },
        { TOKEN: '"TEST1 \\"TEST2"' },
        { TOKEN: 'ucci' },
        { TOKEN: 'ucci' },
        { EOF: '' },
      ],
    );
  });

  await t.step('escaped escape double quotes within double quotes', () => {
    const result = tokenize('echo "TEST1 \\\\" TEST2 " u i"');
    utils.checkResults(
      result,
      [
        { TOKEN: 'echo' },
        { TOKEN: '"TEST1 \\\\"' },
        { TOKEN: 'TEST2' },
        { TOKEN: '" u i"' },
        { EOF: '' },
      ],
    );
  });

  await t.step('parse loc', () => {
    const result = tokenize('abc', true);
    utils.checkResults(
      result,
      [
        { TOKEN: 'abc', loc: mkloc([1, 1, 0], [3, 1, 2]) },
        { EOF: '' },
      ],
    );
  });

  await t.step('reset start loc on each token', () => {
    const result = tokenize('abc def', true);
    utils.checkResults(
      result,
      [
        { TOKEN: 'abc', loc: mkloc([1, 1, 0], [3, 1, 2]) },
        { TOKEN: 'def', loc: mkloc([5, 1, 4], [7, 1, 6]) },
        { EOF: '' },
      ],
    );
  });

  await t.step('loc on operators', () => {
    const result = tokenize('< <<', true);
    utils.checkResults(
      result,
      [
        { LESS: '<', loc: mkloc([1, 1, 0], [1, 1, 0]) },
        { DLESS: '<<', loc: mkloc([3, 1, 2], [4, 1, 3]) },
        { EOF: '' },
      ],
    );
  });

  await t.step('loc on newlines', () => {
    const result = tokenize('<\n<<', true);
    utils.checkResults(
      result,
      [
        { LESS: '<', loc: mkloc([1, 1, 0], [1, 1, 0]) },
        { NEWLINE: '\n' },
        { DLESS: '<<', loc: mkloc([1, 2, 2], [2, 2, 3]) },
        { EOF: '' },
      ],
    );
  });

  await t.step('loc on line continuations', () => {
    const result = tokenize('a\\\nbc', true);

    utils.checkResults(
      result,
      [
        { TOKEN: 'abc', loc: mkloc([1, 1, 0], [2, 2, 4]) },
        { EOF: '' },
      ],
    );
  });

  await t.step('parse parameter expansion', () => {
    const result = tokenize('a$b-c');

    const expansion = [{
      type: 'ParameterExpansion',
      loc: { start: 1, end: 2 },
      parameter: 'b',
    }];

    utils.checkResults(
      result,
      [
        { TOKEN: 'a$b-c', expansion },
        { EOF: '' },
      ],
    );
  });

  await t.step('parse special parameter expansion', () => {
    const result = tokenize('a$@cd');
    const expansion = [{
      type: 'ParameterExpansion',
      loc: { start: 1, end: 2 },
      parameter: '@',
    }];
    utils.checkResults(
      result,
      [
        { TOKEN: 'a$@cd', expansion },
        { EOF: '' },
      ],
    );
  });

  await t.step('parse extended parameter expansion', () => {
    const result = tokenize('a${b}cd');
    const expansion = [{
      type: 'ParameterExpansion',
      loc: { start: 1, end: 4 },
      parameter: 'b',
    }];
    utils.checkResults(
      result,
      [
        { TOKEN: 'a${b}cd', expansion },
        { EOF: '' },
      ],
    );
  });

  await t.step('parse command expansion', () => {
    const result = tokenize('a$(b)cd');
    const expansion = [{
      type: 'CommandExpansion',
      loc: { start: 1, end: 4 },
      command: 'b',
    }];
    utils.checkResults(
      result,
      [
        { TOKEN: 'a$(b)cd', expansion },
        { EOF: '' },
      ],
    );
  });

  await t.step('parse command with backticks', () => {
    const result = tokenize('a`b`cd');
    const expansion = [{
      type: 'CommandExpansion',
      loc: { start: 1, end: 3 },
      command: 'b',
    }];
    utils.checkResults(
      result,
      [
        { TOKEN: 'a`b`cd', expansion },
        { EOF: '' },
      ],
    );
  });

  await t.step('parse arithmetic expansion', () => {
    const result = tokenize('a$((b))cd');
    const expansion = [{
      type: 'ArithmeticExpansion',
      loc: { start: 1, end: 6 },
      expression: 'b',
    }];
    utils.checkResults(
      result,
      [
        { TOKEN: 'a$((b))cd', expansion },
        { EOF: '' },
      ],
    );
  });

  await t.step('within double quotes parse parameter expansion', () => {
    const result = tokenize('"a$b-c"');
    const expansion = [{
      type: 'ParameterExpansion',
      loc: { start: 2, end: 3 },
      parameter: 'b',
    }];

    utils.checkResults(
      result,
      [
        { TOKEN: '"a$b-c"', expansion },
        { EOF: '' },
      ],
    );
  });

  await t.step('within double quotes parse special parameter expansion', () => {
    const result = tokenize('"a$@cd"');
    const expansion = [{
      type: 'ParameterExpansion',
      loc: { start: 2, end: 3 },
      parameter: '@',
    }];
    utils.checkResults(
      result,
      [
        { TOKEN: '"a$@cd"', expansion },
        { EOF: '' },
      ],
    );
  });

  await t.step('within double quotes parse extended parameter expansion', () => {
    const result = tokenize('"a${b}cd"');
    const expansion = [{
      type: 'ParameterExpansion',
      loc: { start: 2, end: 5 },
      parameter: 'b',
    }];
    utils.checkResults(
      result,
      [
        { TOKEN: '"a${b}cd"', expansion },
        { EOF: '' },
      ],
    );
  });

  await t.step('within double quotes parse command expansion', () => {
    const result = tokenize('"a$(b)cd"');
    const expansion = [{
      type: 'CommandExpansion',
      loc: { start: 2, end: 5 },
      command: 'b',
    }];
    utils.checkResults(
      result,
      [
        { TOKEN: '"a$(b)cd"', expansion },
        { EOF: '' },
      ],
    );
  });

  await t.step('within double quotes parse command with backticks', () => {
    const result = tokenize('"a`b`cd"');
    const expansion = [{
      type: 'CommandExpansion',
      loc: { start: 2, end: 4 },
      command: 'b',
    }];

    utils.checkResults(
      result,
      [
        { TOKEN: '"a`b`cd"', expansion },
        { EOF: '' },
      ],
    );
  });

  await t.step('within double quotes parse arithmetic expansion', () => {
    const result = tokenize('"a$((b))cd"');
    const expansion = [{
      type: 'ArithmeticExpansion',
      loc: { start: 2, end: 7 },
      expression: 'b',
    }];
    utils.checkResults(
      result,
      [
        { TOKEN: '"a$((b))cd"', expansion },
        { EOF: '' },
      ],
    );
  });
});

Deno.test('tokenizing takes time linear in the length of the input', () => {
  // 180 KB of operators, quotes and expansions: read in linear time it takes a fraction of a
  // second, where time quadratic in its length would take tens of seconds
  const block = (i: number) => `if [ -f /tmp/f${i} ]; then\n  echo "line ${i}" | grep -q l && n=$((n + 1))\nfi\n`;
  const text = Array.from({ length: 2400 }, (_, i) => block(i)).join('');
  const tokenizer = delimiterTokanize(reducers, operators);
  const started = performance.now();

  toArray(tokenizer(text));

  const elapsed = performance.now() - started;
  assert(elapsed < 3000, `${text.length} characters took ${Math.round(elapsed)} ms to tokenize`);
});
