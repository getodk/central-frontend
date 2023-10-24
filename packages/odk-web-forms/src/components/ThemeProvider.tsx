import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';

import type { JSX } from 'solid-js';
import { createTheme, ThemeProvider as SUIDThemeProvider } from 'suid/material';

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
	// components: {
	// 	MuiOutlinedInput: {
	// 		defaultProps: {},
	// 		// fontSize: '30rem',
	// 	},
	// },

	// components: {
	// 	MuiOutlinedInput: {
	// 		defaultProps: {
	// 			styleOverrides: {

	// 			},
	// 		},
	// 		styleOverrides: {
	// 			root: {
	// 				color: 'red',
	// 			},
	// 		},
	// 	},
	// },

	palette: {
		mode: 'light',
		background: {
			default: '#f7f7f7',
		},
		primary: {
			main: '#009ecc',
			contrastText: '#fff',
		},
	},
	// shape() {
	// 	return {
	// 		// borderRadius: REM,
	// 		// borderRadius:
	// 	};
	// },
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
});

interface ThemeProviderProps {
	readonly children?: JSX.Element;
}

export const ThemeProvider = (props: ThemeProviderProps) => {
	return <SUIDThemeProvider theme={odkTheme}>{props.children}</SUIDThemeProvider>;
};
