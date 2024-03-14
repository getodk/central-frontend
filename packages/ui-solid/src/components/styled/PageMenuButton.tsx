import { Button, styled } from '@suid/material';

export const PageMenuButton = styled(Button)(({ theme }) => ({
	color: theme.palette.text.primary,
	backgroundColor: theme.palette.background.paper,
	borderRadius: theme.spacing(2),
	boxShadow: 'none',
	padding: theme.spacing(0.5),
	textTransform: 'none',

	'&:hover': {
		backgroundColor: theme.palette.background.paper,
	},
}));
