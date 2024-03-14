import { styled } from '@suid/material';

export const PlainTextButton = styled('button')(({ theme, props }) => ({
	appearance: 'none',
	backgroundColor: 'transparent',
	border: 'none',
	color: theme.palette.text.primary,
	cursor: props.disabled ? 'default' : 'pointer',
	padding: 0,
	textAlign: 'inherit',
}));
