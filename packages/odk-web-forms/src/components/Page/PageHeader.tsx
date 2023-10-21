import { Stack } from '@suid/material';
import { FormLanguageMenu } from '../FormLanguageMenu.tsx';

export const PageHeader = () => {
	return (
		<Stack direction="row" justifyContent="flex-end">
			<FormLanguageMenu />
		</Stack>
	);
};
