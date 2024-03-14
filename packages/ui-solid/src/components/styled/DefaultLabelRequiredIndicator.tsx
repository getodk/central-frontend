import { styled } from '@suid/material';

export const DefaultLabelRequiredIndicator = styled('label')(({ theme }) => ({
	color: theme.palette.required,
}));
