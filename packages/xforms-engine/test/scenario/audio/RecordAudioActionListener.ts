/**
 * @todo If we intend to support the `odk:recordaudio` action, how should we
 * test it? See notes on the second test in `actions-events.test.ts` for more
 * detailed thoughts on this.
 */
export interface RecordAudioActionListener {
	recordAudioTriggered(absoluteTargetRef: unknown, quality: unknown): never;
}
