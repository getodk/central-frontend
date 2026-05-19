import type { RootNode } from '../RootNode.ts';

export interface InstanceState {
	/**
	 * Represents the serialized XML state of a given node. The value produced in
	 * {@link RootNode.instanceState} is the same serialization which will be
	 * produced for a complete instance.
	 *
	 * @todo Note that this particular aspect of the design doesn't yet address
	 * production of unique file names. As such, this may change as we introduce
	 * affected data types (and their supporting nodes).
	 */
	get instanceXML(): string;
}
