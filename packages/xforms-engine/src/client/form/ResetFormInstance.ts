import type { RootNode } from '../RootNode.ts';
import type { CreatedFormInstance } from './CreateFormInstance.ts';
import type { FormInstanceConfig } from './FormInstanceConfig.ts';
import type { LoadForm } from './LoadForm.ts';
import type { LoadFormResult } from './LoadFormResult.ts';

/**
 * @todo This is fallible! Client-facing interfaces will need to account for
 * this. We've begun addressing fallibility _at the interface level_ in
 * {@link LoadForm} (with {@link LoadFormResult}). We'll eventually have a more
 * general interface pattern for this, and we'll apply it here as well. The baby
 * step approach in {@link LoadFormResult} is impractical here due to
 * engine-internal designs, and revising that is currently out of scope. As
 * such, explicit interface-level documentation of fallibility is deferred here,
 * on {@link RootNode} itself, and into any of its sub-interfaces.
 */
export type ResetFormInstance = (config?: FormInstanceConfig) => CreatedFormInstance;
