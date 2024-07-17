import type { StringNode } from '@getodk/xforms-engine';
import { Show } from 'solid-js';
import { TextWidget } from '../../Widget/TextWidget.tsx';
import { XFormUnlabeledControl } from '../debugging/XFormUnlabeledInputControl.tsx';

interface XFormInputControlProps {
	readonly node: StringNode;
}

export const XFormInputControl = (props: XFormInputControlProps) => {
	return (
		<>
			<Show when={props.node.currentState.label == null}>
				<XFormUnlabeledControl node={props.node} />
			</Show>
			<TextWidget node={props.node} />
		</>
	);
};
