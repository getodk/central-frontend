import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';

import type { StyledProps } from '@suid/material';
import { createPalette, createTheme, ThemeProvider as SUIDThemeProvider } from '@suid/material';
import type { JSX } from 'solid-js';

declare module '@suid/material/styles/createTheme' {
	interface ThemeInput {
		nonRelevant: {
			default: StyledProps;
			debug: StyledProps;
		};
	}

	interface Theme extends ThemeInput {}
}

declare module '@suid/material/styles/createPalette' {
	type PaletteShades = Record<number | `${number}%`, string>;

	interface PaletteOptions {
		primaryShades?: PaletteShades;

		required?: string;
	}
}

const REM = 16;

export const odkTheme = createTheme({
	components() {
		return {
			MuiTextField: {
				defaultProps: {
					variant: 'outlined',
				},
			},
		};
	},
	palette: createPalette({
		mode: 'light',
		background: {
			default: '#f7f7f7',
			paper: '#fff',
		},
		primary: {
			main: '#009ecc',
			contrastText: '#fff',
		},
		primaryShades: {
			'10%': '#ecf5fa',
			'15%': '#d8ecf5',
		},
		required: '#d42c2c',
	}),
	spacing() {
		return (units) => {
			if (typeof units !== 'number') {
				throw new Error(`Unexpected units value: ${units}`);
			}

			return units * REM;
		};
	},
	typography: {
		h1: {
			fontSize: '2.25rem',
			fontWeight: 500,
		},
		body1: {
			fontSize: '1.5rem',
			fontWeight: 400,
		},
		body2: {
			fontSize: '1.25rem',
			fontWeight: 400,
		},
		fontWeightMedium: 500,
	},

	nonRelevant: {
		default: {
			display: 'none',
		},
		debug: {
			'&::before': {
				display: 'block',
				position: 'absolute',
			},

			opacity: '0.35',
		},
	},
});

interface ThemeProviderProps {
	readonly children?: JSX.Element;
}

export const ThemeProvider = (props: ThemeProviderProps) => {
	return <SUIDThemeProvider theme={odkTheme}>{props.children}</SUIDThemeProvider>;
};
