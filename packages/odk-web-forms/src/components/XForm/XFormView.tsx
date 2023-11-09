import { For } from 'solid-js/web';
import { Box } from 'suid/material';
import type { XFormDefinition } from '../../lib/xform/types.ts';
import { XFormControl } from './XFormControl.tsx';
import { XFormControlStack } from './XFormControlStack.tsx';
import { XFormTitle } from './XFormTitle.tsx';

interface XFormProps {
	readonly definition: XFormDefinition;
}

export const XFormView = (props: XFormProps) => {
	return (
		<Box>
			<XFormTitle>{props.definition.title}</XFormTitle>
			<XFormControlStack>
				<For each={props.definition.viewControls}>
					{(viewControl) => {
						return <XFormControl viewControl={viewControl} />;
					}}
				</For>
			</XFormControlStack>
		</Box>
	);
};
