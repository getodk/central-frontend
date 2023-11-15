import { For } from 'solid-js';
import { Box } from 'suid/material';
import type { XFormViewChildType } from '../../../lib/xform/XFormViewChild.ts';
import type { XFormControlProps } from '../controls/XFormControl.tsx';
import { XFormControl } from '../controls/XFormControl.tsx';
import { XFormAlert } from './XFormAlert.tsx';

interface XFormUnknownControlProps extends XFormControlProps<XFormViewChildType> {}

export const XFormUnknownControl = (props: XFormUnknownControlProps) => {
	return (
		<Box>
			<XFormAlert
				severity="error"
				title={
					<>
						Unrecognized form control: <code>{props.viewControl.type}</code>
					</>
				}
				detailsSummary="Control"
			>
				<pre>{JSON.stringify(props, null, 2)}</pre>
			</XFormAlert>
			<For each={props.viewControl.children}>
				{(childViewControl) => {
					return <XFormControl entry={props.entry} viewControl={childViewControl} />;
				}}
			</For>
		</Box>
	);
};
