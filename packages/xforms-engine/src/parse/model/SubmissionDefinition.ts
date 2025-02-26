import type { SubmissionMeta } from '../../client/submission/SubmissionMeta.ts';
import { getSubmissionElement } from '../../lib/dom/query.ts';
import type { XFormDOM } from '../XFormDOM.ts';

export class SubmissionDefinition implements SubmissionMeta {
	readonly submissionAction!: URL | null;
	readonly submissionMethod = 'post';
	readonly encryptionKey!: string | null;

	constructor(xformDOM: XFormDOM) {
		const submissionElement = getSubmissionElement(xformDOM.model);

		let submissionAction: URL | null = null;
		let submissionMethod: 'post';
		let encryptionKey: string | null = null;

		if (submissionElement == null) {
			submissionAction = null;
			submissionMethod = 'post';
			encryptionKey = null;
		} else {
			const method = submissionElement.getAttribute('method')?.trim();

			if (method == null || method === 'post' || method === 'form-data-post') {
				submissionMethod = 'post';
			} else {
				throw new Error(`Unexpected <submission method>: ${method}`);
			}

			const action = submissionElement.getAttribute('action');

			if (action != null) {
				// TODO: this is known-fallible.
				submissionAction = new URL(action.trim());
			}

			encryptionKey = submissionElement.getAttribute('base64RsaPublicKey');
		}

		this.submissionAction = submissionAction;
		this.submissionMethod = submissionMethod;
		this.encryptionKey = encryptionKey;
	}
}
