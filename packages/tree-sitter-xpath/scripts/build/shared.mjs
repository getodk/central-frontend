// @ts-check

import assert from 'node:assert';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve as resolvePath } from 'node:path';
import { rimrafSync } from 'rimraf';

/**
 * To revisit on updates to the `tree-sitter` dependency:
 *
 * 1. Does it still generate the files specified in
 *    {@link extraneousGeneratedFiles}? If not, this script may be unnecessary!
 *
 * 2. If it does, determine whether there are changes which should be propagated
 *    to one of these files at the project monorepo root:
 *
 *     - .gitattributes
 *     - .gitignore
 *
 * 3. There is corresponding commentary in the top-level .gitignore file which
 *    may need to be updated if any of the above changes invalidate it.
 */
const EXPECTED_TREE_SITTER_VERSION = '0.21.1';

const INVALID_TREE_SITTER_VERSION_MSG = `
The version of tree-sitter has been updated. Revisit the necessity and/or
details of this script! See additional detail where this assertion failed.
`;

/**
 * @return {void}
 */
export const checkTreeSitterVersion = () => {
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

/**
 * @param {readonly string[]} paths relative to package
 */
export const removeFiles = (paths) => {
	for (const relativePath of paths) {
		const absolutePath = resolvePath(packageBasePath, relativePath);

		rimrafSync(absolutePath);
	}
};

const PACKAGE_JSON_PATH = resolvePath(packageBasePath, 'package.json');
const PACKAGE_JSON_BACKUP_PATH = resolvePath(packageBasePath, 'package.json.backup');

export const backUpPackageJSON = () => {
	const packageJSON = readFileSync(PACKAGE_JSON_PATH);

	writeFileSync(PACKAGE_JSON_BACKUP_PATH, packageJSON);
};

export const restorePackageJSON = () => {
	const backupJSON = readFileSync(PACKAGE_JSON_BACKUP_PATH);

	writeFileSync(PACKAGE_JSON_PATH, backupJSON);
	rimrafSync(PACKAGE_JSON_BACKUP_PATH);
};
