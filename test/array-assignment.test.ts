import { assertEquals, assertThrows } from '@std/assert';
import { parse } from '../mod.ts';
import { ARRAY_ELEMENT_SEPARATOR, parseAssignmentWord } from '../src/utils/assignment.ts';

const SEP = ARRAY_ELEMENT_SEPARATOR;

/**
 * The text of the first prefix (an assignment) of the first command.
 */
const assignmentText = (source: string) => {
  const ast = parse(source);
  const command = ast.commands[0] as { prefix?: { type: string; text: string }[] };

  return command.prefix?.[0]?.text;
};

const suffixWords = (source: string) => {
  const ast = parse(source);
  const command = ast.commands[0] as { suffix?: { type: string; text: string }[] };

  return command.suffix?.map((word) => word.text);
};

Deno.test('array assignment', async (t) => {
  await t.step('an array literal is one assignment word', () => {
    assertEquals(assignmentText('a=(1 2 3)'), `a=(1${SEP}2${SEP}3)`);
  });

  await t.step('blanks between elements collapse into one boundary', () => {
    assertEquals(assignmentText('a=(  1   2  )'), `a=(1${SEP}2)`);
  });

  await t.step('newlines inside the literal are element boundaries', () => {
    assertEquals(assignmentText('a=(1\n2)'), `a=(1${SEP}2)`);
  });

  await t.step("a subscript runs to its own ], quotes kept for the executor to expand: A[']']=1", () => {
    assertEquals(assignmentText("A[']']=1"), "A[']']=1");
    assertEquals(assignmentText('A["x]"]="a b"'), 'A["x]"]=a b');
    assertEquals(assignmentText('A[\\]]=1'), 'A[\\]]=1');
    assertEquals(assignmentText('A[$(echo ])]=1'), 'A[$(echo ])]=1');
    assertEquals(parseAssignmentWord("A[']']+=v")?.subscript, "']'");
  });

  await t.step('a subscript holding blanks is part of the word, as bash reads it', () => {
    assertEquals(assignmentText('h[hello world]=x'), 'h[hello world]=x');
    assertEquals(assignmentText('h["k k"]+=v'), 'h["k k"]+=v');
    assertEquals(assignmentText('h=([foo bar]=x y)'), `h=([foo bar]=x${SEP}y)`);
    // Not an assignment, so the blank still splits: `a[b` and `c]`
    assertEquals(suffixWords('echo a[b c]'), ['a[b', 'c]']);
  });

  await t.step('quotes are removed per element, so a quoted blank is kept', () => {
    assertEquals(assignmentText('a=(x "b c" \'d e\')'), `a=(x${SEP}b c${SEP}d e)`);
  });

  await t.step('a quoted empty element survives as an empty element', () => {
    assertEquals(assignmentText('a=("" x)'), `a=(${SEP}x)`);
  });

  await t.step('an empty literal stays empty', () => {
    assertEquals(assignmentText('a=()'), 'a=()');
  });

  await t.step('an expansion inside the literal is recorded, not resolved', () => {
    const ast = parse('FILES=($(find /x))');
    const command = ast.commands[0] as { prefix?: { text: string; expansion: { type: string }[] }[] };

    assertEquals(command.prefix?.[0].text, 'FILES=($(find /x))');
    assertEquals(command.prefix?.[0].expansion[0].type, 'CommandExpansion');
  });

  await t.step('appending and element assignment are assignments too', () => {
    assertEquals(assignmentText('a+=(z)'), `a+=(z)`);
    assertEquals(assignmentText('a+=b'), 'a+=b');
    assertEquals(assignmentText('a[0]=x'), 'a[0]=x');
    assertEquals(assignmentText('a[0]+=x'), 'a[0]+=x');
  });

  await t.step('a literal in argument position keeps its elements for declare', () => {
    assertEquals(suffixWords('declare -a x=(1 2)'), ['-a', `x=(1${SEP}2)`]);
  });

  await t.step('an unterminated literal asks for more input', () => {
    assertThrows(() => parse('a=(1 2'));
  });
});

Deno.test('parameter subscripts', async (t) => {
  await t.step('a subscript stays part of the parameter', () => {
    const ast = parse('echo ${a[0]} ${a[@]} ${a[*]}');
    const command = ast.commands[0] as { suffix?: { expansion: { parameter: string }[] }[] };

    assertEquals(command.suffix?.map((word) => word.expansion[0].parameter), ['a[0]', 'a[@]', 'a[*]']);
  });

  await t.step('operators work on a subscripted parameter', () => {
    const ast = parse('echo ${#a[@]} ${a[0]:-x}');
    const command = ast.commands[0] as { suffix?: { expansion: { parameter: string; op: string }[] }[] };

    assertEquals(command.suffix?.[0].expansion[0], { ...command.suffix?.[0].expansion[0], parameter: 'a[@]', op: 'stringLength' });
    assertEquals(command.suffix?.[1].expansion[0].op, 'useDefaultValue');
  });

  await t.step('${!a[@]} is the list of indices', () => {
    const ast = parse('echo ${!a[@]}');
    const command = ast.commands[0] as { suffix?: { expansion: { parameter: string; op: string }[] }[] };

    assertEquals(command.suffix?.[0].expansion[0].op, 'arrayIndices');
    assertEquals(command.suffix?.[0].expansion[0].parameter, 'a');
  });
});

Deno.test('parseAssignmentWord', async (t) => {
  await t.step('splits a scalar assignment', () => {
    assertEquals(parseAssignmentWord('x=1'), { name: 'x', subscript: undefined, append: false, value: '1', valueStart: 2, list: false });
  });

  await t.step('splits an element assignment', () => {
    assertEquals(parseAssignmentWord('x[2]+=1'), { name: 'x', subscript: '2', append: true, value: '1', valueStart: 6, list: false });
  });

  await t.step('splits a list assignment', () => {
    assertEquals(parseAssignmentWord(`x=(a${SEP}b)`), { name: 'x', subscript: undefined, append: false, value: `a${SEP}b`, valueStart: 3, list: true });
  });

  await t.step('is null for anything else', () => {
    assertEquals(parseAssignmentWord('echo'), null);
    assertEquals(parseAssignmentWord('=1'), null);
    assertEquals(parseAssignmentWord('1x=2'), null);
  });
});
