import { Box, Stack, Typography, styled } from '@suid/material';
import odkLogo from '../../../assets/odk-logo.png';
import { FormSubmitButton } from '../styled/FormSubmitButton';

const BasePageFooter = styled(Stack)(({ theme }) => ({
	alignItems: 'center',
	flexDirection: 'row',
	justifyContent: 'space-between',
	paddingBlockStart: theme.spacing(1),
	paddingInlineStart: theme.spacing(1),
}));

const PoweredBy = styled(Typography)({
	color: '#d4d6d7',
	lineHeight: 2.75,
	textTransform: 'lowercase',
});

export const PageFooter = () => {
	return (
		<BasePageFooter>
			<Box m={10}>
				<Stack alignItems="center" direction="row" spacing={1}>
					<PoweredBy variant="body1" as="span">
						Powered by
					</PoweredBy>
					<img src={odkLogo} loading="lazy" width="74" height="40" />
				</Stack>
			</Box>

			<FormSubmitButton variant="contained">Send</FormSubmitButton>
		</BasePageFooter>
	);
};
