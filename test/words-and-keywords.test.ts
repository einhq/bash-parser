import { assertEquals } from '@std/assert';
import bashParser from '../src/parse.ts';
import { ARRAY_ELEMENT_SEPARATOR } from '../src/utils/assignment.ts';

const words = (source: string) => (((bashParser(source)).commands[0] as any).suffix as { text: string }[]).map((w) => w.text);

Deno.test('the function keyword', async (t) => {
  for (const source of ['function f { echo a; }', 'function f() { echo a; }', 'function f\n{ echo a; }', 'f() { echo a; }']) {
    await t.step(JSON.stringify(source), () => {
      const command = (bashParser(source)).commands[0] as any;
      assertEquals(command.type, 'Function');
      assertEquals(command.name.text, 'f');
    });
  }

  await t.step('a name bash allows only after the keyword', () => {
    assertEquals(((bashParser('function foo-bar { :; }')).commands[0] as any).name.text, 'foo-bar');
  });

  await t.step('as an argument it is a word', () => {
    assertEquals(words('echo function x'), ['function', 'x']);
  });
});

Deno.test('braces as words', async (t) => {
  await t.step('} closes a group only where a command could start', () => {
    assertEquals(words('echo { }'), ['{', '}']);
    assertEquals(words('echo }'), ['}']);
  });

  await t.step('groups still close', () => {
    for (const source of ['{ echo a; }', '{ echo a\n}', '{ if true; then :; fi }', 'f() { (echo a) }']) {
      bashParser(source);
    }
  });
});

Deno.test('where a parameter expansion ends', async (t) => {
  await t.step('a quoted } or one in a substitution does not end it', () => {
    assertEquals(words('echo ${HOME-"}"}'), ['${HOME-"}"}']);
    assertEquals(words('echo ${x:-$(echo })}'), ['${x:-$(echo })}']);
  });

  await t.step('plain braces do not pair, as in bash', () => {
    assertEquals(words('echo ${a:-G { I } K }'), ['${a:-G { I }', 'K', '}']);
  });
});

Deno.test('case item terminators', () => {
  const result = bashParser('case x in a) ;; b) ;& c) ;;& d) esac');
  const items = (result.commands[0] as any).cases as { terminator?: string }[];
  assertEquals(items.map((item) => item.terminator), [undefined, ';&', ';;&', undefined]);
});

Deno.test('grammar bash allows beyond POSIX', async (t) => {
  const first = (source: string) => (bashParser(source)).commands[0] as any;

  await t.step('select, with and without in', () => {
    assertEquals((first('select i in a b; do echo; done')).type, 'Select');
    assertEquals((first('select i; do echo; done')).wordlist, undefined);
  });

  await t.step('for name; do', () => {
    assertEquals((first('for i; do echo; done')).type, 'For');
  });

  await t.step('(( )), a reserved word after )), a { } body for for (( ))', () => {
    assertEquals((first('(( ))')).type, 'ArithmeticCommand');
    assertEquals((first('if ((1)) then ((2)) fi')).type, 'If');
    assertEquals((first('for ((i=0; i<3; i++)) { echo $i; }')).type, 'ArithmeticFor');
  });

  await t.step('$(( )) ends after its own groups', () => {
    const word = (first('echo $((1 ? 20 : (x+=2)))')).suffix[0];
    assertEquals(word.expansion[0].expression, '1 ? 20 : (x+=2)');
  });

  await t.step('! counted: even cancels, alone negates nothing', () => {
    assertEquals((first('! ! true')).bang, undefined);
    assertEquals((first('! ! ! true')).bang, true);
    assertEquals((first('!')).bang, true);
  });
});

Deno.test('more of what bash accepts', async (t) => {
  const parses = (source: string) => (bashParser(source)).commands[0] as any;

  await t.step('an empty command substitution', () => {
    assertEquals((parses('echo ab$()cd')).suffix[0].expansion[0].command, '');
  });

  await t.step('a code point past Unicode is nothing', () => {
    assertEquals((parses("echo $'\\Uffffffff'x")).suffix[0].text, 'x');
  });

  await t.step('|& pipes stderr too', () => {
    const left = (parses('a |& b')).commands[0];
    assertEquals(left.suffix[0].op.text, '>&');
    assertEquals(left.suffix[0].numberIo.text, '2');
  });

  await t.step('case with in on its own line, and esac as a pattern', () => {
    assertEquals((parses('case "$w"\nin\n foo) ;;\nesac')).type, 'Case');
    assertEquals((parses('case esac in (esac) echo;; esac')).cases[0].pattern[0].text, 'esac');
    assertEquals((parses('case k in else|done|esac) :;; esac')).cases[0].pattern.length, 3);
    assertEquals((parses('case ni in esac')).type, 'Case');
  });

  await t.step('(( and $(( that are subshells', () => {
    assertEquals((parses('((echo a; echo b); echo c)')).type, 'Subshell');
    assertEquals((parses('echo $((echo a);(echo b))')).suffix[0].expansion[0].type, 'CommandExpansion');
    assertEquals((parses('echo $(( (1+2)*3 ))')).suffix[0].expansion[0].type, 'ArithmeticExpansion');
  });
});

Deno.test('extended patterns are part of their word', () => {
  const words = (source: string) => (((bashParser(source)).commands[0] as any).suffix as { text: string }[]).map((w) => w.text);

  assertEquals(words('echo *.@(c|h) a*!(x) +([[:alpha:].]) x'), ['*.@(c|h)', 'a*!(x)', '+([[:alpha:].])', 'x']);
  assertEquals(words('echo @(a|"q r"|$p)'), ['@(a|"q r"|$p)']);
  assertEquals(words('echo <(printf hi) >(cat)'), ['<(printf hi)', '>(cat)']);
});

Deno.test('a process substitution right after an operator is a word', () => {
  const [pipeline, command] = (bashParser('cat|<(ls);>(cat)')).commands as any[];

  assertEquals(pipeline.commands[1].name.text, '<(ls)');
  assertEquals(pipeline.commands[1].name.expansion[0].type, 'ProcessSubstitution');
  assertEquals(command.name.text, '>(cat)');
  assertEquals(command.name.expansion[0].type, 'ProcessSubstitution');
});

Deno.test('comments in arrays, any for name, joined here-document lines, backslashes in backticks', async (t) => {
  const first = (source: string) => (bashParser(source)).commands[0] as any;

  await t.step('a comment inside an array literal', () => {
    const word = (first('x=(\n a # one\n b # two\n)')).prefix[0];
    assertEquals(word.text, `x=(a${ARRAY_ELEMENT_SEPARATOR}b)`);
  });

  await t.step('for 1 in parses; the executor rejects the name', () => {
    assertEquals((first('for 1 in a; do :; done')).name.text, '1');
  });

  await t.step('a backslash-newline joins here-document lines, the delimiter too', () => {
    const redirect = (first('cat << EOF\nhi \\\nthere\nEO\\\nF\n')).suffix[0];
    assertEquals(redirect.heredoc.body, 'hi there\n');
  });

  await t.step('between backticks a backslash quotes only $ ` and \\', () => {
    assertEquals((first('echo `echo "(\\")"`')).suffix[0].expansion[0].command, 'echo "(\\")"');
    assertEquals((first('echo `echo \\$x`')).suffix[0].expansion[0].command, 'echo $x');
    assertEquals((first('echo `echo foo\\\nbar`')).suffix[0].expansion[0].command, 'echo foobar');
  });
});
