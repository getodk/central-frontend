import type { BodyClassList } from '../parse/body/BodyDefinition.ts';
import type { RootDefinition } from '../parse/model/RootDefinition.ts';
import type { BaseNode, BaseNodeState } from './BaseNode.ts';
import type { ActiveLanguage, FormLanguage, FormLanguages } from './FormLanguage.ts';
import type { GeneralChildNode } from './hierarchy.ts';
import type {
	ChunkedInstancePayload,
	InstancePayload,
	MonolithicInstancePayload,
} from './serialization/InstancePayload.ts';
import type {
	InstancePayloadOptions,
	InstancePayloadType,
} from './serialization/InstancePayloadOptions.ts';
import type { AncestorNodeValidationState } from './validation.ts';

export interface RootNodeState extends BaseNodeState {
	/**
	 * @todo If we ever expose an interface to the primary instance document, it
	 * would make sense to move this state up.
	 */
	get activeLanguage(): ActiveLanguage;

	get label(): null;
	get hint(): null;
	get children(): readonly GeneralChildNode[];
	get valueOptions(): null;
	get value(): null;
}

export interface RootNode extends BaseNode {
	readonly nodeType: 'root';

	/**
	 * @todo this along with {@link classes} is... awkward.
	 */
	readonly appearances: null;

	readonly nodeOptions: null;

	/**
	 * @todo This is another odd deviation in {@link RootNode}. Unlike
	 * {@link languages}, it doesn't feel particularly **essential**. While it
	 * would deviate from XForms spec terminology, it seems like it _might be
	 * reasonable_ to instead convey `<h:body class="...">` as
	 * {@link RootNode.appearances} in the client interface. They do have slightly
	 * different spec semantics (i.e. a body class can be anything, to trigger
	 * styling in a form UI). But the **most likely anticipated** use case in Web
	 * Forms would be the "pages" class, and perhaps "theme-grid". The former is
	 * definitely conceptually similar to a XForms `appearance` (albeit
	 * form-global, which is not a spec concept). The latter does as well, and we
	 * already anticipate applying that concept in non-form-global ways.
	 */
	readonly classes: BodyClassList;

	readonly definition: RootDefinition;
	readonly root: RootNode;
	readonly parent: unknown;
	readonly currentState: RootNodeState;
	readonly validationState: AncestorNodeValidationState;

	/**
	 * @todo as discussed on {@link RootNodeState.activeLanguage}
	 */
	readonly languages: FormLanguages;

	setLanguage(language: FormLanguage): RootNode;

	/**
	 * Prepares the current form instance state as an {@link InstancePayload}.
	 *
	 * A payload will be prepared even if the current form state includes
	 * `constraint` or `required` violations. This supports serveral purposes:
	 *
	 * - A client may effectively use this method as a part of its "submit"
	 *   workflow, and use any violations included in the {@link InstancePayload}
	 *   to prompt users to address those violations.
	 *
	 * - A client may inspect the serialized instance state of a form at any time.
	 *   Depending on the client and use case, this may be a convenience (e.g. for
	 *   developers to inspect that form state at a current point in time); or it
	 *   may provide necessary functionality (e.g. for test or tooling clients).
	 *
	 * - A client may capture _incomplete_ instance state (e.g. for storage in
	 *   client-side storage or similar persistance layer), to resume filling the
	 *   instance at a later time.
	 *
	 * Note on asynchrony: preparing a {@link InstancePayload} is expected to be a
	 * fast operation. It may even be nearly instantaneous, or roughly
	 * proportionate to the size of the form itself. However, this method is
	 * designed to be asynchronous out of an abundance of caution, anticipating
	 * that some as-yet undeveloped operations on binary data (e.g. form
	 * attachments) may themselves impose asynchrony (i.e. by interfaces provided
	 * by the platform and/or external dependencies).
	 *
	 * A client may specify {@link InstancePayloadOptions<'chunked'>}, in which
	 * case a {@link ChunkedInstancePayload} will be produced, with form
	 * attachments
	 */
	prepareInstancePayload(
		options?: InstancePayloadOptions<'monolithic'>
	): Promise<MonolithicInstancePayload>;
	prepareInstancePayload(
		options: InstancePayloadOptions<'chunked'>
	): Promise<ChunkedInstancePayload>;
	prepareInstancePayload<PayloadType extends InstancePayloadType>(
		options: InstancePayloadOptions<PayloadType>
	): Promise<InstancePayload<PayloadType>>;
}
