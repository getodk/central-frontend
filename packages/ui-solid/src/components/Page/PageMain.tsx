import { Paper, styled } from '@suid/material';

export const PageMain = styled(Paper)(({ theme }) => ({
	borderRadius: theme.shape.borderRadius * 4,

	// TODO: responsive
	padding: theme.spacing(3),
}));
