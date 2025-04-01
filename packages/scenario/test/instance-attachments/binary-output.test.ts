import { getBlobText } from '@getodk/common/lib/web-compat/blob.ts';
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
import { constants as ENGINE_CONSTANTS } from '@getodk/xforms-engine';
import { assert, describe, expect, it } from 'vitest';
import { Scenario } from '../../src/jr/Scenario.ts';

describe('Instance attachments: binary output', () => {
	const FAKE_INSTANCE_ID = 'not important to this suite';

	it('includes attachments in instance payload data', async () => {
		const scenario = await Scenario.init(
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

		const uploadName = 'upload.txt';
		const uploadData = 'uploaded file data';
		const uploadValue = new File([uploadData], uploadName, {
			type: 'text/plain',
		});

		scenario.answer('/data/file-upload', uploadValue);

		const { data } = await scenario.prepareWebFormsInstancePayload();
		const attachments = new Map(
			Array.from(data[0]).filter(([key]) => key !== ENGINE_CONSTANTS.INSTANCE_FILE_NAME)
		);

		expect(attachments.size).toBe(1);

		const attachment = attachments.get(uploadName);

		assert(attachment != null);
		expect(attachment.name).toBe(uploadName);

		const actualData = await getBlobText(attachment);

		expect(actualData).toBe(uploadData);
	});
});
