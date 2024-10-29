import type { XPathNode } from '../../adapter/interface/XPathNode.ts';
import type { XPathDOMProvider } from '../../adapter/xpathDOMProvider.ts';
import { Reiterable, tee } from '../../lib/iterators/index.ts';
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
	protected readonly nodes: Iterable<T>;

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
		protected readonly value: Iterable<T>
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
			computedStringValue = this.singleNodeValue?.textContent ?? '';

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
		nodes: Iterable<T>
	) {
		const snapshot = [...Reiterable.from(nodes)];

		super(domProvider, snapshot);

		const snapshotIterator = snapshot.values();

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
	protected activeIterator: IterableIterator<T> | null = null;
	protected override nodes: Reiterable<T>;

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
		nodes: Iterable<T>
	) {
		super(domProvider, nodes);

		this.nodes = Reiterable.from(nodes);
	}

	protected activateIterator(): IterableIterator<T> {
		let { activeIterator } = this;

		if (activeIterator == null) {
			[activeIterator] = tee(this.value);
			this.activeIterator = activeIterator;
		}

		return activeIterator;
	}

	iterateNext(): T | null {
		const iterator = this.activateIterator();

		const next = iterator.next();

		if (next.done) {
			return null;
		}

		return next.value;
	}

	snapshotItem(_index: number): T | null {
		throw new InvalidSnapshotError();
	}
}
