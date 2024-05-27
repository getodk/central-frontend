import {
	bind,
	body,
	head,
	html,
	input,
	mainInstance,
	model,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import { stringAnswer } from '../../../src/answer/ExpectedStringAnswer.ts';
import { Scenario } from '../../../src/jr/Scenario.ts';

describe('XPath function support: `digest`', () => {
	describe('DigestTest.java', () => {
		const MD5 = 'MD5';
		const SHA1 = 'SHA-1';
		const SHA256 = 'SHA-256';
		const SHA384 = 'SHA-384';
		const SHA512 = 'SHA-512';

		type DigestAlgorithm = typeof MD5 | typeof SHA1 | typeof SHA256 | typeof SHA384 | typeof SHA512;

		const BASE64 = 'base64';
		const HEX = 'hex';

		type Encoding = typeof BASE64 | typeof HEX;

		interface DigestTestParameters {
			readonly testName: string;
			readonly algorithm: DigestAlgorithm;
			readonly encoding: Encoding;
			readonly inputValue: string;
			readonly expectedOutput: string;
		}

		/**
		 * **PORTING NOTES**
		 *
		 * - s/`input`/`inputValue`/ to avoid the parameter's binding conflicting
		 *   with the fixture DSL's {@link input} import.
		 */
		describe.each<DigestTestParameters>([
			{
				testName: 'MD5',
				algorithm: MD5,
				inputValue: 'some text',
				encoding: HEX,
				expectedOutput: '552e21cd4cd9918678e3c1a0df491bc3',
			},
			{
				testName: 'SHA-1',
				algorithm: SHA1,
				inputValue: 'some text',
				encoding: HEX,
				expectedOutput: '37aa63c77398d954473262e1a0057c1e632eda77',
			},
			{
				testName: 'SHA-256',
				algorithm: SHA256,
				inputValue: 'some text',
				encoding: HEX,
				expectedOutput: 'b94f6f125c79e3a5ffaa826f584c10d52ada669e6762051b826b55776d05aed2',
			},
			{
				testName: 'SHA-384',
				algorithm: SHA384,
				inputValue: 'some text',
				encoding: HEX,
				expectedOutput:
					'cc94ec3e9873c0b9a72486442958f671067cdf77b9427416d031440cc62041e2ee1344498447ec0ced9f7043461bd1f3',
			},
			{
				testName: 'SHA-512',
				algorithm: SHA512,
				inputValue: 'some text',
				encoding: HEX,
				expectedOutput:
					'e2732baedca3eac1407828637de1dbca702c3fc9ece16cf536ddb8d6139cd85dfe7464b8235b29826f608ccf4ac643e29b19c637858a3d8710a59111df42ddb5',
			},

			{
				testName: 'MD5',
				algorithm: MD5,
				inputValue: 'some text',
				encoding: BASE64,
				expectedOutput: 'VS4hzUzZkYZ448Gg30kbww==',
			},
			{
				testName: 'SHA-1',
				algorithm: SHA1,
				inputValue: 'some text',
				encoding: BASE64,
				expectedOutput: 'N6pjx3OY2VRHMmLhoAV8HmMu2nc=',
			},
			{
				testName: 'SHA-256',
				algorithm: SHA256,
				inputValue: 'some text',
				encoding: BASE64,
				expectedOutput: 'uU9vElx546X/qoJvWEwQ1SraZp5nYgUbgmtVd20FrtI=',
			},
			{
				testName: 'SHA-384',
				algorithm: SHA384,
				inputValue: 'some text',
				encoding: BASE64,
				expectedOutput: 'zJTsPphzwLmnJIZEKVj2cQZ833e5QnQW0DFEDMYgQeLuE0RJhEfsDO2fcENGG9Hz',
			},
			{
				testName: 'SHA-512',
				algorithm: SHA512,
				inputValue: 'some text',
				encoding: BASE64,
				expectedOutput:
					'4nMrrtyj6sFAeChjfeHbynAsP8ns4Wz1Nt241hOc2F3+dGS4I1spgm9gjM9KxkPimxnGN4WKPYcQpZER30LdtQ==',
			},

			{
				testName: 'MD5 HEX of empty string (baseline from forum feedback)',
				algorithm: MD5,
				inputValue: '',
				encoding: HEX,
				expectedOutput: 'd41d8cd98f00b204e9800998ecf8427e',
			},
		])('$testName', ({ algorithm, inputValue, encoding, expectedOutput }) => {
			/**
			 * **PORTING NOTES**
			 *
			 * JavaRosa's test exercises the internal implementation API here. The
			 * next test exercises the `digest` function as used in a form, which is
			 * probably sufficient for our use case. Note that there are also several
			 * `digest` tests in the `xpath` package, and it seems highly unlikely
			 * that an integration test here would behave differently. But the next
			 * test is ported anyway for the sake of completeness.
			 */
			it.skip('generates a digest');

			describe('`digest` function', () => {
				it('accepts dynamic parameters', async () => {
					const scenario = await Scenario.init(
						'Some form',
						html(
							head(
								title('Digest form'),
								model(
									mainInstance(
										t(
											'data id="digest"',
											t('my-text', inputValue),
											t('my-algorithm', algorithm.toString()),
											t('my-encoding', encoding.toString()),
											t('my-digest')
										)
									),
									bind('/data/my-text').type('string'),
									bind('/data/my-algorithm').type('string'),
									bind('/data/my-encoding').type('string'),
									bind('/data/my-digest')
										.type('string')
										.calculate('digest(/data/my-text, /data/my-algorithm, /data/my-encoding)')
								)
							),
							body(input('/data/my-text'), input('/data/my-algorithm'), input('/data/my-encoding'))
						)
					);

					expect(scenario.answerOf('/data/my-digest')).toEqualAnswer(stringAnswer(expectedOutput));
				});
			});
		});
	});
});
