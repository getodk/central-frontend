import type { XFormViewControlType } from '../../../lib/xform/types.ts';
import type { XFormControlProps } from '../XFormControl.tsx';
import { XFormAlert } from './XFormAlert.tsx';

interface XFormUnknownControlProps extends XFormControlProps<XFormViewControlType> {}

export const XFormUnknownControl = (props: XFormUnknownControlProps) => {
	return (
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
	);
};
