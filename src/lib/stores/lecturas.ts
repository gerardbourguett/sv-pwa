import { writable, get } from 'svelte/store';
import { lecturasNichoApi } from '$lib/api/lecturas-nicho';
import type { Medidor } from '../../types';

interface LecturasState {
	medidores: any[];
	periodo: string;
	sector: string;
	medidoresCompletos: Map<number, Medidor>;
}

function createLecturasStore() {
	const store = writable<LecturasState>({
		medidores: [],
		periodo: '',
		sector: '',
		medidoresCompletos: new Map()
	});

	return {
		subscribe: store.subscribe,
		setMedidores(medidores: any[], periodo: string, sector: string) {
			store.set({ ...get(store), medidores, periodo, sector });
		},
		getMedidorById(id: number): any | undefined {
			const state = get(store);
			return state.medidores.find((m) => m.id === id || m.LM_ID === id);
		},
		setContextoBusqueda(periodo: string, sector: string) {
			const state = get(store);
			store.set({ ...state, periodo, sector });
		},
		async getMedidorCompleto(lmId: number): Promise<Medidor | null> {
			const state = get(store);

			// Verificar si ya está en cache
			if (state.medidoresCompletos.has(lmId)) {
				return state.medidoresCompletos.get(lmId)!;
			}

			// Obtener medidor parcial para extraer periodo y nicho
			const medidorParcial = state.medidores.find((m) => m.id === lmId || m.LM_ID === lmId);

			if (!medidorParcial) {
				return null;
			}

			const periodo = medidorParcial.periodo || medidorParcial.LM_Periodo;
			const nicho = medidorParcial.nicho;

			if (!periodo || !nicho) {
				return null;
			}

			try {
				// Llamar a /lecturas-nicho
				const medidores = await lecturasNichoApi.getMedidores(periodo, nicho);

				// Cachear todos los medidores del nicho
				const newCache = new Map(state.medidoresCompletos);
				medidores.forEach((m) => {
					newCache.set(m.LM_ID, m);
				});

				store.set({ ...state, medidoresCompletos: newCache });

				// Buscar el medidor específico
				const medidorCompleto = medidores.find((m) => m.LM_ID === lmId);
				return medidorCompleto || null;
			} catch (error) {
				console.error('Error fetching medidor completo:', error);
				return null;
			}
		},
		clear() {
			store.set({ medidores: [], periodo: '', sector: '', medidoresCompletos: new Map() });
		}
	};
}

export const lecturasStore = createLecturasStore();
