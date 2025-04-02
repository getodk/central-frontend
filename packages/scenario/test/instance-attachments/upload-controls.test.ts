import {
	bind,
	body,
	head,
	html,
	mainInstance,
	model,
	t,
	title,
	upload,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import type { UploadMediaOptions, UploadNode } from '@getodk/xforms-engine';
import { assert, beforeEach, describe, expect, it } from 'vitest';
import { binaryAnswer } from '../../src/answer/ExpectedBinaryAnswer.ts';
import { Scenario } from '../../src/jr/Scenario.ts';

describe('Instance attachments: upload controls', () => {
	const FAKE_INSTANCE_ID = 'not important to this suite';

	describe('basic upload state', () => {
		let scenario: Scenario;

		beforeEach(async () => {
			scenario = await Scenario.init(
				'Basic upload control',
				// prettier-ignore
				html(
					head(
						title('Basic upload control'),
						model(
							mainInstance(
								t('data id="basic-upload-control"',
									t('file-upload'),
									t('meta',
										t('instanceID', FAKE_INSTANCE_ID)))),
							bind('/data/file-upload').type('binary'))),
					body(
						upload('/data/file-upload')))
			);
		});

		// This suite is effectively testing the assertion exension itself, to ensure
		// real assertions are meaningful for all of the cases it covers.
		describe('(`toEqualUploadedAnswer` assertion extension sanity checks)', () => {
			const actualFileName = 'sanity-check.txt';
			const actualFileType = 'text/plain';
			const actualFileData = 'Sanity check!';

			const uploadValue = new File([actualFileData], actualFileName, {
				type: actualFileType,
			});

			it('does not equal with different file name', async () => {
				scenario.answer('/data/file-upload', uploadValue);

				await expect(scenario.answerOf('/data/file-upload')).not.toEqualUploadedAnswer(
					binaryAnswer(
						new File([actualFileData], `other_${actualFileName}`, {
							type: actualFileType,
						})
					)
				);
			});

			it('does not equal with different file type', async () => {
				scenario.answer('/data/file-upload', uploadValue);

				await expect(scenario.answerOf('/data/file-upload')).not.toEqualUploadedAnswer(
					binaryAnswer(
						new File([actualFileData], actualFileName, {
							type: `${actualFileType}-other`,
						})
					)
				);
			});

			it('does not equal with different file data', async () => {
				scenario.answer('/data/file-upload', uploadValue);

				await expect(scenario.answerOf('/data/file-upload')).not.toEqualUploadedAnswer(
					binaryAnswer(
						new File([`${actualFileData} OTHER`], actualFileName, {
							type: actualFileData,
						})
					)
				);
			});

			it('does not equal a blank file', async () => {
				scenario.answer('/data/file-upload', uploadValue);

				await expect(scenario.answerOf('/data/file-upload')).not.toEqualUploadedAnswer(
					binaryAnswer(null)
				);
			});

			it('does not equal a file when value is blank', async () => {
				scenario.answer('/data/file-upload', null);

				await expect(scenario.answerOf('/data/file-upload')).not.toEqualUploadedAnswer(
					binaryAnswer(uploadValue)
				);
			});
		});

		it('assigns an uploaded file value', async () => {
			const uploadValue = new File(
				['Uploading an instance attachment!', 'This is its text contents!'],
				'upload.txt',
				{ type: 'text/plain' }
			);

			scenario.answer('/data/file-upload', uploadValue);

			await expect(scenario.answerOf('/data/file-upload')).toEqualUploadedAnswer(
				binaryAnswer(uploadValue)
			);
		});

		it('includes an uploaded file name in serialized instance XML', () => {
			const uploadName = 'upload.txt';
			const uploadValue = new File(['Not important'], uploadName, {
				type: 'text/plain',
			});

			scenario.answer('/data/file-upload', uploadValue);

			expect(scenario).toHaveSerializedSubmissionXML(
				// prettier-ignore
				t('data id="basic-upload-control"',
					t('file-upload', uploadName),
					t('meta',
						t('instanceID', FAKE_INSTANCE_ID))).asXml()
			);
		});
	});

	describe('form-defined media types', () => {
		const getUploadNode = (scneario: Scenario, reference: string): UploadNode => {
			const node = scneario.getInstanceNode(reference);

			assert(node.nodeType === 'upload');

			return node;
		};

		interface UploadMediaCase {
			readonly description: string;
			readonly mediaType: string | null;
			readonly expected: UploadMediaOptions;
		}

		it.each<UploadMediaCase>([
			{
				description: 'parses absence of `mediatype` as accepting all uploads by default',
				mediaType: null,
				expected: {
					accept: '*',
					type: null,
					subtype: null,
				},
			},

			{
				description: 'parses a known `mediatype` MIME type value',
				mediaType: 'image/*',
				expected: {
					accept: 'image/*',
					type: 'image',
					subtype: '*',
				},
			},

			{
				description: 'parses an unknown `mediatype` MIME type value',
				mediaType: 'application/*',
				expected: {
					accept: 'application/*',
					type: 'application',
					subtype: '*',
				},
			},

			{
				description: 'parses a blank `mediatype` value as default',
				mediaType: '',
				expected: {
					accept: '*',
					type: null,
					subtype: null,
				},
			},
		])('$description', async ({ mediaType, expected }) => {
			const uploadAttributes = new Map<string, string>();

			if (mediaType != null) {
				uploadAttributes.set('mediatype', mediaType);
			}

			const scenario = await Scenario.init(
				'Typed upload control',
				// prettier-ignore
				html(
					head(
						title('Typed upload control'),
						model(
							mainInstance(
								t('data id="typed-upload-control"',
									t('file-upload'),
									t('meta',
										t('instanceID', FAKE_INSTANCE_ID)))),
							bind('/data/file-upload').type('binary'))),
					body(
						upload('/data/file-upload', uploadAttributes)))
			);

			const node = getUploadNode(scenario, '/data/file-upload');

			expect(node.nodeOptions.media).toEqual(expected);
		});

		it('fails to parse a `mediatype` attribute specifying a file extension', async () => {
			const uploadAttributes = new Map([['mediatype', '.jpg']]);

			const init = async () => {
				await Scenario.init(
					'Invalid upload control',
					// prettier-ignore
					html(
						head(
							title('Invalid upload control'),
							model(
								mainInstance(
									t('data id="invalid-upload-control"',
										t('file-upload'),
										t('meta',
											t('instanceID', FAKE_INSTANCE_ID)))),
								bind('/data/file-upload').type('binary'))),
						body(
							upload('/data/file-upload', uploadAttributes)))
				);
			};

			await expect(init).rejects.toThrow();
		});
	});
});
