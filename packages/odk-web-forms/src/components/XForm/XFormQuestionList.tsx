import { For } from 'solid-js';
import type { XFormEntry } from '../../lib/xform/XFormEntry.ts';
import type { BodyElementDefinitionArray } from '../../lib/xform/body/BodyDefinition.ts';
import { XFormBodyElement } from './XFormBodyElement.tsx';
import { XFormControlStack } from './XFormControlStack.tsx';

interface XFormQuestionListProps {
	readonly entry: XFormEntry;
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
