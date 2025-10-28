import { writable, derived } from 'svelte/store';
import { apiClient } from '$lib/api/client';

export interface Clave {
	IdClave: string;
	DescripcionClave: string;
	IdentificadorDeAgrupacion: string;
}

export interface ClaveOption {
	value: string;
	label: string;
	idClave: string;
}

interface ClavesState {
	claves: Clave[];
	isLoading: boolean;
	error: string | null;
}

function createClavesStore() {
	const { subscribe, update } = writable<ClavesState>({
		claves: [],
		isLoading: false,
		error: null
	});

	return {
		subscribe,
		async loadClaves() {
			update((state) => ({ ...state, isLoading: true, error: null }));

			try {
				const response = await apiClient.get<{ data: Clave[] }>('/Claves');
				const claves = response.data;

				update((state) => ({
					...state,
					claves,
					isLoading: false
				}));
			} catch (error) {
				console.error('Error al cargar claves:', error);
				update((state) => ({
					...state,
					error: 'Error al cargar las claves de lectura',
					isLoading: false
				}));
			}
		},
		getClavesForGroup(groupId: string, state: ClavesState): ClaveOption[] {
			const clavesGrupo = state.claves.filter(
				(clave) => clave.IdentificadorDeAgrupacion === groupId
			);

			return [
				{ value: '0', label: 'Seleccione', idClave: '0' },
				...clavesGrupo.map((clave) => ({
					value: clave.IdClave,
					label: clave.DescripcionClave,
					idClave: clave.IdClave
				}))
			];
		},
		getClaveCorrectaId(state: ClavesState): string {
			const claveCorrecta = state.claves.find((clave) =>
				clave.DescripcionClave.includes('LEOK - LECTURA CORRECTA')
			);
			return claveCorrecta ? claveCorrecta.IdClave : '22';
		},
		getClaveByDescripcion(descripcion: string, state: ClavesState): Clave | null {
			return (
				state.claves.find((clave) =>
					clave.DescripcionClave.toLowerCase().includes(descripcion.toLowerCase())
				) || null
			);
		},
		getClaveById(id: string, state: ClavesState): Clave | null {
			return state.claves.find((clave) => clave.IdClave === id) || null;
		}
	};
}

export const clavesStore = createClavesStore();

// Derived stores para acceso fácil
export const claves = derived(clavesStore, ($store) => $store.claves);
export const clavesLoading = derived(clavesStore, ($store) => $store.isLoading);
export const clavesError = derived(clavesStore, ($store) => $store.error);
