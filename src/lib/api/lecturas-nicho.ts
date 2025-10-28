import { apiClient } from './client';
import type { Medidor } from '../../types';

export const lecturasNichoApi = {
	/**
	 * Obtiene los medidores de un nicho específico
	 */
	async getMedidores(periodo: string, nicho: string): Promise<Medidor[]> {
		const response = await apiClient.get<{ data: Medidor[] }>('/lecturas-nicho', {
			params: {
				periodo,
				nicho
			}
		});
		return response.data;
	}
};
