// @ts-check

import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';

const CWD = process.cwd();
const distPath = resolvePath(CWD, 'dist');
const baseTypeGeneratorPath = resolvePath(
	CWD,
	'../../node_modules/@asgerf/dts-tree-sitter/build/src/index.js'
);

const baseGeneratedTypes = spawnSync('node', [baseTypeGeneratorPath, distPath]).stdout.toString(
	'utf-8'
);

const correctedTypes = baseGeneratedTypes
	// Replace broken interface constructor signatures with constructor declarations
	.replaceAll(/((?<=\n)[ \t]*constructor\([^)]*\));[ ]*\n/g, '$1: this;')
	// Replace hasError method type with getter. This same method is now a getter
	// as of recent tree-sitter changes. Since dts-tree-sitter hasn't been updated
	// in some time, we may need to make other changes like this. If we keep using
	// tree-sitter longer term, we should seriously consider forking this project.
	// There are many other improvements we could make (likely replacing this
	// script entirely).
	.replaceAll(/(?<=\n)([ \t]*)hasError\(\): true;[ ]*\n/g, '$1get hasError(): true;\n');

const wrappedTypes = [
	"declare module '@getodk/tree-sitter-xpath/parser' {",
	correctedTypes,
	'}',
	'',
].join('\n');

const outPath = resolvePath(distPath, 'tree-sitter-xpath-parser.d.ts');

writeFileSync(outPath, wrappedTypes);
