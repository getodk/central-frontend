import { Box } from 'suid/material';
import type { AnyControlDefinition } from '../../../lib/xform/body/control/ControlDefinition.ts';
import type { EntryState } from '../../../lib/xform/state/EntryState.ts';
import { XFormAlert } from './XFormAlert.tsx';

interface UnknownControl extends AnyControlDefinition {}

interface XFormUnknownControlProps {
	readonly control: UnknownControl;
	readonly entry: EntryState;
}

export const XFormUnknownControl = (props: XFormUnknownControlProps) => {
	return (
		<Box>
			<XFormAlert
				severity="error"
				title={
					<>
						Unrecognized form control: <code>{props.control.type}</code>
					</>
				}
				detailsSummary="Control"
			>
				<pre>{JSON.stringify(props, null, 2)}</pre>
			</XFormAlert>
		</Box>
	);
};
