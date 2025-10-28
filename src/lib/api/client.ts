import { browser } from '$app/environment';
import { goto } from '$app/navigation';

const API_URL = import.meta.env.VITE_API_URL;

interface RequestOptions extends RequestInit {
	params?: Record<string, string | number | boolean>;
}

class ApiClient {
	private getToken(): string | null {
		if (!browser) return null;
		return localStorage.getItem('token');
	}

	private getHeaders(customHeaders?: HeadersInit): HeadersInit {
		const headers: HeadersInit = {
			'Content-Type': 'application/json',
			...customHeaders
		};

		const token = this.getToken();
		if (token) {
			(headers as Record<string, string>).Authorization = `Bearer ${token}`;
		}

		return headers;
	}

	private buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
		const url = `${API_URL}${endpoint}`;

		if (!params) return url;

		const searchParams = new URLSearchParams();
		Object.entries(params).forEach(([key, value]) => {
			searchParams.append(key, value.toString());
		});

		return `${url}?${searchParams.toString()}`;
	}

	private async handleResponse<T>(response: Response): Promise<T> {
		if (response.status === 401) {
			if (browser) {
				localStorage.removeItem('token');
				localStorage.removeItem('user');
				goto('/login');
			}
			throw new Error('No estás autenticado');
		}

		if (response.status === 403) {
			throw new Error('No tiene permisos para acceder a este recurso');
		}

		if (response.status === 204) {
			return {} as T;
		}

		if (response.status === 404) {
			throw new Error('Recurso no encontrado');
		}

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.message || `Error del servidor: ${response.status}`);
		}

		return response.json();
	}

	async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
		const url = this.buildUrl(endpoint, options?.params);

		const response = await fetch(url, {
			method: 'GET',
			headers: this.getHeaders(options?.headers),
			...options
		});

		return this.handleResponse<T>(response);
	}

	async post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
		const url = this.buildUrl(endpoint, options?.params);

		const response = await fetch(url, {
			method: 'POST',
			headers: this.getHeaders(options?.headers),
			body: data ? JSON.stringify(data) : undefined,
			...options
		});

		return this.handleResponse<T>(response);
	}

	async put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
		const url = this.buildUrl(endpoint, options?.params);

		const response = await fetch(url, {
			method: 'PUT',
			headers: this.getHeaders(options?.headers),
			body: data ? JSON.stringify(data) : undefined,
			...options
		});

		return this.handleResponse<T>(response);
	}

	async patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
		const url = this.buildUrl(endpoint, options?.params);

		const response = await fetch(url, {
			method: 'PATCH',
			headers: this.getHeaders(options?.headers),
			body: data ? JSON.stringify(data) : undefined,
			...options
		});

		return this.handleResponse<T>(response);
	}

	async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
		const url = this.buildUrl(endpoint, options?.params);

		const response = await fetch(url, {
			method: 'DELETE',
			headers: this.getHeaders(options?.headers),
			...options
		});

		return this.handleResponse<T>(response);
	}
}

export const apiClient = new ApiClient();
