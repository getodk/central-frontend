import { UnclearApplicabilityError } from '../error/UnclearApplicabilityError.ts';
import type { RecordAudioActionListener } from './RecordAudioActionListener.ts';

/**
 * @todo If we intend to support the `odk:recordaudio` action, how should we
 * test it? See notes on the second test in `actions-events.test.ts` for more
 * detailed thoughts on this.
 */
export class RecordAudioActions {
	static setRecordAudioListener(_listener: RecordAudioActionListener): void {
		throw new UnclearApplicabilityError('RecordAudioActions');
	}
}
