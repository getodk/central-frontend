import { backUpPackageJSON, checkTreeSitterVersion, removeFiles } from './shared.mjs';

checkTreeSitterVersion();

const buildArtifacts = [
	'bindings',
	'build',
	'src/tree-sitter',
	'src/grammar.json',
	'src/node-types.json',
	'src/parser.c',
	'target',
	'types/tree-sitter-xpath-parser.d.ts',
	'binding.gyp',
	'Cargo.toml',
	'grammar.js',
	'grammar.js.map',
];

removeFiles(buildArtifacts);
backUpPackageJSON();
