import { DefaultLabelParagraph } from '../../styled/DefaultLabelParagraph.tsx';
import type { XFormLabelProps } from '../XFormLabel.tsx';
import { XFormLabel } from '../XFormLabel.tsx';

interface XFormControlLabelProps extends XFormLabelProps {}

export const XFormControlLabel = (props: XFormControlLabelProps) => {
	return (
		<DefaultLabelParagraph>
			<XFormLabel label={props.label} node={props.node} />
		</DefaultLabelParagraph>
	);
};
