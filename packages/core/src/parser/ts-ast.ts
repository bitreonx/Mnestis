import ts from 'typescript';
import type { ParsedCall, ParsedImport, ParsedSymbol } from '../types.js';

export interface TsAstExtraction {
  imports: ParsedImport[];
  symbols: ParsedSymbol[];
  calls: ParsedCall[];
  exports: string[];
}

const CALL_SKIP = new Set([
  'if', 'for', 'while', 'switch', 'catch', 'function', 'return', 'new', 'typeof', 'instanceof',
  'parseInt', 'parseFloat', 'Number', 'String', 'Boolean', 'Array', 'Object', 'Math', 'JSON',
  'console', 'require', 'import', 'super', 'this',
]);

function scriptKind(relativePath: string, language: string): ts.ScriptKind {
  if (language === 'javascript') {
    if (relativePath.endsWith('.jsx')) return ts.ScriptKind.JSX;
    return ts.ScriptKind.JS;
  }
  if (relativePath.endsWith('.tsx')) return ts.ScriptKind.TSX;
  return ts.ScriptKind.TS;
}

function lineOf(sourceFile: ts.SourceFile, node: ts.Node): number {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

function hasExportModifier(node: ts.Node): boolean {
  if (!ts.canHaveModifiers(node)) return false;
  return (ts.getModifiers(node) ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
}

function hasDefaultModifier(node: ts.Node): boolean {
  if (!ts.canHaveModifiers(node)) return false;
  return (ts.getModifiers(node) ?? []).some((m) => m.kind === ts.SyntaxKind.DefaultKeyword);
}

function collectSpecifiers(named: ts.NamedImports | ts.NamedExports): string[] {
  const out: string[] = [];
  for (const el of named.elements) {
    const name = el.propertyName?.text ?? el.name.text;
    if (name !== 'type') out.push(name);
  }
  return out;
}

function extractImportClause(clause: ts.ImportClause | undefined, source: string): ParsedImport[] {
  if (!clause) return [{ source, specifiers: ['*side-effect*'], isTypeOnly: false }];
  const isTypeOnly = clause.isTypeOnly;
  if (clause.name) {
    return [{ source, specifiers: [clause.name.text], isTypeOnly }];
  }
  if (clause.namedBindings) {
    if (ts.isNamespaceImport(clause.namedBindings)) {
      return [{ source, specifiers: [clause.namedBindings.name.text], isTypeOnly }];
    }
    if (ts.isNamedImports(clause.namedBindings)) {
      return [{ source, specifiers: collectSpecifiers(clause.namedBindings), isTypeOnly }];
    }
  }
  return [{ source, specifiers: [], isTypeOnly }];
}

function calleeName(expr: ts.Expression): string | undefined {
  if (ts.isIdentifier(expr)) return expr.text;
  if (ts.isPropertyAccessExpression(expr)) {
    const left = calleeName(expr.expression);
    return left ? `${left}.${expr.name.text}` : expr.name.text;
  }
  if (ts.isElementAccessExpression(expr) && ts.isStringLiteral(expr.argumentExpression)) {
    const left = calleeName(expr.expression);
    return left ? `${left}.${expr.argumentExpression.text}` : expr.argumentExpression.text;
  }
  return undefined;
}

export function extractTsAst(
  content: string,
  relativePath: string,
  language: string,
): TsAstExtraction | null {
  try {
    const kind = scriptKind(relativePath, language);
    const sourceFile = ts.createSourceFile(relativePath, content, ts.ScriptTarget.Latest, true, kind);

    const imports: ParsedImport[] = [];
    const symbols: ParsedSymbol[] = [];
    const calls: ParsedCall[] = [];
    const exports: string[] = [];
    const seenSymbols = new Set<string>();

    const pushSymbol = (
      name: string,
      symKind: ParsedSymbol['kind'],
      node: ts.Node,
      exported: boolean,
      defaultExport: boolean,
    ) => {
      const key = `${symKind}:${name}`;
      if (seenSymbols.has(key)) return;
      seenSymbols.add(key);
      const startLine = lineOf(sourceFile, node);
      symbols.push({
        name,
        kind: symKind,
        startLine,
        endLine: startLine,
        isExported: exported,
        isDefaultExport: defaultExport,
      });
      if (exported) exports.push(name);
    };

    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        imports.push(...extractImportClause(node.importClause, node.moduleSpecifier.text));
      }

      if (
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        node.arguments.length > 0 &&
        ts.isStringLiteral(node.arguments[0]!)
      ) {
        imports.push({
          source: node.arguments[0]!.text,
          specifiers: ['*dynamic*'],
          isTypeOnly: false,
        });
      }

      if (ts.isExportDeclaration(node)) {
        if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
          if (!node.exportClause) {
            imports.push({
              source: node.moduleSpecifier.text,
              specifiers: ['*reexport*'],
              isTypeOnly: false,
            });
          } else if (ts.isNamedExports(node.exportClause)) {
            const specs = collectSpecifiers(node.exportClause);
            imports.push({ source: node.moduleSpecifier.text, specifiers: specs, isTypeOnly: false });
            for (const spec of specs) exports.push(spec);
          }
        } else if (node.exportClause && ts.isNamedExports(node.exportClause)) {
          for (const el of node.exportClause.elements) {
            exports.push(el.name.text);
          }
        }
      }

      if (ts.isFunctionDeclaration(node) && node.name) {
        pushSymbol(node.name.text, 'function', node, hasExportModifier(node), hasDefaultModifier(node));
      }

      if (ts.isClassDeclaration(node) && node.name) {
        pushSymbol(node.name.text, 'class', node, hasExportModifier(node), hasDefaultModifier(node));
      }

      if (ts.isInterfaceDeclaration(node)) {
        pushSymbol(node.name.text, 'interface', node, hasExportModifier(node), false);
      }

      if (ts.isTypeAliasDeclaration(node)) {
        pushSymbol(node.name.text, 'type', node, hasExportModifier(node), false);
      }

      if (ts.isMethodDeclaration(node) && node.name && ts.isIdentifier(node.name)) {
        pushSymbol(node.name.text, 'function', node, hasExportModifier(node), false);
      }

      if (ts.isVariableStatement(node)) {
        const exported = hasExportModifier(node);
        const defaultExport = hasDefaultModifier(node);
        for (const decl of node.declarationList.declarations) {
          if (!ts.isIdentifier(decl.name)) continue;
          const init = decl.initializer;
          const isFn =
            init &&
            (ts.isArrowFunction(init) ||
              ts.isFunctionExpression(init) ||
              (ts.isCallExpression(init) &&
                ts.isIdentifier(init.expression) &&
                init.expression.text === 'forwardRef'));
          if (isFn || exported) {
            pushSymbol(decl.name.text, 'function', decl, exported, defaultExport);
          }
        }
      }

      if (ts.isCallExpression(node)) {
        const name = calleeName(node.expression);
        if (name) {
          const base = name.split('.')[0]!;
          if (!CALL_SKIP.has(base) && calls.length < 400) {
            calls.push({ callee: name, line: lineOf(sourceFile, node) });
          }
        }
      }

      if (ts.isExportAssignment(node) && !node.isExportEquals) {
        exports.push('default');
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    return { imports, symbols, calls, exports };
  } catch {
    return null;
  }
}
