import { assertInstanceType } from '@getodk/common/lib/runtime-types/instance-predicates.ts';
import type {
	AnyInputNode,
	AnyNoteNode,
	AnyRangeNode,
	GroupNode,
	RankNode,
	RepeatInstanceNode,
	RepeatRangeUncontrolledNode,
	RootNode,
	SelectNode,
	TriggerNode,
	UploadNode,
} from '@getodk/xforms-engine';
import type { Scenario } from '../Scenario.ts';

// prettier-ignore
export type QuestionPositionalEventNode =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| AnyNoteNode
	| RankNode
	| SelectNode
	| AnyInputNode
	| AnyRangeNode
	| TriggerNode
	| UploadNode;

export interface PositionalEventTypeMapping {
	readonly BEGINNING_OF_FORM: RootNode;
	readonly QUESTION: QuestionPositionalEventNode;
	readonly GROUP: GroupNode;
	readonly REPEAT: RepeatInstanceNode;
	readonly REPEAT_JUNCTURE: never; // per @lognaturel: this can be ignored
	readonly PROMPT_NEW_REPEAT: RepeatRangeUncontrolledNode;
	readonly END_OF_FORM: null;
}

export type PositionalEventType = keyof PositionalEventTypeMapping;

// prettier-ignore
export type PositionalEventNode<
	Type extends PositionalEventType
> = PositionalEventTypeMapping[Type];

type AnyEventNode = PositionalEventNode<PositionalEventType>;

type UnknownPositionalEvent = PositionalEvent<PositionalEventType>;

const singletons = new Map<AnyEventNode, UnknownPositionalEvent>();

/**
 * Each subclass of this class represents:
 *
 * 0. One of JavaRosa's enumerated `FormEntryController` "events", which
 *    correspond to a position in a flattened, linear projection of a form
 *    instance's state.
 *
 * 1. Mapped to one of either:
 *   - An artificial landmark, representing the form's boundaries (in which case
 *     it is mapped to the form instance's {@link RootNode}).
 *   - A specific **user-facing** node corresponding to that positional state,
 *     i.e. <group>s, <repeat> instances, questions; "question" corresponds to
 *     the leaf nodes of a form with a corresponding user-interactive control.
 *   - An artificial landmark, representing the point at which a new <repeat>
 *     instance may be added. This roughly corresponds to a
 *     {@link AnyRepeatRangeNode | repeat range}, most specifically the end of
 *     that range.
 *
 * For those subclasses/"events" corresponding to a specific type of node, the
 * subclass may also implement additional node-specific behavior with which an
 * instance of the {@link Scenario} client might interact.
 */
export abstract class PositionalEvent<Type extends PositionalEventType> {
	static from<Type extends PositionalEventType, Inst extends PositionalEvent<Type>>(
		this: PositionalEventConstructor<Type, Inst>,
		node: PositionalEventConstructorNode<Type, Inst>
	): Inst {
		let singleton = singletons.get(node);

		if (singleton == null) {
			singleton = new this(node);
			singletons.set(node, singleton);
		}

		assertInstanceType(this, singleton);

		return singleton;
	}

	static cleanup(): void {
		singletons.clear();
	}

	abstract readonly eventType: Type;

	constructor(readonly node: PositionalEventNode<Type>) {}
}

type PositionalEventConstructor<
	Type extends PositionalEventType,
	Inst extends PositionalEvent<Type>,
> = new (node: Inst['node']) => Inst;

// prettier-ignore
type PositionalEventConstructorNode<
	Type extends PositionalEventType,
	Inst extends PositionalEvent<Type>
> =
	PositionalEventConstructor<Type, Inst> extends
	(new (node: infer T) => Inst)
		? T
		: never;
