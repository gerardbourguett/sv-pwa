import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { lecturasStore } from '$lib/stores/lecturas';

export const load: PageLoad = ({ params }) => {
	const medidorId = parseInt(params.id);

	if (isNaN(medidorId)) {
		throw error(400, 'ID de medidor inválido');
	}

	// Obtener el medidor desde el store
	const medidor = lecturasStore.getMedidorById(medidorId);

	if (!medidor) {
		throw error(404, 'Medidor no encontrado. Por favor regrese y realice una nueva búsqueda.');
	}

	// Verificar si el medidor está facturado o cerrado (no editable)
	const claveHtml = medidor.claveHtml || '';
	const estadoMatch = claveHtml.match(/(SINLEC|SINCLA|CLAINF|CLAREL|CLACRI|LECCER|LECIMP)/);
	const estado = estadoMatch ? estadoMatch[1] : '';

	if (estado === 'LECIMP' || estado === 'LECCER') {
		throw error(403, 'Este medidor ya está facturado o cerrado y no puede ser modificado.');
	}

	return { medidor };
};
