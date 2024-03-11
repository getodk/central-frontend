import { Typography } from '@suid/material';

interface XFormTitleProps {
	readonly children: string;
}

export const XFormTitle = (props: XFormTitleProps) => {
	return <Typography variant="h1">{props.children}</Typography>;
};
