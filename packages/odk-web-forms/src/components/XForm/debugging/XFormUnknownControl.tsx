import { Box } from 'suid/material';
import type { XFormEntry } from '../../../lib/xform/XFormEntry.ts';
import type { ControlDefinition } from '../../../lib/xform/body/control/ControlDefinition.ts';
import { XFormAlert } from './XFormAlert.tsx';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface UnknownControl extends ControlDefinition<any> {}

interface XFormUnknownControlProps {
	readonly control: UnknownControl;
	readonly entry: XFormEntry;
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
