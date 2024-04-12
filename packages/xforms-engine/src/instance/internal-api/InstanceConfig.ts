import type { EngineConfig } from '../../client/EngineConfig.ts';
import type { CreateUniqueId } from '../../lib/unique-id.ts';

export interface InstanceConfig extends Required<EngineConfig> {
	/**
	 * Uniqueness per form instance session (so e.g. persistence isn't necessary).
	 */
	readonly createUniqueId: CreateUniqueId;
}
