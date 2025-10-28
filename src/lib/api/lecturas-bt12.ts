import { apiClient } from './client';
import type { FormDataBT1y2 } from '../../types';

export const lecturasBT12Api = {
	/**
	 * Actualiza la lectura de un medidor BT-1 o BT-2
	 */
	async actualizarLectura(data: FormDataBT1y2): Promise<void> {
		await apiClient.put('/actualizar-lectura-bt-1-bt-2', data);
	}
};
