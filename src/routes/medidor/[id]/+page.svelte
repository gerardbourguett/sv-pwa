<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui';
	import BT1BT2Form from '$lib/components/forms/BT1BT2Form.svelte';
	import BT43Form from '$lib/components/forms/BT43Form.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const medidor = data.medidor;
	const isBT43 = medidor.tarifa === 'BT-4.3';

	function volver() {
		goto('/');
	}

	function formatFecha(fecha: string): string {
		if (!fecha) return 'Sin fecha';
		try {
			const date = new Date(fecha);
			return date.toLocaleDateString('es-CL', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch {
			return fecha;
		}
	}
</script>

<div class="min-h-screen bg-slate-50 pb-20">
	<!-- Header Sticky -->
	<div class="sticky top-0 z-10 border-b border-slate-200 bg-white shadow-sm">
		<div class="mx-auto max-w-4xl px-4 py-4">
			<div class="flex items-center gap-3">
				<button
					onclick={volver}
					class="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 transition-colors hover:bg-slate-50 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:outline-none"
				>
					<svg class="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 19l-7-7 7-7"
						/>
					</svg>
				</button>
				<div class="flex-1">
					<h1 class="text-lg font-semibold text-slate-900">Medidor {medidor.ME_NSerie}</h1>
					<p class="text-sm text-slate-600">{medidor.tarifa} - {medidor.ubicacion}</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Contenido -->
	<div class="mx-auto max-w-4xl px-4 py-6">
		<!-- Info del medidor -->
		<div class="mb-6 rounded-lg border border-slate-200 bg-white p-4">
			<h2 class="mb-3 text-sm font-semibold text-slate-900">Información del Medidor</h2>
			<div class="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
				<div>
					<p class="text-xs text-slate-500">Ubicación</p>
					<p class="font-medium text-slate-900">{medidor.ubicacion}</p>
				</div>
				<div>
					<p class="text-xs text-slate-500">Local</p>
					<p class="font-medium text-slate-900">{medidor.local}</p>
				</div>
				<div>
					<p class="text-xs text-slate-500">Lectura Anterior</p>
					<p class="font-medium text-slate-900">
						{medidor.LM_ValorUltimaLectura.toLocaleString('es-CL')}
					</p>
				</div>
				<div>
					<p class="text-xs text-slate-500">Última Lectura</p>
					<p class="font-medium text-slate-900">{formatFecha(medidor.LM_FechaLectura)}</p>
				</div>
			</div>
		</div>

		<!-- Formulario según tarifa -->
		{#if isBT43}
			<BT43Form {medidor} />
		{:else}
			<BT1BT2Form {medidor} />
		{/if}
	</div>
</div>
