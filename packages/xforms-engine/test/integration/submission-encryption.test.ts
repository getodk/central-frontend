import { getBlobText } from '@getodk/common/lib/web-compat/blob.ts';
import {
	bind,
	body,
	head,
	html,
	input,
	label,
	mainInstance,
	model,
	t,
	title,
} from '@getodk/common/test-utils/xform-dsl/index.ts';
import type { XFormsElement } from '@getodk/common/test-utils/xform-dsl/XFormsElement.ts';
import { describe, expect, it } from 'vitest';
import { Scenario } from '../scenario/jr/Scenario.ts';

describe('Form submission encryption', () => {
	const DEFAULT_INSTANCE_ID = 'uuid:TODO-mock-xpath-functions';

	// prettier-ignore
	type SubmissionFixtureElements =
		| readonly []
		| readonly [XFormsElement];

	interface BuildSubmissionPayloadScenario {
		readonly submissionElements?: SubmissionFixtureElements;
	}

	const buildSubmissionPayloadScenario = async (
		options?: BuildSubmissionPayloadScenario
	): Promise<Scenario> => {
		const scenario = await Scenario.init(
			'Encrypted',
			html(
				head(
					title('Encrypted'),
					model(
						mainInstance(t('data id="encrypted"', t('inp', 'test'), t('meta', t('instanceID')))),
						...(options?.submissionElements ?? []),
						bind('/data/inp').required(),
						bind('/data/meta/instanceID').calculate(`'${DEFAULT_INSTANCE_ID}'`)
					)
				),
				body(input('/data/rep/inp', label('inp')))
			)
		);

		return scenario;
	};

	it('generates an encrypted submission with a submission metadata file and an encoded attachment', async () => {
		const base64RsaPublicKey =
			'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwkP+HQEqkyb4HPLOekvn6imYW6Ze2dF2sLCspnzimOnbiF7C1mcd01xiau+9WgU23kM35URhBQVbDHtbQMgZL/Ol+xdA0zdbcUW00Z7EkYmM4sGu4wwJA2eQ6yhBbY2np+kDTvmVHlhP8DDYsXJKqtm+8bXlI36qjVgkVPXjT9YNAA4vRxPReP5wuXHrMGjclPyU6SlFZZm8QLknYV9cmGh1CquKxK7/hIoGIZ3j+edh2GZg8XJo3ZkgAwOwNUqF9b4kXw+tnbpqLXfcETX3fp6iXqLqNMt3E1MXXMnePfDqsa9wrcykUMKfxLXF/EyhIZ+2+iBoyRKeIkExwJRMdQIDAQAB';
		const scenario = await buildSubmissionPayloadScenario({
			submissionElements: [t(`submission base64RsaPublicKey="${base64RsaPublicKey}"`)],
		});
		const submissionResult = await scenario.prepareWebFormsInstancePayload();

		expect(submissionResult.submissionMeta).toMatchObject({
			encryptionKey: base64RsaPublicKey,
		});

		expect(submissionResult.data.length).to.equal(1);
		const entries = submissionResult.data[0].entries();

		const [submissionFilename, file] = entries.next().value!;
		expect(submissionFilename).to.equal('xml_submission_file');
		const submission = await getBlobText(file);
		expect(submission).to.contain(
			'<data xmlns="http://www.opendatakit.org/xforms/encrypted" encrypted="yes" id="encrypted">'
		);
		expect(submission).to.contain('<encryptedXmlFile>submission.xml.enc</encryptedXmlFile>');
		expect(submission).to.contain(
			'<meta xmlns="http://openrosa.org/xforms"><instanceID>uuid:TODO-mock-xpath-functions</instanceID></meta>'
		);

		const [encodedFilename] = entries.next().value!;
		expect(encodedFilename).to.equal('submission.xml.enc');
	});
});
