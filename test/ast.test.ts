import { assertSnapshot } from '@std/testing/snapshot';
import bashParser from '../src/parse.ts';

Deno.test('ast', async (t) => {
  await t.step('command with one argument', async () => {
    await assertSnapshot(
      t,
      bashParser('echo world'),
    );
  });

  await t.step('command with multiple new lines', async () => {
    await assertSnapshot(
      t,
      bashParser('\n\n\necho world'),
    );
  });

  await t.step('command with multiple lines continuation', async () => {
    await assertSnapshot(
      t,
      bashParser('echo \\\n\\\n\\\n\\\nthere'),
    );
  });

  await t.step('command with pre-assignment', async () => {
    await assertSnapshot(
      t,
      bashParser('TEST=1 run'),
    );
  });

  await t.step('assignment alone', async () => {
    await assertSnapshot(
      t,
      bashParser('TEST=1'),
    );
  });

  await t.step('commands with AND', async () => {
    await assertSnapshot(
      t,
      bashParser('run && stop'),
    );
  });

  await t.step('commands with AND \\n', async () => {
    await assertSnapshot(
      t,
      bashParser('run && \n stop'),
    );
  });

  await t.step('commands with OR', async () => {
    await assertSnapshot(
      t,
      bashParser('run || cry'),
    );
  });

  await t.step('pipelines', async () => {
    await assertSnapshot(
      t,
      bashParser('run | cry'),
    );
  });

  await t.step('bang pipelines', async () => {
    await assertSnapshot(
      t,
      bashParser('! run | cry'),
    );
  });

  await t.step('bang after reserved word', async () => {
    await assertSnapshot(
      t,
      bashParser('if ! grep -q test /etc/bashrc; then echo yes; fi'),
    );
  });

  await t.step('no pre-assignment on suffix', async () => {
    await assertSnapshot(
      t,
      bashParser('echo TEST=1'),
    );
  });

  await t.step('command with multiple prefixes', async () => {
    await assertSnapshot(
      t,
      bashParser('TEST1=1 TEST2=2 echo world'),
    );
  });

  await t.step('multi line commands', async () => {
    await assertSnapshot(
      t,
      bashParser('echo; \nls;\n'),
    );
  });

  await t.step('Compound list', async () => {
    await assertSnapshot(
      t,
      bashParser('{ echo; ls; }'),
    );
  });

  await t.step('Compound list with redirections', async () => {
    await assertSnapshot(
      t,
      bashParser('{ echo; ls; } > file.txt'),
    );
  });

  await t.step('command with multiple redirections', async () => {
    await assertSnapshot(
      t,
      bashParser('echo world > file.txt < input.dat'),
    );
  });

  await t.step('Compound list with multiple redirections', async () => {
    await assertSnapshot(
      t,
      bashParser('{ echo; ls; } > file.txt < input.dat'),
    );
  });

  await t.step('single line commands', async () => {
    await assertSnapshot(
      t,
      bashParser('echo;ls'),
    );
  });

  await t.step('single line commands separated by &', async () => {
    await assertSnapshot(
      t,
      bashParser('echo&ls'),
    );
  });

  await t.step('LogicalExpression separated by &', async () => {
    await assertSnapshot(
      t,
      bashParser('echo && ls &'),
    );
  });

  await t.step('LogicalExpressions separated by &', async () => {
    await assertSnapshot(
      t,
      bashParser('echo && ls & ciao'),
    );
  });

  await t.step('single line commands separated by &;', async () => {
    await assertSnapshot(
      t,
      bashParser('echo&;ls'),
    );
  });

  await t.step('command with redirection to file', async () => {
    await assertSnapshot(
      t,
      bashParser('ls > file.txt'),
    );
  });

  await t.step('parse multiple suffix', async () => {
    await assertSnapshot(
      t,
      bashParser('command foo --lol'),
    );
  });

  await t.step('command with stderr redirection to file', async () => {
    await assertSnapshot(
      t,
      bashParser('ls 2> file.txt'),
    );
  });

  await t.step('command with stdout redirection to file', async () => {
    await assertSnapshot(
      t,
      bashParser('ls > file.txt'),
    );
  });

  await t.step('command with stdout append redirection to file', async () => {
    await assertSnapshot(
      t,
      bashParser('ls >> file.txt'),
    );
  });

  await t.step('command with stderr redirection to file', async () => {
    await assertSnapshot(
      t,
      bashParser('ls 2> file.txt'),
    );
  });

  await t.step('command with stderr append redirection to file', async () => {
    await assertSnapshot(
      t,
      bashParser('ls 2>> file.txt'),
    );
  });

  await t.step('command with stdout and stderr redirection to file', async () => {
    await assertSnapshot(
      t,
      bashParser('ls > file.txt 2>&1'),
    );
  });

  await t.step('command with stdout and stderr append redirection to file', async () => {
    await assertSnapshot(
      t,
      bashParser('ls >> file.txt 2>&1'),
    );
  });

  await t.step('command with stdin redirection from file', async () => {
    await assertSnapshot(
      t,
      bashParser('ls < file.txt'),
    );
  });

  await t.step('parse subshell', async () => {
    await assertSnapshot(
      t,
      bashParser('( ls )'),
    );
  });
});
