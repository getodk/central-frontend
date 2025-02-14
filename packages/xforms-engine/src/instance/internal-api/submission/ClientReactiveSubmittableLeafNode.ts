import type { SubmissionState } from '../../../client/submission/SubmissionState.ts';
import type { QualifiedName } from '../../../lib/names/QualifiedName.ts';
import type { EscapedXMLText } from '../../../lib/xml-serialization.ts';
import type {
	ClientReactiveSubmittableChildNode,
	ClientReactiveSubmittableParentNode,
} from './ClientReactiveSubmittableParentNode.ts';

interface ClientReactiveSubmittableLeafNodeCurrentState<RuntimeValue> {
	get relevant(): boolean;
	get value(): RuntimeValue;
}

export type SerializedSubmissionValue = string;

interface ClientReactiveSubmittableLeafNodeDefinition {
	readonly qualifiedName: QualifiedName;
}

export interface ClientReactiveSubmittableLeafNode<RuntimeValue> {
	readonly definition: ClientReactiveSubmittableLeafNodeDefinition;
	readonly parent: ClientReactiveSubmittableParentNode<ClientReactiveSubmittableChildNode>;
	readonly currentState: ClientReactiveSubmittableLeafNodeCurrentState<RuntimeValue>;

	/**
	 * A client-reactive submittable leaf node is responsible for producing a
	 * string representation of its value state, suitable for serialization for
	 * submission. It **MUST NOT** perform any further submission-specific
	 * serialization duties: in particular, the value **MUST NOT** be escaped for
	 * XML. This responsibility is delegated up the stack, to avoid repeat
	 * escaping.
	 *
	 * Note: excluding {@link EscapedXMLText} here does not have an effect on the
	 * type system, it is a documentation-only hint, to help guard against future
	 * double-escaping mistakes.
	 */
	readonly encodeValue: (
		this: unknown,
		runtimeValue: RuntimeValue
	) => Exclude<string, EscapedXMLText>;

	readonly submissionState: SubmissionState;
}
