import { Box } from 'suid/material';
import type { ValueNodeState } from '../../../lib/xform/state/ValueNodeState.ts';
import { XFormAlert } from './XFormAlert.tsx';

interface XFormUnknownControlProps {
	readonly state: ValueNodeState;
}

export const XFormUnknownControl = (props: XFormUnknownControlProps) => {
	const element = () => props.state.definition.bodyElement;

	return (
		<Box>
			<XFormAlert
				severity="error"
				title={
					<>
						Unrecognized form control: <code>{element()?.type}</code>
					</>
				}
				detailsSummary="Control"
			>
				<pre>{JSON.stringify(props, null, 2)}</pre>
			</XFormAlert>
		</Box>
	);
};
