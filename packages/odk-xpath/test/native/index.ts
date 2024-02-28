const importers = Object.values(import.meta.glob('./**/*.spec.ts'));

for await (const importer of importers) {
	await importer();
}
