import { apiClient } from './client';
import type { Medidor } from '../../types';

export const lecturasNichoApi = {
	/**
	 * Obtiene los medidores de un nicho específico
	 * Endpoint: GET /lecturas-nicho?periodo=102025&nicho=SECTOR%202
	 * Retorna directamente un array de Medidor[]
	 */
	async getMedidores(periodo: string, nicho: string): Promise<Medidor[]> {
		const response = await apiClient.get<Medidor[]>('/lecturas-nicho', {
			params: {
				periodo,
				nicho
			}
		});
		return response;
	}
};
