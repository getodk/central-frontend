import { TextField, styled } from '@suid/material';

export const DefaultTextField = styled(TextField)(({ theme }) => ({
	...theme.typography.body2,

	'& .MuiInputBase-input': {
		backgroundColor: theme.palette.background.paper,
		boxSizing: 'content-box',
		fontSize: '1em',
		height: '1em',
		padding: '1rem',
	},
}));
