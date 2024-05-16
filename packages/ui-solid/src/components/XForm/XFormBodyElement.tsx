import type {
	GeneralChildNode,
	GroupNode,
	RepeatRangeNode,
	SelectNode,
	StringNode,
} from '@getodk/xforms-engine';
import { Match, Show, Switch } from 'solid-js';
import { XFormGroup } from './containers/XFormGroup.tsx';
import { XFormControl } from './controls/XFormControl.tsx';

interface XFormUnknownElementProps {
	readonly node: GeneralChildNode;
}

const XFormUnknownElement = (_?: XFormUnknownElementProps) => {
	return <></>;
};

type GroupLikeNode = GroupNode | RepeatRangeNode;

const groupLikeNode = (props: XFormBodyElementProps): GroupLikeNode | null => {
	const { node } = props;

	switch (node.nodeType) {
		case 'group':
		case 'repeat-range':
			return node;

		default:
			return null;
	}
};

type ControlNode = SelectNode | StringNode;

const controlNode = (props: XFormBodyElementProps): ControlNode | null => {
	const { node } = props;

	switch (node.nodeType) {
		case 'select':
		case 'string':
			return node;

		default:
			return null;
	}
};

export interface XFormBodyElementProps {
	readonly node: GeneralChildNode;
}

export const XFormBodyElement = (props: XFormBodyElementProps) => {
	return (
		<Show when={props.node.definition.bodyElement != null}>
			<Switch fallback={<XFormUnknownElement {...props} />}>
				<Match when={groupLikeNode(props)} keyed={true}>
					{(node) => <XFormGroup node={node} />}
				</Match>
				<Match when={controlNode(props)} keyed={true}>
					{(node) => {
						return <XFormControl node={node} />;
					}}
				</Match>
			</Switch>
		</Show>
	);
};
