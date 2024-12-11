import type { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL.ts';

export type FormAttachmentDataType = 'media' | 'secondary-instance';

/**
 * @todo This type anticipates work to support media form attachments, which
 * will tend to be associated with binary data. The
 * expectation is that:
 *
 * - {@link Blob} would be appropriate for representing data from attachment
 *   resources which are conventionally loaded to completion (where network
 *   conditions are favorable), such as images
 *
 * - {@link MediaSource} or {@link ReadableStream} may be more appropriate for
 *   representing data from resources which are conventionally streamed in a
 *   browser context (often regardless of network conditions), such as video and
 *   audio
 */
// prettier-ignore
export type FormAttachmentMediaData =
	| Blob
	| MediaSource
	| ReadableStream<unknown>;

export type FormAttachmentSecondaryInstanceData = string;

// prettier-ignore
type FormAttachmentData<DataType extends FormAttachmentDataType> =
	DataType extends 'media'
		? FormAttachmentMediaData
		: FormAttachmentSecondaryInstanceData;

export abstract class FormAttachmentResource<DataType extends FormAttachmentDataType> {
	protected constructor(
		readonly dataType: DataType,
		readonly resourceURL: JRResourceURL,
		readonly contentType: string,
		readonly data: FormAttachmentData<DataType>
	) {}
}
