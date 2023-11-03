import type { XFormViewChildType } from '../../../lib/xform/XFormViewChild.ts';
import type { XFormControlProps } from '../XFormControl.tsx';
import { XFormAlert } from './XFormAlert.tsx';

interface XFormUnlabeledControlProps extends XFormControlProps<XFormViewChildType> {}

export const XFormUnlabeledControl = (props: XFormUnlabeledControlProps) => {
	return (
		<XFormAlert
			severity="warning"
			title={
				<>
					Unlabeled <code>{props.viewControl.type}</code> control
				</>
			}
			detailsSummary="Control"
		>
			<pre>{JSON.stringify(props, null, 2)}</pre>
		</XFormAlert>
	);
};
