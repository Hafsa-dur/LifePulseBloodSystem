const configuredApiUrl = import.meta.env.VITE_API_URL ||
	(import.meta.env.DEV ? "http://localhost:5000/api" : "https://life-pulse-blood-system-mse3.vercel.app/api");

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

export const authHeaders = (json = false) => ({
	...(json ? { 'Content-Type': 'application/json' } : {}),
	...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {})
});