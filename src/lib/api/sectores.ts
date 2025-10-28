import type { Sector, SectorResponse } from '../../types';
import { apiClient } from './client';

//Solo necesitamos el endpoint GET /sectores
export const sectoresApi = {
	getSectores: async (): Promise<Sector[]> => {
		const response = await apiClient.get<SectorResponse>('/sectores');

		if (Array.isArray(response)) {
			return response as Sector[];
		}

		return response.sectores || [];
	}
};
