<script lang="ts">
	interface Medidor {
		id: number;
		nSerie: string;
		claveHtml: string;
		estadoFactura: number;
		estadoClave: number;
		ultimaLectura: number;
		fechaLectura: string;
		consumo: number;
		clave: string;
	}

	interface MeterCardProps {
		medidor: Medidor;
		onclick?: () => void;
		class?: string;
	}

	let { medidor, onclick, class: className = '' }: MeterCardProps = $props();

	// Get badge color based on estadoClave
	function getBadgeColor(estadoClave: number): string {
		switch (estadoClave) {
			case 1: // Sin Lectura
				return 'bg-slate-100 text-slate-700 border-slate-300';
			case 2: // Lectura Normal
				return 'bg-emerald-100 text-emerald-700 border-emerald-300';
			case 3: // Clave Informativa
				return 'bg-sky-100 text-sky-700 border-sky-300';
			case 4: // Clave Relevante
				return 'bg-amber-100 text-amber-700 border-amber-300';
			case 5: // Clave Crítica
				return 'bg-red-100 text-red-700 border-red-300';
			default:
				return 'bg-slate-100 text-slate-700 border-slate-300';
		}
	}

	const isClickable = !!onclick;
	const badgeColor = getBadgeColor(medidor.estadoClave);
</script>

<div
	class="rounded-lg border border-slate-200 bg-sky-50/50 p-4 transition-all duration-150 {isClickable
		? 'cursor-pointer hover:border-sky-300 hover:bg-sky-100 hover:shadow-md'
		: ''} {className}"
	{onclick}
	role={isClickable ? 'button' : undefined}
	tabindex={isClickable ? 0 : undefined}
	onkeydown={(e) => {
		if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault();
			onclick?.();
		}
	}}
>
	<div class="space-y-2.5">
		<!-- Serial Number Header -->
		<div class="flex items-start justify-between gap-2">
			<div class="min-w-0 flex-1">
				<p class="text-xs font-medium tracking-wide text-slate-500 uppercase">Nº Serie</p>
				<p class="truncate text-base font-semibold text-slate-900">{medidor.nSerie}</p>
			</div>
			<!-- Status Badge -->
			<div
				class="inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium {badgeColor}"
			>
				{@html medidor.claveHtml}
			</div>
		</div>

		<!-- Reading Info -->
		<div class="grid grid-cols-2 gap-3 border-t border-slate-200 pt-2">
			<div>
				<p class="text-xs text-slate-500">Última Lectura</p>
				<p class="text-sm font-semibold text-slate-900">{medidor.ultimaLectura.toLocaleString()}</p>
			</div>
			<div>
				<p class="text-xs text-slate-500">Consumo</p>
				<p class="text-sm font-semibold text-slate-900">{medidor.consumo.toLocaleString()}</p>
			</div>
		</div>

		<!-- Date -->
		<div class="pt-1">
			<p class="text-xs text-slate-500">Fecha de Lectura</p>
			<p class="text-sm text-slate-700">{medidor.fechaLectura}</p>
		</div>
	</div>
</div>
