declare const NODE_ID_BRAND: unique symbol;
type NODE_ID_BRAND = typeof NODE_ID_BRAND;

export type NodeID = string & { readonly [NODE_ID_BRAND]: true };

// Just another added safeguard to ensure we're not mistakenly handling
// rando `NodeID` strings which aren't explicitly attached to the node
// types we expect.
export const declareNodeID = (id: string): NodeID => {
	return id as NodeID;
};
