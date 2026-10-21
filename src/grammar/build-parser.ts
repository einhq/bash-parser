import { resolve } from '@std/path';
import { Jison } from 'jison';
import grammar from './bash-grammar.ts';

try {
  console.log(`Building grammar parser...`);

  const outPath = resolve(import.meta.dirname!, 'parser.js');
  const parser = new Jison.Parser(grammar);
  let source = parser.generate({ moduleType: 'js' });

  // Remove the _token_stack label since it is unused and produces a warning
  source = source.replace('_token_stack:', '');

  // Do some magic to make the generated parser work as an ESM module
  // and ignore any lint errors.
  source = `
// deno-lint-ignore-file
// deno-fmt-ignore-file
${source}
// ESM export
export {parser};
export const Parser = parser.Parser;
`;

  console.log('Grammar compiled.');

  await Deno.writeTextFile(outPath, source);

  console.log(`Grammar saved to ${outPath}.`);
} catch (err) {
  console.error(`Failed to compile grammar: \n${err}`);
  Deno.exit(1);
}
