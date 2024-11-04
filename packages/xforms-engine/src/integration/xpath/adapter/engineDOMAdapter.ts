import type { XPathDOMAdapter } from '@getodk/xpath';
import type { EngineXPathNode } from './kind.ts';
import { getEngineXPathNodeKind, isEngineXPathNode } from './kind.ts';

export interface EngineDOMAdapter extends XPathDOMAdapter<EngineXPathNode> {}

// @ts-expect-error - temporary to break adapter implementation into separate commits
export const engineDOMAdapter: EngineDOMAdapter = {
	// XPathNodeKindAdapter
	getNodeKind: getEngineXPathNodeKind,
	isXPathNode: isEngineXPathNode,
};
