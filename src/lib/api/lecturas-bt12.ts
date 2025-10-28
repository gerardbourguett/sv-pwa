import { apiClient } from './client';
import type { FormDataBT1y2 } from '../../types';

export const lecturasBT12Api = {
	/**
	 * Actualiza la lectura de un medidor BT-1 o BT-2
	 */
	async actualizarLectura(data: FormDataBT1y2): Promise<void> {
		console.group('🌐 API DEBUG: PUT /actualizar-lectura-bt-1-bt-2');
		console.log('Data enviada:', data);
		console.log('Tipos de datos:', {
			lmid: typeof data.lmid,
			vactual: typeof data.vactual,
			consumo: typeof data.consumo,
			claid: typeof data.claid
		});
		console.log('JSON que se enviará:', JSON.stringify(data, null, 2));
		console.groupEnd();
		
		await apiClient.put('/actualizar-lectura-bt-1-bt-2', data);
	}
};
