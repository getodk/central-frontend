import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
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

type InstanceRoundTripInitializationMode = 'edit' | 'restore';

interface InstanceRoundTripCase {
	readonly initializationMode: InstanceRoundTripInitializationMode;
}

describe.each<InstanceRoundTripCase>([
	{ initializationMode: 'restore' },
	{ initializationMode: 'edit' },
])('Instance attachments: binary input - mode: $initializationMode', ({ initializationMode }) => {
	const scenarioFromCurrentInstanceState = async (scenario: Scenario): Promise<Scenario> => {
		switch (initializationMode) {
			case 'edit':
				return scenario.proposed_editCurrentInstanceState();

			case 'restore':
				return scenario.proposed_serializeAndRestoreInstanceState();

			default:
				throw new UnreachableError(initializationMode);
		}
	};

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

	type PreviousStateTerm = 'serialized' | 'submitted';

	const PREVIOUS_STATE_TERM: PreviousStateTerm =
		initializationMode === 'edit' ? 'submitted' : 'serialized';

	it(`initializes with previously ${PREVIOUS_STATE_TERM} instance attachment data`, async () => {
		const uploadName = 'upload.txt';
		const uploadData = 'uploaded file data';
		const uploadValue = new File([uploadData], uploadName, {
			type: 'text/plain',
		});

		scenario.answer('/data/file-upload', uploadValue);

		const result = await scenarioFromCurrentInstanceState(scenario);

		await expect(result.answerOf('/data/file-upload')).toEqualUploadedAnswer(
			binaryAnswer(uploadValue)
		);
	});
});
