import { FormDefinitionResource } from './FormDefinitionResource.ts';

/**
 * **PORTING NOTES**
 *
 * One fixture has a `.xhtml` suffix. From discussion, it seems there's no
 * meaning behind this. We should consider renaming it (in both JavaRosa and web
 * forms) to have a `.xml` suffix for consistency with other form fixtures.
 */
const resourcesByPath = import.meta.glob('../../../resources/**/*.{xhtml,xml}', {
	as: 'raw',
	eager: true,
});
const resourceEntries = Object.entries(resourcesByPath);

/**
 * Exposed as a plain function; addresses the semantic intent of JavaRosa's
 * same-named static method on the `ResourcePathHelper` class.
 */
export const r = (fileName: string): FormDefinitionResource => {
	// TODO: this logic is equivalent to the same logic in JavaRosa's static
	// method of the same name. Note that the `endsWith` call is theoretically
	// error prone, i.e. it would return a resource `foo-bar.xml` where the
	// specified file name is `bar.xml`.
	const formEntry = resourceEntries.find(([path]) => {
		return path.endsWith(fileName);
	});

	if (formEntry == null) {
		throw new Error(`File ${fileName} not found among files in resources`);
	}

	const [path, formXML] = formEntry;

	return new FormDefinitionResource(path, formXML);
};
