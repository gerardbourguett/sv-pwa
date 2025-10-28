import type { EstadoClave, LecturaResponse } from '../../types';
import { apiClient } from './client';

// GET /sector?sector=11&periodo=102025&stfechaini=20251001&stfechafin=20251028
// Parámetros obligatorios: sector, periodo, stfechaini, stfechafin
// Parámetros opcionales: tipoclave, medidor, clave (estado: "Sin Lectura", "Lectura Normal", "Clave Informativa", "Clave relevante", "Clave Crítica")
export const lecturasApi = {
	getLecturas: async (
		sector: string,
		periodo: string,
		stfechaini: string,
		stfechafin: string,
		tipoclave?: string,
		medidor?: string,
		clave?: EstadoClave
	) => {
		const response = await apiClient.get<LecturaResponse>('/sector', {
			params: {
				sector,
				periodo,
				stfechaini,
				stfechafin,
				...(tipoclave && { tipoclave }),
				...(medidor && { medidor }),
				...(clave && { clave })
			}
		});
		return response;
	}
};
