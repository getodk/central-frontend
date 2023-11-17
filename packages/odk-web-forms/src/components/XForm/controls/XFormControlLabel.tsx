import { DefaultLabelParagraph } from '../../styled/DefaultLabelParagraph.tsx';
import type { XFormLabelProps } from '../XFormLabel.tsx';
import { XFormLabel } from '../XFormLabel.tsx';

interface XFormControlLabelProps extends XFormLabelProps {}

export const XFormControlLabel = (props: XFormControlLabelProps) => {
	return (
		<DefaultLabelParagraph>
			<XFormLabel id={props.id} binding={props.binding} label={props.label} />
		</DefaultLabelParagraph>
	);
};
