// @ts-check

import assert from 'node:assert';
import { createRequire } from 'node:module';

/**
 * To revisit on updates to the `tree-sitter` dependency: did tree-sitter's
 * build reintroduce extraneous build artifacts? If so, we may once again need
 * to account for that by doing one or more of the following:
 *
 * - adding specific artifacts and/or paths to .gitignore (at the monorepo root)
 * - referencing specific artifacts as generated in .gitattributes (also at the
 *   monorepo root)
 * - reintroducing scripting to clean up artifacts which cannot reasonably be
 *   handled by .gitignore
 */
const EXPECTED_TREE_SITTER_VERSION = '0.22.1';

const INVALID_TREE_SITTER_VERSION_MSG = `
The version of tree-sitter has been updated. Revisit the necessity and/or
details of this script! See additional detail where this assertion failed.
`;

/**
 * @return {void}
 */
const checkTreeSitterVersion = () => {
	const require = createRequire(import.meta.url);

	/** @type {typeof import('../../package.json')} */
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const pkg = require('../../package.json');
	const treeSitterVersion = pkg.devDependencies['tree-sitter'];

	assert(treeSitterVersion === EXPECTED_TREE_SITTER_VERSION, INVALID_TREE_SITTER_VERSION_MSG);
};

const INVALID_BASE_PATH_MSG = `
This script should be run with the tree-sitter-xpath package as its
current working directory. In typical usage, it will be run as a subtask
of normal build processes. You most likely want to run one of the following
from the monorepo root:

- yarn build --force
- yarn workspace @getodk/tree-sitter-xpath build
`.trim();

const packageBasePath = process.cwd();

assert(packageBasePath.endsWith('/tree-sitter-xpath'), INVALID_BASE_PATH_MSG);

checkTreeSitterVersion();
