import { writable, get } from 'svelte/store';

interface LecturasState {
	medidores: any[];
	periodo: string;
	sector: string;
}

function createLecturasStore() {
	const store = writable<LecturasState>({
		medidores: [],
		periodo: '',
		sector: ''
	});

	return {
		subscribe: store.subscribe,
		setMedidores(medidores: any[], periodo: string, sector: string) {
			store.set({ medidores, periodo, sector });
		},
		getMedidorById(id: number): any | undefined {
			const state = get(store);
			return state.medidores.find((m) => m.id === id || m.LM_ID === id);
		},
		clear() {
			store.set({ medidores: [], periodo: '', sector: '' });
		}
	};
}

export const lecturasStore = createLecturasStore();
