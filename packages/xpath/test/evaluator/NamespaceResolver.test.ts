import { xml } from '@getodk/common/test/factories/xml.ts';
import { assert, beforeEach, describe, expect, it } from 'vitest';
import { DefaultEvaluator } from '../../src/evaluator/DefaultEvaluator.ts';
import { NamespaceResolver, staticNamespaces } from '../../src/evaluator/NamespaceResolver.ts';

describe('NamespaceResolver', () => {
	let resolver: NamespaceResolver;

	const ROOT_NAMESPACE_DEFAULT = 'https://root.namespace/';
	const ROOT_NAMESPACE_A = 'https://root.namespace/a';
	const ROOT_NAMESPACE_B = 'https://root.namespace/b';
	const NESTED_NAMESPACE_DEFAULT = 'https://nested.namespace/';
	const NESTED_NAMESPACE_A = 'https://nested.namespace/a';
	const NESTED_NAMESPACE_XF = 'https://nested.namespace/xf';

	const TEST_DOCUMENT = xml`
		<root
			xmlns="${ROOT_NAMESPACE_DEFAULT}"
			xmlns:a="${ROOT_NAMESPACE_A}"
			xmlns:b="${ROOT_NAMESPACE_B}"
		>
			<nested
				xmlns="${NESTED_NAMESPACE_DEFAULT}"
				xmlns:a="${NESTED_NAMESPACE_A}"
				xmlns:xf="${NESTED_NAMESPACE_XF}"
			/>
		</root>
	`;
	const { firstElementChild } = TEST_DOCUMENT.documentElement;

	assert(firstElementChild);

	const UNPREFIXED_ELEMENT = firstElementChild;

	beforeEach(() => {
		const rootNode = TEST_DOCUMENT;
		const evaluator = new DefaultEvaluator({ rootNode });
		const context = evaluator.getEvaluationContext(rootNode, rootNode);

		resolver = context.namespaceResolver;
	});

	it('resolves the default namespace of the document', () => {
		expect(resolver.lookupNamespaceURI(null)).toEqual(ROOT_NAMESPACE_DEFAULT);
	});

	const rootCases = [
		{ prefix: 'a', expected: ROOT_NAMESPACE_A },
		{ prefix: 'b', expected: ROOT_NAMESPACE_B },
	];

	it.each(rootCases)(
		'resolves $prefix defined on the root element to $expected',
		({ prefix, expected }) => {
			expect(resolver.lookupNamespaceURI(prefix)).toEqual(expected);
		}
	);

	describe('static resolution', () => {
		const cases = Array.from(staticNamespaces.entries())
			.map(([prefix, namespaceURI]) => ({
				prefix,
				namespaceURI,
			}))
			.filter(({ prefix }) => prefix != null);

		it.each(cases)(
			'resolves the default prefix $prefix to its static namespace $namespaceURI',
			({ prefix, namespaceURI }) => {
				expect(resolver.lookupNamespaceURI(prefix)).toEqual(namespaceURI);
			}
		);
	});

	describe('nested element context', () => {
		beforeEach(() => {
			resolver = NamespaceResolver.from(TEST_DOCUMENT, UNPREFIXED_ELEMENT);
		});

		const nestedCases = [
			{ prefix: null, expected: NESTED_NAMESPACE_DEFAULT },
			{ prefix: 'a', expected: NESTED_NAMESPACE_A },
		];

		it.each(nestedCases)(
			'resolves prefix $prefix defined on a nested element to $expected',
			({ prefix, expected }) => {
				expect(resolver.lookupNamespaceURI(prefix)).toEqual(expected);
			}
		);

		it('resolves a prefix overriding static defaults', () => {
			const expected = NESTED_NAMESPACE_XF;
			const actual = resolver.lookupNamespaceURI('xf');
			const staticDefault = staticNamespaces.get('xf');

			expect(actual).toEqual(expected);
			expect(actual).not.toEqual(staticDefault);
		});
	});
});
