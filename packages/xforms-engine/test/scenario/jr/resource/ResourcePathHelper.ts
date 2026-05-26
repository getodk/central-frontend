import { xformFixtures } from '@getodk/common/fixtures/xforms.ts';
import { FormDefinitionResource } from './FormDefinitionResource.ts';

interface TestFixture {
	readonly identifier: string;
	readonly localPath: string;
	readonly fixtureXML: string;
}

const testFixtures = await Promise.all(
	xformFixtures.flatMap((fixture): Promise<TestFixture> | readonly [] => {
		const { category, identifier, localPath } = fixture;

		if (category !== 'test-javarosa' && category !== 'test-scenario') {
			return [];
		}

		return fixture.loadXML().then((fixtureXML) => {
			if (typeof fixtureXML !== 'string') {
				throw new Error('Wrong XML Form type. Expected a string');
			}

			return {
				identifier,
				localPath,
				fixtureXML,
			};
		});
	})
);

const testFixturesByIdentifier = testFixtures.reduce((acc, testFixture) => {
	const { identifier } = testFixture;

	if (acc.has(identifier)) {
		throw new Error(`Duplicate test fixture with identifier: ${identifier}`);
	}

	acc.set(identifier, testFixture);

	return acc;
}, new Map<string, TestFixture>());

/**
 * Exposed as a plain function; addresses the semantic intent of JavaRosa's
 * same-named static method on the `ResourcePathHelper` class.
 */
export const r = (fileName: string): FormDefinitionResource => {
	const testFixture = testFixturesByIdentifier.get(fileName);

	// TODO: this logic is equivalent to the same logic in JavaRosa's static
	// method of the same name. Note that the `endsWith` call is theoretically
	// error prone, i.e. it would return a resource `foo-bar.xml` where the
	// specified file name is `bar.xml`.

	if (testFixture == null) {
		throw new Error(`File ${fileName} not found among files in resources`);
	}

	const { localPath, fixtureXML } = testFixture;

	return new FormDefinitionResource(localPath, fixtureXML);
};
