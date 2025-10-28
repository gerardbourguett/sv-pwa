import { apiClient } from './client';
import type { FormDataBT43 } from '../../types';

export const lecturasBT43Api = {
	/**
	 * Actualiza la lectura de un medidor BT-4.3
	 */
	async actualizarLectura(data: FormDataBT43): Promise<void> {
		await apiClient.put('/actualizar-lectura-bt-4-3', data);
	}
};
