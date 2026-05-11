import { UnclearApplicabilityError } from '../error/UnclearApplicabilityError.ts';
import type { JRTreeReference } from '../jr/xpath/JRTreeReference.ts';
import type { RecordAudioActionListener } from './RecordAudioActionListener.ts';

/**
 * @todo If we intend to support the `odk:recordaudio` action, how should we
 * test it? See notes on the second test in `actions-events.test.ts` for more
 * detailed thoughts on this.
 */
export class CapturingRecordAudioActionListener implements RecordAudioActionListener {
	constructor() {
		throw new UnclearApplicabilityError('CapturingRecordAudioActionListener');
	}

	recordAudioTriggered(): never {
		throw new UnclearApplicabilityError(
			'CapturingRecordAudioActionListener (as RecordAudioActionListener)'
		);
	}

	getAbsoluteTargetRef(): JRTreeReference {
		throw new UnclearApplicabilityError('CapturingRecordAudioActionListener');
	}

	getQuality(): string {
		throw new UnclearApplicabilityError('CapturingRecordAudioActionListener');
	}
}
