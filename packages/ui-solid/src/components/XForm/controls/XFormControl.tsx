import type { SelectNode, StringNode } from '@odk-web-forms/xforms-engine';
import { Match, Switch, createMemo } from 'solid-js';
import { XFormRelevanceGuard } from '../XFormRelevanceGuard.tsx';
import { XFormUnknownControl } from '../debugging/XFormUnknownControl.tsx';
import { SelectControl } from './SelectControl.tsx';
import { XFormInputControl } from './XFormInputControl.tsx';

type ControlNode = SelectNode | StringNode;

export interface XFormControlProps {
	readonly node: ControlNode;
}

const inputNode = (node: ControlNode): StringNode | null => {
	const { bodyElement } = node.definition;

	// TODO: better narrowing
	if (bodyElement == null || bodyElement.type === 'input') {
		return node as StringNode;
	}

	return null;
};

const selectNode = (node: ControlNode): SelectNode | null => {
	const { bodyElement } = node.definition;

	if (bodyElement == null) {
		return null;
	}

	switch (bodyElement.type) {
		case 'rank':
		case 'select':
		case 'select1':
			return node as SelectNode;
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
				<Match when={inputNode(props.node)} keyed={true}>
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
