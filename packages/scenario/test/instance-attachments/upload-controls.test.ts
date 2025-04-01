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
import { beforeEach, describe, expect, it } from 'vitest';
import { binaryAnswer } from '../../src/answer/ExpectedBinaryAnswer.ts';
import { Scenario } from '../../src/jr/Scenario.ts';

describe('Instance attachments: upload controls', () => {
	describe('basic upload state', () => {
		const FAKE_INSTANCE_ID = 'not important to this suite';

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
});
