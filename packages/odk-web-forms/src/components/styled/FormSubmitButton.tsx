import { styled } from '@suid/material';
import { DefaultSubmitButton } from './DefaultSubmitButton';

export const FormSubmitButton = styled(DefaultSubmitButton)(({ theme }) => ({
	...theme.typography.body1,

	borderRadius: theme.shape.borderRadius * 8,
	lineHeight: 0.8333,
	padding: '0.8333em',
	textTransform: 'none',
	width: '10em',
}));
