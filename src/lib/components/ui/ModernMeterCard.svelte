<script lang="ts">
	import { goto } from '$app/navigation';

	interface Medidor {
		id: number;
		nSerie: string;
		claveHtml: string;
		estadoFactura?: number;
		estadoClave?: number;
		ultimaLectura: number;
		fechaLectura: string;
		consumo: number;
		clave?: string;
		ubicacion?: string;
		tarifa?: string;
		local?: string;
	}

	interface Props {
		medidor: Medidor;
		class?: string;
	}

	let { medidor, class: className = '' }: Props = $props();

	// Extraer propiedades opcionales del medidor
	const ubicacion = medidor.ubicacion || '';
	const tarifa = medidor.tarifa || '';
	const local = medidor.local || '';

	// Mapeo de estados visuales basado en claveHtml
	const statusMap: Record<
		string,
		{
			color: string;
			bgColor: string;
			borderColor: string;
			textColor: string;
			label: string;
			icon: string;
			severity: number;
		}
	> = {
		SINLEC: {
			color: 'gray',
			bgColor: 'bg-slate-100',
			borderColor: 'border-slate-300',
			textColor: 'text-slate-700',
			label: 'Sin Lectura',
			icon: '📋',
			severity: 1
		},
		SINCLA: {
			color: 'emerald',
			bgColor: 'bg-emerald-100',
			borderColor: 'border-emerald-300',
			textColor: 'text-emerald-700',
			label: 'Lectura Normal',
			icon: '✓',
			severity: 0
		},
		CLAINF: {
			color: 'yellow',
			bgColor: 'bg-yellow-100',
			borderColor: 'border-yellow-300',
			textColor: 'text-yellow-700',
			label: 'Clave Informativa',
			icon: 'ℹ️',
			severity: 2
		},
		CLAREL: {
			color: 'orange',
			bgColor: 'bg-orange-100',
			borderColor: 'border-orange-300',
			textColor: 'text-orange-700',
			label: 'Clave Relevante',
			icon: '⚠️',
			severity: 3
		},
		CLACRI: {
			color: 'red',
			bgColor: 'bg-red-100',
			borderColor: 'border-red-300',
			textColor: 'text-red-700',
			label: 'Clave Crítica',
			icon: '🔴',
			severity: 4
		},
		LECCER: {
			color: 'blue',
			bgColor: 'bg-blue-100',
			borderColor: 'border-blue-300',
			textColor: 'text-blue-700',
			label: 'Lectura Cerrada',
			icon: '🔒',
			severity: 0
		},
		LECIMP: {
			color: 'purple',
			bgColor: 'bg-purple-100',
			borderColor: 'border-purple-300',
			textColor: 'text-purple-700',
			label: 'En Facturación',
			icon: '📊',
			severity: 0
		}
	};

	// Parsear claveHtml para extraer el código de estado
	function getEstadoFromHtml(html: string): string {
		// Buscar patrones como SINLEC, CLACRI, etc.
		const match = html.match(/(SINLEC|SINCLA|CLAINF|CLAREL|CLACRI|LECCER|LECIMP)/);
		return match ? match[1] : 'SINLEC';
	}

	const estadoClave = getEstadoFromHtml(medidor.claveHtml);
	const status = statusMap[estadoClave] || statusMap.SINLEC;

	// Verificar si ya tiene lectura ingresada
	const tieneLechturaActual = medidor.fechaLectura && medidor.fechaLectura !== '';

	// Verificar si el medidor está bloqueado (facturado)
	const estaFacturado = estadoClave === 'LECIMP' || estadoClave === 'LECCER';
	const esEditable = !estaFacturado;

	function handleClick() {
		// No permitir edición si está facturado o cerrado
		if (!esEditable) {
			return;
		}
		// Navegar solo con el ID del medidor
		goto(`/medidor/${medidor.id}`);
	}

	function formatFecha(fecha: string): string {
		if (!fecha) return 'Sin fecha';
		try {
			const date = new Date(fecha);
			return date.toLocaleDateString('es-CL', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric'
			});
		} catch {
			return fecha;
		}
	}
</script>

<button
	onclick={handleClick}
	disabled={!esEditable}
	class="group w-full rounded-xl border-2 {status.borderColor} bg-white p-4 text-left shadow-sm transition-all duration-200 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:outline-none {esEditable
		? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:translate-y-0'
		: 'cursor-not-allowed opacity-75'} {className}"
	title={!esEditable ? 'Este medidor ya está facturado y no puede ser modificado' : ''}
>
	<!-- Header con Estado -->
	<div class="mb-3 flex items-start justify-between gap-2">
		<div
			class="inline-flex items-center gap-1.5 rounded-full {status.bgColor} px-3 py-1 text-xs font-medium {status.textColor} border {status.borderColor}"
		>
			<span class="text-sm">{status.icon}</span>
			<span>{status.label}</span>
		</div>

		<div class="flex items-center gap-2">
			{#if !esEditable}
				<div
					class="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600"
					title="Bloqueado - No editable"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
						/>
					</svg>
				</div>
			{:else if tieneLechturaActual}
				<div
					class="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
					title="Lectura ingresada"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						/>
					</svg>
				</div>
			{/if}
		</div>
	</div>

	<!-- Información Principal -->
	<div class="space-y-2.5">
		<!-- Número de Serie -->
		<div>
			<p class="text-xs font-medium text-slate-500">Nº de Serie</p>
			<p class="text-lg font-bold text-slate-900">{medidor.nSerie}</p>
		</div>

		<!-- Ubicación y Local -->
		{#if ubicacion || local}
			<div class="flex items-start gap-2 text-sm">
				<svg
					class="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
					/>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
					/>
				</svg>
				<div class="min-w-0 flex-1">
					{#if ubicacion}
						<p class="truncate text-slate-700">{ubicacion}</p>
					{/if}
					{#if local}
						<p class="text-xs text-slate-500">{local}</p>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Métricas Grid -->
		<div class="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3">
			<div>
				<p class="text-xs text-slate-500">Consumo</p>
				<p class="text-base font-semibold text-slate-900">
					{medidor.consumo.toLocaleString('es-CL')}
					<span class="text-xs font-normal text-slate-500">kWh</span>
				</p>
			</div>
			<div>
				<p class="text-xs text-slate-500">Última Lectura</p>
				<p class="text-base font-semibold text-slate-900">
					{medidor.ultimaLectura.toLocaleString('es-CL')}
				</p>
			</div>
		</div>

		<!-- Banner de medidor bloqueado -->
		{#if !esEditable}
			<div
				class="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2"
			>
				<svg
					class="h-4 w-4 shrink-0 text-slate-600"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
					/>
				</svg>
				<p class="text-xs font-medium text-slate-600">
					Lectura bloqueada - {estadoClave === 'LECIMP' ? 'En facturación' : 'Cerrada'}
				</p>
			</div>
		{/if}

		<!-- Fecha y Tarifa -->
		<div class="flex items-center justify-between text-xs">
			<div class="flex items-center gap-1.5 text-slate-500">
				<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
					/>
				</svg>
				<span>{formatFecha(medidor.fechaLectura)}</span>
			</div>
			{#if tarifa}
				<span class="rounded-md bg-sky-100 px-2 py-0.5 font-medium text-sky-700">{tarifa}</span>
			{/if}
		</div>
	</div>

	<!-- Indicador de Acción -->
	<div class="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
		<span class="text-xs font-medium text-slate-600">
			{tieneLechturaActual ? 'Ver/Editar lectura' : 'Ingresar lectura'}
		</span>
		<svg
			class="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
		</svg>
	</div>
</button>
