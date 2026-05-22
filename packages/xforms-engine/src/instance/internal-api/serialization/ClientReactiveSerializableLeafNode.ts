import type { InstanceState } from '../../../client/serialization/InstanceState.ts';
import type { QualifiedName } from '../../../lib/names/QualifiedName.ts';
import type { EscapedXMLText } from '../../../lib/xml-serialization.ts';
import type {
	ClientReactiveSerializableChildNode,
	ClientReactiveSerializableParentNode,
} from './ClientReactiveSerializableParentNode.ts';

interface ClientReactiveSerializableLeafNodeCurrentState<RuntimeValue> {
	get relevant(): boolean;
	get value(): RuntimeValue;
}

export type SerializedInstanceValue = string;

interface ClientReactiveSerializableLeafNodeDefinition {
	readonly qualifiedName: QualifiedName;
}

export interface ClientReactiveSerializableLeafNode<RuntimeValue> {
	readonly definition: ClientReactiveSerializableLeafNodeDefinition;
	readonly parent: ClientReactiveSerializableParentNode<ClientReactiveSerializableChildNode>;
	readonly currentState: ClientReactiveSerializableLeafNodeCurrentState<RuntimeValue>;

	/**
	 * A client-reactive serializble leaf node is responsible for producing a
	 * string representation of its value state, suitable for instance
	 * serialization. It **MUST NOT** perform any further instance
	 * serialization-specific serialization duties: in particular, the value
	 * **MUST NOT** be escaped for XML. This responsibility is delegated up the
	 * stack, to avoid repeat escaping.
	 *
	 * Note: excluding {@link EscapedXMLText} here does not have an effect on the
	 * type system, it is a documentation-only hint, to help guard against future
	 * double-escaping mistakes.
	 */
	readonly encodeValue: (
		this: unknown,
		runtimeValue: RuntimeValue
	) => Exclude<string, EscapedXMLText>;

	readonly instanceState: InstanceState;
}
