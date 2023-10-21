import { styled } from '@suid/material';

export const DefaultParagraph = styled('p')(({ theme }) => ({
	...theme.typography.body1,
}));
