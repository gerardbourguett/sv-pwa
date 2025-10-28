import type { Clave, ClaveResponse } from '../../types';
import { apiClient } from './client';

//Solo necesitamos el endpoint GET /claves
export const clavesApi = {
	getClaves: async (): Promise<Clave[]> => {
		const response = await apiClient.get<ClaveResponse>('/claves');

		if (Array.isArray(response)) {
			return response as Clave[];
		}

		return response.claves || [];
	}
};
