// @ts-check

import { checkTreeSitterVersion, removeFiles, restorePackageJSON } from './shared.mjs';

checkTreeSitterVersion();

/**
 * tree-sitter generates a lot of files when generating and building the various
 * artifacts from a grammar definition. Some of those files are ignored in the
 * monorepo root level `.gitignore`. As of the latest version (@see
 * {@link EXPECTED_TREE_SITTER_VERSION}), some of the generated files **should
 * not** be ignored, as their presence would still affect other behaviors (such
 * as editor configuration and version control).
 *
 * We remove these files as part of cleanup at the end of the build process.
 */
// prettier-ignore
const extraneousGeneratedFiles = [
	'.editorconfig',
	'.gitattributes',
	'.gitignore',
];

removeFiles(extraneousGeneratedFiles);
restorePackageJSON();
