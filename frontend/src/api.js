const configuredApiUrl = import.meta.env.VITE_API_URL || "https://life-pulse-blood-system-mse3.vercel.app/api";

export const API_URL = configuredApiUrl.replace(/\/+$/, '');

export const parseResponse = async (response) => {
	const responseText = await response.text();

	if (!responseText) {
		return {};
	}

	try {
		return JSON.parse(responseText);
	} catch {
		return {};
	}
};