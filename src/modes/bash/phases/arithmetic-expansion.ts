import { tryParseArithmetic } from '../../../arithmetic/mod.ts';
import type { LexerPhase } from '../../../lexer/types.ts';
import type { Expansion, TokenIf, TokenLocation } from '../../../tokenizer/mod.ts';
import type { AstArithmeticCommandSubstitution, AstArithmeticExpression, AstNodeCommand, AstNodeWord } from '../../../ast/types.ts';
import bashParser from '../../../parse.ts';
import map from '../../../utils/iterable/map.ts';

function parseArithmeticAST(xp: Expansion, tokenLoc?: TokenLocation) {
  // Calculate source offset for absolute positions in arithmetic AST
  // For $((expr)), the expression starts 3 characters after the expansion start (after "$((")
  let sourceOffset: number | undefined;
  if (tokenLoc?.start?.char !== undefined && xp.loc) {
    sourceOffset = tokenLoc.start.char + xp.loc.start + 3;
  }

  return tryParseArithmetic(xp.expression!, { sourceOffset });
}

/**
 * Walk an arithmetic AST and parse what the shell must run or expand in it: a `$(…)` becomes its
 * script, a `${…}` its word. Used for `$(( ))` here, and for `(( ))` and `for (( ))` once the
 * whole input is parsed.
 */
export function resolveCommandSubstitutions<T extends AstArithmeticExpression | undefined>(node: T): T;
export function resolveCommandSubstitutions(node: AstArithmeticExpression | undefined): AstArithmeticExpression | undefined {
  if (!node) return node;

  switch (node.type) {
    case 'CommandSubstitution': {
      if (node.commandAST) return node;
      const commandAST = bashParser(node.command);
      return { ...node, commandAST } as AstArithmeticCommandSubstitution;
    }
    case 'ParameterExpansion': {
      if (node.word) return node;
      const script = bashParser(`: ${node.text}`);
      const word = (script.commands[0] as AstNodeCommand).suffix?.[0] as AstNodeWord | undefined;
      return word ? { ...node, word } : node;
    }
    case 'BinaryExpression':
    case 'LogicalExpression': {
      const left = resolveCommandSubstitutions(node.left);
      const right = resolveCommandSubstitutions(node.right);
      return { ...node, left, right };
    }
    case 'UnaryExpression': {
      const argument = resolveCommandSubstitutions(node.argument);
      return { ...node, argument };
    }
    case 'ConditionalExpression': {
      const test = resolveCommandSubstitutions(node.test);
      const consequent = resolveCommandSubstitutions(node.consequent);
      const alternate = resolveCommandSubstitutions(node.alternate);
      return { ...node, test, consequent, alternate };
    }
    case 'AssignmentExpression': {
      const right = resolveCommandSubstitutions(node.right);
      return { ...node, right };
    }
    case 'SequenceExpression': {
      const expressions = node.expressions.map(resolveCommandSubstitutions);
      return { ...node, expressions };
    }
    case 'UpdateExpression':
    case 'NumericLiteral':
    case 'Identifier':
      return node;
    default:
      return node;
  }
}

const arithmeticExpansion: LexerPhase = () =>
  map((token: TokenIf) => {
    if (token.is('WORD') || token.is('ASSIGNMENT_WORD')) {
      if (!token.expansion || token.expansion.length === 0) {
        return token;
      }

      return token.setExpansion(
        token.expansion.map((xp: Expansion) => {
          if (xp.type === 'ArithmeticExpansion') {
            const arithmeticAST = parseArithmeticAST(xp, token.loc);
            const resolvedAST = resolveCommandSubstitutions(arithmeticAST);
            return Object.assign({}, xp, { arithmeticAST: resolvedAST });
          }
          return xp;
        }),
      );
    }
    return token;
  });

export default arithmeticExpansion;
