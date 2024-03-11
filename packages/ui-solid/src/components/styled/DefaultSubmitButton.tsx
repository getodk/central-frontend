import { Button, styled } from '@suid/material';

export const DefaultSubmitButton = styled(Button)(({ theme }) => ({
	background: theme.palette.primary.main,
	color: theme.palette.primary.contrastText,
}));
