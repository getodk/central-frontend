import type { RootNode } from '@getodk/xforms-engine';
import { Box } from '@suid/material';
import { XFormQuestionList } from './XFormQuestionList.tsx';
import { XFormTitle } from './XFormTitle.tsx';

interface XFormViewProps {
	readonly root: RootNode;
}

export const XFormView = (props: XFormViewProps) => {
	return (
		<Box>
			<XFormTitle>{props.root.definition.bind.form.title}</XFormTitle>
			<XFormQuestionList node={props.root} />
		</Box>
	);
};
