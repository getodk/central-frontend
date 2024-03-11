import type { AnyParentState } from '@odk-web-forms/xforms-engine';
import { For } from 'solid-js';
import { XFormBodyElement } from './XFormBodyElement.tsx';
import { XFormControlStack } from './XFormControlStack.tsx';

interface XFormQuestionListProps {
	readonly state: AnyParentState;
}

export const XFormQuestionList = (props: XFormQuestionListProps) => {
	return (
		<XFormControlStack>
			<For each={props.state.children}>
				{(child) => {
					if (child.definition.bodyElement == null) {
						return;
					}

					return <XFormBodyElement state={child} element={child.definition.bodyElement} />;
				}}
			</For>
		</XFormControlStack>
	);
};
