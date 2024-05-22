import type { SelectNode, StringNode } from '@getodk/xforms-engine';
import { XFormAlert } from './XFormAlert.tsx';

type ControlNode = SelectNode | StringNode;

interface XFormUnlabeledControlProps {
	readonly node: ControlNode;
}

export const XFormUnlabeledControl = (props: XFormUnlabeledControlProps) => {
	return (
		<XFormAlert
			severity="warning"
			title={
				<>
					Unlabeled <code>{props.node.definition.bodyElement?.type}</code> control
				</>
			}
			detailsSummary="Control"
		>
			<pre>{JSON.stringify(props.node.definition, null, 2)}</pre>
		</XFormAlert>
	);
};
