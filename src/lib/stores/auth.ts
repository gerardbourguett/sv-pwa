import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface AuthState {
	token: string | null;
	user: { usuario: string } | null;
	isAuthenticated: boolean;
}

function createAuthStore() {
	const { subscribe, update } = writable<AuthState>({
		token: browser ? localStorage.getItem('token') : null,
		user: null,
		isAuthenticated: browser ? !!localStorage.getItem('token') : false
	});

	return {
		subscribe,
		login: async (usuario: string, password: string) => {
			const res = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ usuario, contrasena: password })
			});

			if (!res.ok) throw new Error('Failed to login');

			const { token } = await res.json();
			if (browser) localStorage.setItem('token', token);

			update((state) => ({
				...state,
				token,
				isAuthenticated: true,
				user: { usuario }
			}));
		},

		logout: async () => {
			const res = await fetch(`${import.meta.env.VITE_API_URL}/logout`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${browser ? localStorage.getItem('token') : null}`
				}
			});
			if (!res.ok) throw new Error('Failed to logout');
			if (browser) {
				localStorage.removeItem('token');
				update((state) => ({
					...state,
					token: null,
					isAuthenticated: false,
					user: null
				}));
			}
		}
	};
}

export const auth = createAuthStore();
