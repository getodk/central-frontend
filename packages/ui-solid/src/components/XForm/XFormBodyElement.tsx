import type {
	GeneralChildNode,
	GroupNode,
	NoteNode,
	RepeatRangeNode,
	SelectNode,
	StringNode,
} from '@getodk/xforms-engine';
import { Match, Show, Switch } from 'solid-js';
import { Note } from '../Widget/Note.tsx';
import { XFormGroup } from './containers/XFormGroup.tsx';
import { XFormControl } from './controls/XFormControl.tsx';

type ViewNode = GroupNode | NoteNode | RepeatRangeNode | SelectNode | StringNode;

const isViewNode = (node: GeneralChildNode): node is ViewNode => {
	return node.nodeType !== 'model-value' && node.nodeType !== 'subtree';
};

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

const noteNode = (node: GeneralChildNode): NoteNode | null => {
	if (node.nodeType === 'note') {
		return node;
	}

	return null;
};

export interface XFormBodyElementProps {
	readonly node: GeneralChildNode;
}

export const XFormBodyElement = (props: XFormBodyElementProps) => {
	return (
		<Show when={isViewNode(props.node)}>
			<Switch fallback={<XFormUnknownElement {...props} />}>
				<Match when={groupLikeNode(props)} keyed={true}>
					{(node) => <XFormGroup node={node} />}
				</Match>
				<Match when={controlNode(props)} keyed={true}>
					{(node) => {
						return <XFormControl node={node} />;
					}}
				</Match>
				<Match when={noteNode(props.node)} keyed={true}>
					{(node) => {
						return <Note node={node} />;
					}}
				</Match>
			</Switch>
		</Show>
	);
};
