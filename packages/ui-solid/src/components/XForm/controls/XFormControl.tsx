import type { SelectNode, StringNode } from '@getodk/xforms-engine';
import { Match, Switch, createMemo } from 'solid-js';
import { XFormRelevanceGuard } from '../XFormRelevanceGuard.tsx';
import { XFormUnknownControl } from '../debugging/XFormUnknownControl.tsx';
import { SelectControl } from './SelectControl.tsx';
import { XFormInputControl } from './XFormInputControl.tsx';

// prettier-ignore
type ControlNode =
	| SelectNode
	| StringNode;

export interface XFormControlProps {
	readonly node: ControlNode;
}

const stringInputNode = (node: ControlNode): StringNode | null => {
	if (node.nodeType === 'string') {
		return node;
	}

	return null;
};

const selectNode = (node: ControlNode): SelectNode | null => {
	if (node.nodeType === 'select') {
		return node;
	}

	return null;
};

export const XFormControl = (props: XFormControlProps) => {
	const isRelevant = createMemo(() => {
		return props.node.currentState.relevant;
	});

	return (
		<XFormRelevanceGuard isRelevant={isRelevant()}>
			<Switch fallback={<XFormUnknownControl {...props} />}>
				<Match when={stringInputNode(props.node)} keyed={true}>
					{(node) => {
						return <XFormInputControl node={node} />;
					}}
				</Match>
				<Match when={selectNode(props.node)} keyed={true}>
					{(node) => {
						return <SelectControl node={node} />;
					}}
				</Match>
			</Switch>
		</XFormRelevanceGuard>
	);
};
