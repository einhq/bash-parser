import { assertEquals, assertThrows } from '@std/assert';
import bashParser from '../src/parse.ts';
import type { AstNodeArithmeticCommand, AstNodeArithmeticFor, AstNodeWhile } from '../src/ast/types.ts';

const first = <T>(source: string): T => (bashParser(source)).commands[0] as T;

Deno.test('arithmetic command: shell operators inside (( )) belong to the expression', async (t) => {
  for (
    const [source, expression, operator] of [
      ['(( i < 3 ))', ' i < 3 ', '<'],
      ['((i>3))', 'i>3', '>'],
      ['(( a = b << 2 ))', ' a = b << 2 ', '='],
      ['(( a && b ))', ' a && b ', '&&'],
      ['(( a | b ))', ' a | b ', '|'],
      ['(( x = $((1+2)) * (3) ))', ' x = $((1+2)) * (3) ', '='],
    ]
  ) {
    await t.step(source, () => {
      const node = first<AstNodeArithmeticCommand>(source);
      assertEquals(node.type, 'ArithmeticCommand');
      assertEquals(node.expression, expression);
      assertEquals((node.arithmeticAST as { operator?: string }).operator, operator);
    });
  }

  await t.step('as a while condition', () => {
    const node = first<AstNodeWhile>('while (( i < 3 )); do i=$((i+1)); done');
    assertEquals(node.type, 'While');
    assertEquals((node.clause.commands[0] as AstNodeArithmeticCommand).expression, ' i < 3 ');
  });

  // bash reads the body as a string and expands it later: a quoted subscript stays as written
  await t.step('the expression is the text as written, quotes and blanks kept', () => {
    const node = first<AstNodeArithmeticCommand>('((  \'a[$k]\'++  +  a["$j"] ))');
    assertEquals(node.expression, '  \'a[$k]\'++  +  a["$j"] ');
  });

  await t.step('positions in the expression are absolute in the source', () => {
    const result = bashParser('x; ((i<3))', { insertLOC: true });
    const node = result.commands[1] as AstNodeArithmeticCommand;
    const left = (node.arithmeticAST as unknown as { left: { loc: { start: { char: number } } } }).left;
    assertEquals(left.loc.start.char, 5);
  });
});

Deno.test('for (( init; test; update ))', async (t) => {
  await t.step('the three parts, parsed', () => {
    const node = first<AstNodeArithmeticFor>('for ((i=0;i<3;i++)); do echo $i; done');
    assertEquals(node.type, 'ArithmeticFor');
    assertEquals([node.init?.expression, node.test?.expression, node.update?.expression], ['i=0', 'i<3', 'i++']);
    assertEquals(node.test?.arithmeticAST?.type, 'BinaryExpression');
    assertEquals(node.do.commands.length, 1);
  });

  await t.step('spaced, with no separator before do: each part as written, from its first non-blank', () => {
    const node = first<AstNodeArithmeticFor>('for (( i = 0 ; i < 3 ; i++ )) do echo; done');
    assertEquals([node.init?.expression, node.test?.expression, node.update?.expression], ['i = 0 ', 'i < 3 ', 'i++ ']);
  });

  await t.step('over several lines', () => {
    const node = first<AstNodeArithmeticFor>('for ((i=0; i<3; i++))\ndo\n  echo $i\ndone');
    assertEquals(node.test?.expression, 'i<3');
  });

  await t.step('parts may be left out', () => {
    const node = first<AstNodeArithmeticFor>('for ((;;)); do break; done');
    assertEquals([node.init, node.test, node.update], [undefined, undefined, undefined]);
  });

  await t.step('a ; inside parentheses does not split, and commas are one expression', () => {
    const node = first<AstNodeArithmeticFor>('for ((i=0, j=5; i<(j+1); i++, j--)); do echo; done');
    assertEquals([node.init?.expression, node.test?.expression, node.update?.expression], ['i=0, j=5', 'i<(j+1)', 'i++, j--']);
  });

  await t.step('two parts are an error', () => {
    assertThrows(() => bashParser('for ((i=0;i<3)); do echo; done'), SyntaxError, 'three expressions');
  });

  await t.step('the for-in form is unchanged', () => {
    const node = first<{ type: string }>('for x in a b; do echo $x; done');
    assertEquals(node.type, 'For');
  });
});

Deno.test('${…} and $(…) inside arithmetic', async (t) => {
  type Node = { type: string; text?: string; word?: { text: string }; command?: string; commandAST?: unknown };
  const nodes = (n: unknown, out: Node[] = []): Node[] => {
    if (!n || typeof n !== 'object') return out;
    const node = n as Node;
    if ((node.type === 'ParameterExpansion' && 'text' in node) || (node.type === 'CommandSubstitution' && 'command' in node)) out.push(node);
    for (const v of Object.values(n)) nodes(v, out);
    return out;
  };

  for (const source of ['echo $(( ${x:-3} + 1 ))', '(( ${#s} > 1 ))', 'echo $(( ${a[1]} * 2 ))', 'for ((i=${n:-0}; i<3; i++)); do :; done']) {
    await t.step(`${source}: the expansion is a node with its word`, () => {
      const found = nodes(bashParser(source)).filter((n) => n.type === 'ParameterExpansion');
      assertEquals(found.length, 1);
      assertEquals(found[0].word?.text, found[0].text);
    });
  }

  await t.step('(( )) and for (( )) get their command substitutions parsed, as $(( )) does', () => {
    for (const source of ['(( $(echo 5) > 3 ))', 'for ((i=0; i<$(echo 3); i++)); do :; done']) {
      const found = nodes(bashParser(source)).filter((n) => n.type === 'CommandSubstitution');
      assertEquals(found.length, 1);
      assertEquals(!!found[0].commandAST, true, source);
    }
  });

  await t.step('an unclosed ${ is left for the executor, as bash leaves it', () => {
    const result = bashParser('echo $(( ${x + 1 ))');
    const expansion = (result.commands[0] as any).suffix[0].expansion[0];
    assertEquals(expansion.arithmeticAST, undefined);
  });
});
