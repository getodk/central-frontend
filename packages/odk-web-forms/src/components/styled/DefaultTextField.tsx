import { TextField, styled } from '@suid/material';

export const DefaultTextField = styled(TextField)(({ theme }) => ({
	...theme.typography.body2,

	'& .MuiInputBase-input': {
		boxSizing: 'content-box',
		fontSize: '1em',
		height: '1em',
		padding: '1rem',
	},
}));
