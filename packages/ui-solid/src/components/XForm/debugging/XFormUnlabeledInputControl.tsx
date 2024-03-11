import type { ControlDefinition } from '@odk-web-forms/xforms-engine';
import { XFormAlert } from './XFormAlert.tsx';

interface XFormUnlabeledControlProps {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	readonly control: ControlDefinition<any>;
}

export const XFormUnlabeledControl = (props: XFormUnlabeledControlProps) => {
	return (
		<XFormAlert
			severity="warning"
			title={
				<>
					Unlabeled <code>{props.control.type}</code> control
				</>
			}
			detailsSummary="Control"
		>
			<pre>{JSON.stringify(props, null, 2)}</pre>
		</XFormAlert>
	);
};
