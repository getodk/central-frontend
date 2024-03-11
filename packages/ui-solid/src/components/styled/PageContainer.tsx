import { Container, styled } from '@suid/material';

export const PageContainer = styled(Container)(({ theme }) => ({
	backgroundColor: theme.palette.background.default,
	paddingBlock: theme.spacing(2),
}));
