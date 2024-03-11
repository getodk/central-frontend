import { Box, styled } from '@suid/material';

export const NestedGroupBox = styled(Box)(({ theme }) => ({
	borderLeftWidth: '0.375rem',
	borderLeftStyle: 'solid',
	borderLeftColor: theme.palette.primaryShades?.['15%'],
	paddingInlineStart: theme.spacing(2),
}));
