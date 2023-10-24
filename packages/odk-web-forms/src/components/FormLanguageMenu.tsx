// TODO: lots of this should get broken out

import { createSignal, useContext } from 'solid-js';
import { For, Show } from 'solid-js/web';
import Check from 'suid/icons-material/Check';
import ExpandMore from 'suid/icons-material/ExpandMore';
import Language from 'suid/icons-material/Language';
import {
	ListItemIcon,
	ListItemText,
	Menu,
	MenuItem,
	Stack,
	Typography,
	styled,
} from 'suid/material';
import { localizationContext } from './LocalizationProvider.tsx';
import { PageMenuButton } from './styled/PageMenuButton.tsx';

const FormLanguageMenuButtonIcon = styled(Language)(({ theme }) => ({
	paddingInlineEnd: theme.spacing(0.5),
}));

const FormLanguageMenuExpandMoreIcon = styled(ExpandMore)(({ theme }) => ({
	paddingInlineStart: theme.spacing(0.25),
}));

const MenuItemSmallTypography = styled(Typography)({
	fontSize: '0.875rem',
});

export const FormLanguageMenu = () => {
	let buttonRef: HTMLButtonElement;

	const context = useContext(localizationContext);
	const [isOpen, setIsOpen] = createSignal(false);
	const [selected, setSelected] = createSignal(context.localizations[0] ?? null);
	const closeMenu = () => {
		setIsOpen(false);
	};

	return (
		<Show when={selected()} keyed={true}>
			{(currentLocalization) => {
				return (
					<div>
						<PageMenuButton
							id="form-language-menu-button"
							ref={buttonRef}
							aria-controls={isOpen() ? 'form-language-menu' : ''}
							aria-expanded={isOpen()}
							aria-aria-haspopup={true}
							onClick={() => {
								setIsOpen((current) => !current);
							}}
							variant="contained"
						>
							<Stack alignItems="center" direction="row">
								<FormLanguageMenuButtonIcon fontSize="small" />
								<span style={{ 'line-height': 1 }}>{currentLocalization.name}</span>
								<FormLanguageMenuExpandMoreIcon fontSize="small" />
							</Stack>
						</PageMenuButton>
						<Menu
							id="form-language-menu"
							MenuListProps={{ 'aria-labelledby': 'form-language-menu-button', dense: true }}
							// TODO: what to do on resize while menu open?
							anchorEl={buttonRef}
							anchorOrigin={{
								vertical: 'bottom',
								horizontal: 'right',
							}}
							open={isOpen()}
							onClose={closeMenu}
							PaperProps={{
								sx: {
									minWidth: '20ch',
								},
							}}
							transformOrigin={{
								vertical: 'top',
								horizontal: 'right',
							}}
						>
							<For each={context.localizations}>
								{(localization) => {
									const isSelected = () => localization === selected();

									return (
										<MenuItem
											dense={true}
											selected={isSelected()}
											onClick={() => {
												setSelected(localization);
												closeMenu();
											}}
										>
											<Show when={isSelected()}>
												<ListItemIcon>
													<Check fontSize="small" />
												</ListItemIcon>
											</Show>

											<ListItemText inset={!isSelected()} disableTypography={true}>
												<MenuItemSmallTypography>{localization.name}</MenuItemSmallTypography>
											</ListItemText>
										</MenuItem>
									);
								}}
							</For>
						</Menu>
					</div>
				);
			}}
		</Show>
	);
};
