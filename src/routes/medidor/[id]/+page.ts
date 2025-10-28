import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { browser } from '$app/environment';
import { lecturasStore } from '$lib/stores/lecturas';
import type { Medidor } from '../../../types';

const API_URL = import.meta.env.VITE_API_URL;

export const load: PageLoad = async ({ params, fetch }) => {
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

	// Obtener contexto de búsqueda
	const periodo = medidorParcial.periodo || medidorParcial.LM_Periodo;
	const nicho = medidorParcial.nicho;

	if (!periodo || !nicho) {
		throw error(500, 'Faltan datos necesarios para obtener información del medidor.');
	}

	try {
		// Obtener token si estamos en el browser
		const token = browser ? localStorage.getItem('token') : null;
		
		// Usar el fetch de SvelteKit para llamar a /lecturas-nicho
		const searchParams = new URLSearchParams({ periodo, nicho });
		const url = `${API_URL}/lecturas-nicho?${searchParams.toString()}`;
		
		console.group('🔍 DEBUG: Load Medidor +page.ts');
		console.log('Params:', { medidorId, periodo, nicho });
		console.log('URL:', url);
		console.log('Medidor Parcial:', medidorParcial);
		console.groupEnd();
		
		const headers: HeadersInit = {
			'Content-Type': 'application/json'
		};
		
		if (token) {
			headers['Authorization'] = `Bearer ${token}`;
		}
		
		const response = await fetch(url, { headers });
		
		console.log('📡 Response status:', response.status);
		
		if (!response.ok) {
			console.error('❌ Response not OK:', response.status, response.statusText);
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		
		const medidores: Medidor[] = await response.json();
		console.log('📦 Medidores recibidos:', medidores.length);
		console.log('🔍 Buscando LM_ID:', medidorId);
		
		// Buscar el medidor específico por LM_ID
		const medidorCompleto = medidores.find((m) => m.LM_ID === medidorId);
		
		if (!medidorCompleto) {
			console.error('❌ Medidor no encontrado en array');
			console.log('IDs disponibles:', medidores.map(m => m.LM_ID));
			throw error(404, 'No se pudo obtener la información completa del medidor.');
		}
		
		console.log('✅ Medidor encontrado:', medidorCompleto);
		
		return { medidor: medidorCompleto };
	} catch (err) {
		console.error('❌ Error en load function:', err);
		if (err && typeof err === 'object' && 'status' in err) {
			throw err; // Re-throw SvelteKit errors
		}
		throw error(500, 'Error al obtener información del medidor desde el servidor.');
	}
};
