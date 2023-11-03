import { For } from 'solid-js/web';
import { Box } from 'suid/material';
import type { XFormEntry } from '../../lib/xform/XFormEntry.ts';
import { XFormControl } from './XFormControl.tsx';
import { XFormControlStack } from './XFormControlStack.tsx';
import { XFormTitle } from './XFormTitle.tsx';

interface XFormViewProps {
	readonly entry: XFormEntry;
}

export const XFormView = (props: XFormViewProps) => {
	return (
		<Box>
			<XFormTitle>{props.entry.form.title}</XFormTitle>
			<XFormControlStack>
				<For each={props.entry.form.view.children}>
					{(viewControl) => {
						return <XFormControl entry={props.entry} viewControl={viewControl} />;
					}}
				</For>
			</XFormControlStack>
		</Box>
	);
};
