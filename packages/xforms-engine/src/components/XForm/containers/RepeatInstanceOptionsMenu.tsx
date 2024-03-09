// TODO: quite a bit of this is very similar to FormLanguageMenu
import { createSignal } from 'solid-js';
import Delete from 'suid/icons-material/Delete';
import MoreVert from 'suid/icons-material/MoreVert';
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from 'suid/material';
import type { RepeatInstanceState } from '../../../lib/xform/state/RepeatInstanceState.ts';

interface RepeatInstanceOptionsMenuProps {
	readonly state: RepeatInstanceState;
}

export const RepeatInstanceOptionsMenu = (props: RepeatInstanceOptionsMenuProps) => {
	let buttonRef!: HTMLButtonElement;

	const [isOpen, setIsOpen] = createSignal(false);
	const closeMenu = () => {
		setIsOpen(false);
	};
	const buttonId = () => `repeat-instance-options-menu-button-${props.state.reference}`;
	const menuId = () => `repeat-instance-options-menu-${props.state.reference}`;

	return (
		<>
			<IconButton
				id={buttonId()}
				ref={buttonRef}
				aria-controls={isOpen() ? menuId() : ''}
				aria-expanded={isOpen()}
				aria-has-popup={true}
				onClick={() => {
					setIsOpen((current) => !current);
				}}
			>
				<MoreVert />
			</IconButton>
			<Menu
				id={menuId()}
				MenuListProps={{
					'aria-labelledby': buttonId(),
					dense: true,
				}}
				anchorEl={buttonRef}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'right',
				}}
				open={isOpen()}
				onClose={closeMenu}
				transformOrigin={{
					vertical: 'top',
					horizontal: 'right',
				}}
			>
				<MenuItem
					dense={true}
					onClick={() => {
						props.state.remove();
					}}
				>
					<ListItemIcon>
						<Delete fontSize="small" />
					</ListItemIcon>

					<ListItemText disableTypography={true}>
						{/* TODO: app translations */}
						Remove
					</ListItemText>
				</MenuItem>
			</Menu>
		</>
	);
};
