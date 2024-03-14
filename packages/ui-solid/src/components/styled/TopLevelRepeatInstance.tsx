import { Box, styled } from '@suid/material';

export const TopLevelRepeatInstance = styled(Box)(({ theme }) => ({
	paddingBlock: theme.spacing(2),
	paddingInline: theme.spacing(2.25),
	borderRadius: theme.shape.borderRadius,
	backgroundColor: theme.palette.primaryShades?.['10%'],
}));
