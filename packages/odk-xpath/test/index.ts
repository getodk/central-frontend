// Vitest browser mode is extraordinarily slow when loading a large number of
// test suites. We do it here to speed up test runs.
const importers = Object.values(import.meta.glob('./**/*.spec.ts'));

for await (const importer of importers) {
	await importer();
}
