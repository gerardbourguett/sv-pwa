import type { Periodo, PeriodoResponse } from '../../types';
import { apiClient } from './client';
//Solo necesitamos el endpoint GET /periodos
export const periodosApi = {
	getPeriodos: async (): Promise<Periodo[]> => {
		const response = await apiClient.get<PeriodoResponse>('/Periodos');

		if (Array.isArray(response)) {
			return response as Periodo[];
		}

		return response.periodos || [];
	}
};
