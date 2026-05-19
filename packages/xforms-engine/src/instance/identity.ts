import type { FormNodeID } from '../client/identity.ts';

export const nodeID = (id: string): FormNodeID => {
	return `node:${id}` satisfies FormNodeID;
};
