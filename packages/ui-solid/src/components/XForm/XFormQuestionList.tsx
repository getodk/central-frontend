import type { GeneralParentNode } from '@getodk/xforms-engine';
import { For } from 'solid-js';
import { XFormBodyElement } from './XFormBodyElement.tsx';
import { XFormControlStack } from './XFormControlStack.tsx';

interface XFormQuestionListProps {
	readonly node: GeneralParentNode;
}

export const XFormQuestionList = (props: XFormQuestionListProps) => {
	return (
		<XFormControlStack>
			<For each={props.node.currentState.children}>
				{(child) => {
					return <XFormBodyElement node={child} />;
				}}
			</For>
		</XFormControlStack>
	);
};
