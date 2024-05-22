import type { SelectNode, StringNode } from '@getodk/xforms-engine';
import { Box } from '@suid/material';
import { XFormAlert } from './XFormAlert.tsx';

type ValueNode = SelectNode | StringNode;

interface XFormUnknownControlProps {
	readonly node: ValueNode;
}

export const XFormUnknownControl = (props: XFormUnknownControlProps) => {
	const element = () => props.node.definition.bodyElement;

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
