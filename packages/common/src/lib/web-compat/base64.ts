const base64Decode = (base64Input: string): string => {
	return new TextDecoder().decode(Uint8Array.from(atob(base64Input), (m) => m.charCodeAt(0)));
};

export { base64Decode };
