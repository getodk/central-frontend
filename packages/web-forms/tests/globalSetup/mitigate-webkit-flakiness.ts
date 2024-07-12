const sleep = async (milliseconds: number) => {
	return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

export default async function () {
	await sleep(250);
}
