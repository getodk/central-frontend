import { IncompatibleRuntimeEnvironmentError } from '../../error/IncompatibleRuntimeEnvironmentError.ts';

interface NodeConstructor {
	readonly prototype: Node;
	new (): Node;
}

type AssertNodeConstructor = (
	NodeConstructor: NodeConstructor | undefined
) => asserts NodeConstructor is NodeConstructor;

let didAssertNodeConstructor = false;

const assertNodeConstructor: AssertNodeConstructor = (NodeConstructor) => {
	if (didAssertNodeConstructor) {
		return;
	}

	const isExpectedFunctionSignature =
		typeof NodeConstructor === 'function' &&
		NodeConstructor.name === 'Node' &&
		NodeConstructor.length === 0;

	if (!isExpectedFunctionSignature || !(globalThis.document instanceof NodeConstructor)) {
		throw new IncompatibleRuntimeEnvironmentError();
	}

	didAssertNodeConstructor = true;
};

export const getNodeConstructor = (): NodeConstructor => {
	const { Node } = globalThis;

	assertNodeConstructor(Node);

	return Node;
};
