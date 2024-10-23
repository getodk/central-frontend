import { Reiterable, tee } from '../../lib/iterators/index.ts';
import type { NodeSetResultType } from './BaseResult.ts';
import { BaseResult } from './BaseResult.ts';
import type { XPathEvaluationResult } from './XPathEvaluationResult.ts';

interface ComputedNodeSetResult {
	readonly computedBooleanValue: boolean;
	readonly computedNumberValue: number;
	readonly computedStringValue: string;
}

export abstract class NodeSetResult extends BaseResult implements XPathEvaluationResult {
	protected readonly nodes: Iterable<Node>;

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

	protected computedSnapshotValue: readonly Node[] | null = null;

	abstract override readonly resultType: NodeSetResultType;

	constructor(protected readonly value: Iterable<Node>) {
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

export class NodeSetSnapshotResult extends NodeSetResult {
	// Exposed for convenience
	readonly snapshot: readonly Node[];

	// Exposed for convenience
	readonly snapshotIterator: IterableIterator<Node>;

	readonly snapshotLength: number;

	// TODO: validity in spec/native likely refers to DOM mutation...?
	readonly invalidIteratorState: boolean = false;
	readonly singleNodeValue: Node | null;

	constructor(
		readonly resultType: NodeSetResultType,
		nodes: Iterable<Node>
	) {
		const snapshot = [...Reiterable.from(nodes)];

		super(snapshot);

		const snapshotIterator = snapshot.values();

		this.snapshot = snapshot;
		this.snapshotIterator = snapshotIterator;
		this.snapshotLength = snapshot.length;
		this.singleNodeValue = snapshot[0] ?? null;
	}

	iterateNext(): Node | null {
		const next = this.snapshotIterator.next();

		if (next.done) {
			return null;
		}

		return next.value;
	}

	snapshotItem(index: number): Node | null {
		return this.snapshot[index] ?? null;
	}
}

class InvalidSnapshotError extends Error {
	constructor() {
		super('Result is not a snapshot');
	}
}

export class NodeSetIteratorResult extends NodeSetResult {
	protected activeIterator: IterableIterator<Node> | null = null;
	protected override nodes: Reiterable<Node>;

	// TODO: validity in spec/native likely refers to DOM mutation...?
	readonly invalidIteratorState: boolean = false;

	protected computedSingleNodeValue: Node | null | undefined = undefined;

	get singleNodeValue(): Node | null {
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
		readonly resultType: NodeSetResultType,
		nodes: Iterable<Node>
	) {
		super(nodes);

		this.nodes = Reiterable.from(nodes);
	}

	protected activateIterator(): IterableIterator<Node> {
		let { activeIterator } = this;

		if (activeIterator == null) {
			[activeIterator] = tee(this.value);
			this.activeIterator = activeIterator;
		}

		return activeIterator;
	}

	iterateNext(): Node | null {
		const iterator = this.activateIterator();

		const next = iterator.next();

		if (next.done) {
			return null;
		}

		return next.value;
	}

	snapshotItem(_index: number): Node | null {
		throw new InvalidSnapshotError();
	}
}
