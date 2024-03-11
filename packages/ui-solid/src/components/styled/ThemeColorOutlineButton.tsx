import { Button, styled } from '@suid/material';

export const ThemeColorOutlineButton = styled(Button)(({ theme }) => ({
	backgroundColor: theme.palette.background.paper,
	borderRadius: '1.25em',
	border: `1px solid ${theme.palette.primary.main}`,
	fontSize: '0.9rem',
	height: '2.5em',
	paddingBlock: theme.spacing(0.5),
	paddingInline: theme.spacing(1),
}));
