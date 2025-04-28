import type { XPathNode } from '../../adapter/interface/XPathNode.ts';
import type { XPathDOMProvider } from '../../adapter/xpathDOMProvider.ts';
import type { NodeSetResultType } from './BaseResult.ts';
import { BaseResult } from './BaseResult.ts';
import type { XPathEvaluationResult } from './XPathEvaluationResult.ts';

interface ComputedNodeSetResult {
	readonly computedBooleanValue: boolean;
	readonly computedNumberValue: number;
	readonly computedStringValue: string;
}

export abstract class NodeSetResult<T extends XPathNode>
	extends BaseResult<T>
	implements XPathEvaluationResult<T>
{
	protected readonly nodes: ReadonlySet<T>;

	protected computedBooleanValue: boolean | null = null;
	protected computedNumberValue: number | null = null;
	protected computedStringValue: string | null = null;

	get booleanValue(): boolean {
		const { computedBooleanValue } = this.compute();

		return computedBooleanValue;
	}

	get numberValue(): number {
		const { computedNumberValue } = this.compute();

		return computedNumberValue;
	}

	get stringValue(): string {
		const { computedStringValue } = this.compute();

		return computedStringValue;
	}

	protected computedSnapshotValue: readonly T[] | null = null;

	abstract override readonly resultType: NodeSetResultType;

	constructor(
		protected readonly domProvider: XPathDOMProvider<T>,
		value: ReadonlySet<T>
	) {
		super();
		this.nodes = value;
	}

	protected compute(): ComputedNodeSetResult {
		let { computedBooleanValue, computedNumberValue, computedStringValue } = this;

		if (
			computedBooleanValue == null ||
			computedNumberValue == null ||
			computedStringValue == null
		) {
			const { singleNodeValue } = this;

			if (singleNodeValue == null) {
				computedStringValue = '';
			} else {
				computedStringValue = this.domProvider.getNodeValue(singleNodeValue);
			}

			const isBlank = computedStringValue === '';

			computedBooleanValue = !isBlank;
			computedNumberValue = isBlank ? NaN : Number(computedStringValue);
		}

		return {
			computedBooleanValue,
			computedNumberValue,
			computedStringValue,
		};
	}
}

export class NodeSetSnapshotResult<T extends XPathNode>
	extends NodeSetResult<T>
	implements XPathEvaluationResult<T>
{
	// Exposed for convenience
	readonly snapshot: readonly T[];

	// Exposed for convenience
	readonly snapshotIterator: IterableIterator<T>;

	readonly snapshotLength: number;

	// TODO: validity in spec/native likely refers to DOM mutation...?
	readonly invalidIteratorState: boolean = false;
	readonly singleNodeValue: T | null;

	constructor(
		domProvider: XPathDOMProvider<T>,
		readonly resultType: NodeSetResultType,
		nodes: ReadonlySet<T>
	) {
		const snapshot = Array.from(nodes);

		super(domProvider, nodes);

		const snapshotIterator = nodes.values();

		this.snapshot = snapshot;
		this.snapshotIterator = snapshotIterator;
		this.snapshotLength = snapshot.length;
		this.singleNodeValue = snapshot[0] ?? null;
	}

	iterateNext(): T | null {
		const next = this.snapshotIterator.next();

		if (next.done) {
			return null;
		}

		return next.value;
	}

	snapshotItem(index: number): T | null {
		return this.snapshot[index] ?? null;
	}
}

class InvalidSnapshotError extends Error {
	constructor() {
		super('Result is not a snapshot');
	}
}

export class NodeSetIteratorResult<T extends XPathNode>
	extends NodeSetResult<T>
	implements XPathEvaluationResult<T>
{
	protected readonly activeIterator: IterableIterator<T>;

	// TODO: validity in spec/native likely refers to DOM mutation...?
	readonly invalidIteratorState: boolean = false;

	protected computedSingleNodeValue: T | null | undefined = undefined;

	get singleNodeValue(): T | null {
		let { computedSingleNodeValue } = this;

		if (typeof computedSingleNodeValue === 'undefined') {
			computedSingleNodeValue = null;

			for (const node of this.nodes) {
				computedSingleNodeValue = node;
				break;
			}

			this.computedSingleNodeValue = computedSingleNodeValue;
		}

		return computedSingleNodeValue;
	}

	get snapshotLength(): number {
		throw new InvalidSnapshotError();
	}

	constructor(
		domProvider: XPathDOMProvider<T>,
		readonly resultType: NodeSetResultType,
		nodes: ReadonlySet<T>
	) {
		super(domProvider, nodes);

		this.activeIterator = nodes.values();
	}

	iterateNext(): T | null {
		const next = this.activeIterator.next();

		if (next.done) {
			return null;
		}

		return next.value;
	}

	snapshotItem(_index: number): T | null {
		throw new InvalidSnapshotError();
	}
}
