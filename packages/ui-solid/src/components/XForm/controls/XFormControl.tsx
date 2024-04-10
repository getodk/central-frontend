import type { SelectNode, StringNode } from '@odk-web-forms/xforms-engine';
import { Match, Switch, createMemo } from 'solid-js';
import { XFormRelevanceGuard } from '../XFormRelevanceGuard.tsx';
import { XFormUnknownControl } from '../debugging/XFormUnknownControl.tsx';
import { SelectControl } from './SelectControl.tsx';
import { XFormInputControl, type XFormInputControlProps } from './XFormInputControl.tsx';

/**
 * @todo see commentary on {@link XFormInputControlProps.node}
 */
// prettier-ignore
type ControlNode =
	| SelectNode
	| XFormInputControlProps['node'];

export interface XFormControlProps {
	readonly node: ControlNode;
}

/**
 * @todo see commentary on {@link XFormInputControlProps.node}
 */
const stringInputNode = (node: ControlNode): StringNode | null => {
	if (node.nodeType === 'string' && node.definition.bodyElement != null) {
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
