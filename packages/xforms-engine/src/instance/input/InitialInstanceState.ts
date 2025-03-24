import { getBlobText } from '@getodk/common/lib/web-compat/blob.ts';
import { INSTANCE_FILE_NAME } from '../../client/constants.ts';
import type {
	EditFormInstanceInput,
	ResolvableFormInstanceInput,
} from '../../client/form/EditFormInstance.ts';
import type { InstanceData } from '../../client/serialization/InstanceData.ts';
import { ErrorProductionDesignPendingError } from '../../error/ErrorProductionDesignPendingError.ts';
import type { StaticDocument } from '../../integration/xpath/static-dom/StaticDocument.ts';
import type { ModelDefinition } from '../../parse/model/ModelDefinition.ts';
import { parseInstanceXML } from '../../parse/shared/parseInstanceXML.ts';
import type { XFormDOM } from '../../parse/XFormDOM.ts';
import { InstanceAttachmentMap } from './InstanceAttachmentMap.ts';

export type InitialInstanceStateSources = readonly [InstanceData, ...InstanceData[]];

interface InitialInstanceStateOptions {
	readonly instanceXML: string;
	readonly attachments: InstanceAttachmentMap;
}

const resolveInstanceXML = async (input: ResolvableFormInstanceInput): Promise<string> => {
	const instanceResult = await input.resolveInstance();

	if (typeof instanceResult === 'string') {
		return instanceResult;
	}

	if (instanceResult instanceof Blob) {
		return getBlobText(instanceResult);
	}

	return instanceResult.text();
};

const parseInstanceDocument = (model: ModelDefinition, instanceXML: string): StaticDocument => {
	const doc = parseInstanceXML(model, instanceXML);

	/**
	 * Note: this is presently inferred as nullable. Its presence is _currently_
	 * enforced by {@link XFormDOM}, though that's definitely not ideal!
	 *
	 * @todo we would probably benefit from a single parse function responsible
	 * for both instance documents (form and input), with all `id` enforcement
	 * handled in one place (presence in both cases, matching in case of form +
	 * input). We could then also express this at the type level without weird DOM
	 * shenanigans in {@link XFormDOM} (which aren't likely to stick around in
	 * their current state forever!).
	 */
	const expectedId = model.instance.root.getAttributeValue('id');
	const actualId = doc.root.getAttributeValue('id');

	if (expectedId !== actualId) {
		throw new ErrorProductionDesignPendingError(
			`Invalid instance input. Expected instance id to be "${expectedId}", got: "${actualId}"`
		);
	}

	return doc;
};

export class InitialInstanceState {
	static async from(
		model: ModelDefinition,
		data: InitialInstanceStateSources
	): Promise<InitialInstanceState> {
		return this.resolve(model, {
			inputType: 'FORM_INSTANCE_INPUT_RESOLVED',
			data,
		});
	}

	static async resolve(
		model: ModelDefinition,
		input: EditFormInstanceInput
	): Promise<InitialInstanceState> {
		if (input.inputType === 'FORM_INSTANCE_INPUT_RESOLVED') {
			const { data } = input;
			const [instanceData] = data;
			const instanceFile = instanceData.get(INSTANCE_FILE_NAME);
			const instanceXML = await getBlobText(instanceFile);
			const attachments = InstanceAttachmentMap.from(data);

			return new this(model, {
				instanceXML,
				attachments,
			});
		}

		const [instanceXML, attachments] = await Promise.all([
			resolveInstanceXML(input),
			InstanceAttachmentMap.resolve(input.attachments),
		]);

		return new this(model, {
			instanceXML,
			attachments,
		});
	}

	readonly document: StaticDocument;
	readonly attachments: InstanceAttachmentMap;

	private constructor(model: ModelDefinition, options: InitialInstanceStateOptions) {
		this.document = parseInstanceDocument(model, options.instanceXML);
		this.attachments = options.attachments;
	}
}
