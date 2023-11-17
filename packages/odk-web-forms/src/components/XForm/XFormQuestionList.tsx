import { For } from 'solid-js';
import type { BodyElementDefinitionArray } from '../../lib/xform/body/BodyDefinition.ts';
import type { EntryState } from '../../lib/xform/state/EntryState.ts';
import { XFormBodyElement } from './XFormBodyElement.tsx';
import { XFormControlStack } from './XFormControlStack.tsx';

interface XFormQuestionListProps {
	readonly entry: EntryState;
	readonly elements: BodyElementDefinitionArray;
}

export const XFormQuesetionList = (props: XFormQuestionListProps) => {
	return (
		<XFormControlStack>
			<For each={props.elements}>
				{(element) => {
					return <XFormBodyElement entry={props.entry} element={element} />;
				}}
			</For>
		</XFormControlStack>
	);
};
