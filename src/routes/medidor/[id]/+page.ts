import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { lecturasStore } from '$lib/stores/lecturas';

export const load: PageLoad = async ({ params }) => {
	const medidorId = parseInt(params.id);

	if (isNaN(medidorId)) {
		throw error(400, 'ID de medidor inválido');
	}

	// Obtener el medidor parcial del store primero
	const medidorParcial = lecturasStore.getMedidorById(medidorId);

	if (!medidorParcial) {
		throw error(404, 'Medidor no encontrado. Por favor regrese y realice una nueva búsqueda.');
	}

	// Verificar si el medidor está facturado o cerrado (no editable)
	const claveHtml = medidorParcial.claveHtml || '';
	const estadoMatch = claveHtml.match(/(SINLEC|SINCLA|CLAINF|CLAREL|CLACRI|LECCER|LECIMP)/);
	const estado = estadoMatch ? estadoMatch[1] : '';

	if (estado === 'LECIMP' || estado === 'LECCER') {
		throw error(403, 'Este medidor ya está facturado o cerrado y no puede ser modificado.');
	}

	try {
		// Usar el método inteligente del store que maneja cache y fetch automáticamente
		const medidorCompleto = await lecturasStore.getMedidorCompleto(medidorId);

		if (!medidorCompleto) {
			throw error(404, 'No se pudo obtener la información completa del medidor.');
		}

		return { medidor: medidorCompleto };
	} catch (err) {
		console.error('Error al obtener datos del medidor:', err);
		if (err && typeof err === 'object' && 'status' in err) {
			throw err; // Re-throw SvelteKit errors
		}
		throw error(500, 'Error al obtener información del medidor. Por favor intente nuevamente.');
	}
};
