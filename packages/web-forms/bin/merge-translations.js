import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const I18N_FILE_EXTENSION = '.i18n.json';
const OUTPUT_FILE = 'locales/strings_en.json';
const ENCODING = 'utf-8';

const parseI18nFile = async (file, rootDir) => {
	const path = relative(rootDir, file);
	try {
		const content = JSON.parse(await readFile(file, ENCODING));
		if (typeof content !== 'object' || content == null || Array.isArray(content)) {
			throw new Error('Invalid JSON file');
		}
		return content;
	} catch (error) {
		throw new Error(`An error occurred when reading i18n JSON file in ${path}: ${error.message}`);
	}
};

const findI18nFiles = async (directory) => {
	const entries = await readdir(directory, { withFileTypes: true });
	const results = await Promise.all(
		entries.map((entry) => {
			const fullPath = join(directory, entry.name);
			if (entry.isDirectory()) {
				return findI18nFiles(fullPath);
			}
			return fullPath.endsWith(I18N_FILE_EXTENSION) ? [fullPath] : [];
		})
	);
	return results.flat().sort();
};

const mergeI18nFiles = async (srcDir, rootDir) => {
	const files = await findI18nFiles(srcDir);
	if (!files.length) {
		// eslint-disable-next-line no-console
		console.warn(`No ${I18N_FILE_EXTENSION} files found in ${relative(rootDir, srcDir)}`);
	}

	// Load all files in parallel, then merge sequentially to detect duplicates
	const contents = await Promise.all(files.map((file) => parseI18nFile(file, rootDir)));
	const merged = {};
	for (const [index, content] of contents.entries()) {
		const duplicates = Object.keys(content).filter((key) => key in merged);
		if (duplicates.length) {
			throw new Error(
				`Duplicate translation keys in ${relative(rootDir, files[index])}: ${duplicates.join(', ')}`
			);
		}
		Object.assign(merged, content);
	}

	return merged;
};

const run = async () => {
	const rootDir = process.cwd();
	const outputFile = resolve(rootDir, OUTPUT_FILE);
	try {
		const merged = await mergeI18nFiles(resolve(rootDir, 'src'), rootDir);
		await mkdir(dirname(outputFile), { recursive: true });
		await writeFile(outputFile, JSON.stringify(merged, null, 2) + '\n', ENCODING);
		// eslint-disable-next-line no-console
		console.log(`Merged → ${relative(rootDir, outputFile)}`);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error('Merge failed:', error);
		process.exit(1);
	}
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	void run();
} else {
	console.warn(
		`[Warning] The ${fileURLToPath(import.meta.url)} was imported as a module.\n` +
			`This script is designed to run as a standalone CLI tool.`
	);
}
