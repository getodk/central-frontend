import { Box, Button } from '@suid/material';

export const App = () => {
	return (
		<>
			<Box>
				<Button variant="contained">Hello world 1</Button>
			</Box>
			<Box>
				<Button variant="outlined">Hello world 2</Button>
			</Box>
			<Box>
				<Button variant="text">Hello world 3</Button>
			</Box>
		</>
	);
};
