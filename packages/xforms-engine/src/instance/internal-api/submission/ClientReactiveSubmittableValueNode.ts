import type { InstanceState } from '../../../client/serialization/InstanceState.ts';
import type { QualifiedName } from '../../../lib/names/QualifiedName.ts';
import type {
	ClientReactiveSubmittableChildNode,
	ClientReactiveSubmittableParentNode,
} from './ClientReactiveSubmittableParentNode.ts';

interface ClientReactiveSubmittableValueNodeCurrentState {
	get relevant(): boolean;

	/**
	 * @todo Consider moving into {@link InstanceState}
	 */
	get instanceValue(): string;
}

export type SerializedSubmissionValue = string;

interface ClientReactiveSubmittableValueNodeDefinition {
	readonly qualifiedName: QualifiedName;
}

export interface ClientReactiveSubmittableValueNode {
	readonly definition: ClientReactiveSubmittableValueNodeDefinition;
	readonly parent: ClientReactiveSubmittableParentNode<ClientReactiveSubmittableChildNode>;
	readonly currentState: ClientReactiveSubmittableValueNodeCurrentState;
	readonly instanceState: InstanceState;
}
