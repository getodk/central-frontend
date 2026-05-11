export interface SubmissionMeta {
	/**
	 * @see {@link https://getodk.github.io/xforms-spec/#submission-attributes | `action` submission attribute}
	 */
	readonly submissionAction: URL | null;

	/**
	 * @see {@link https://getodk.github.io/xforms-spec/#submission-attributes | `method` submission attribute}
	 */
	readonly submissionMethod: 'post';

	/**
	 * @see {@link https://getodk.github.io/xforms-spec/#submission-attributes | `base64RsaPublicKey` submission attribute}
	 */
	readonly encryptionKey: string | null;
}
