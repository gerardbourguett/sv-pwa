<script lang="ts">
	import { onMount } from 'svelte';
	import { periodosApi } from '$lib/api/periodos';
	import { clavesApi } from '$lib/api/claves';
	import { sectoresApi } from '$lib/api/sectores';
	import { lecturasApi } from '$lib/api/sector';
	import { lecturasStore } from '$lib/stores/lecturas';
	import type { Periodo, Clave, Sector, LecturaResponse, EstadoClave } from '../types';
	import { Button, Card, LoadingSpinner, FormField, ModernMeterCard } from '$lib/components/ui';

	// Datos de los catalogos
	let periodos = $state<Periodo[]>([]);
	let claves = $state<Clave[]>([]);
	let sectores = $state<Sector[]>([]);

	// Estados de carga
	let loadingCatalogos = $state(false);
	let loadingLecturas = $state(false);
	let errorCatalogos = $state<string>('');
	let errorLecturas = $state<string>('');

	// Campos obligatorios del formulario
	let selectedSector = $state<string>('');
	let selectedPeriodo = $state<string>('');
	let fechaInicio = $state<string>('');
	let fechaFin = $state<string>('');

	// Filtros opcionales
	let selectedTipoClave = $state<string>('');
	let selectedEstado = $state<EstadoClave | ''>('');
	let numeroSerieMedidor = $state<string>('');

	// Datos de lecturas
	let lecturas = $state<LecturaResponse | null>(null);

	// Estados disponibles para el filtro
	const estadosDisponibles: EstadoClave[] = [
		'Todos los estados',
		'Sin Lectura',
		'Lectura Normal',
		'Clave Informativa',
		'Clave relevante',
		'Clave Crítica'
	];

	// Función para obtener la fecha de hoy en formato YYYY-MM-DD
	function getFechaHoy(): string {
		const hoy = new Date();
		return hoy.toISOString().split('T')[0];
	}

	// Función para convertir fecha de dd-MM-yyyy a yyyy-MM-dd
	function convertirFechaAFormatoHTML(fecha: string): string {
		// Si ya está en formato correcto, retornarla
		if (fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
			return fecha;
		}

		// Convertir de dd-MM-yyyy a yyyy-MM-dd
		const partes = fecha.split('-');
		if (partes.length === 3) {
			const [dia, mes, anio] = partes;
			return `${anio}-${mes}-${dia}`;
		}

		return fecha;
	}

	onMount(async () => {
		try {
			loadingCatalogos = true;
			const [periodosRes, clavesRes, sectoresRes] = await Promise.all([
				periodosApi.getPeriodos(),
				clavesApi.getClaves(),
				sectoresApi.getSectores()
			]);
			periodos = periodosRes;
			claves = clavesRes;
			sectores = sectoresRes;

			// Seleccionamos el periodo actual, tiene el "EstadoPeriodo": 2
			const periodoActual = periodos.find((p) => p.EstadoPeriodo === 2);
			if (periodoActual) {
				selectedPeriodo = periodoActual.IdPeriodo;
				// Fecha de inicio: FechaInicio del periodo (convertida a formato HTML)
				fechaInicio = convertirFechaAFormatoHTML(periodoActual.FechaInicio);
				// Fecha fin: siempre la fecha de hoy
				fechaFin = getFechaHoy();
			}

			// Seleccionar el primer sector si existe
			if (sectores.length > 0) {
				selectedSector = sectores[0].sectorId;
			}
		} catch (err) {
			console.error(err);
			errorCatalogos = err instanceof Error ? err.message : 'Error al cargar los catálogos';
		} finally {
			loadingCatalogos = false;
		}
	});

	// Función para cargar las lecturas
	async function cargarLecturas() {
		if (!selectedSector || !selectedPeriodo || !fechaInicio || !fechaFin) {
			errorLecturas = 'Por favor complete todos los campos obligatorios';
			return;
		}

		try {
			loadingLecturas = true;
			errorLecturas = '';

			// Convertir fechas a formato YYYYMMDD
			const stfechaini = fechaInicio.replace(/-/g, '');
			const stfechafin = fechaFin.replace(/-/g, '');

			const response = await lecturasApi.getLecturas(
				selectedSector,
				selectedPeriodo,
				stfechaini,
				stfechafin,
				selectedTipoClave || undefined,
				numeroSerieMedidor || undefined,
				selectedEstado && selectedEstado !== 'Todos los estados' ? selectedEstado : undefined
			);

			lecturas = response;

			// Guardar los medidores en el store para acceso desde otras páginas
			// Aplanar todos los medidores de nichos/filas
			const todosMedidores: any[] = [];
			if (response && response.nichos) {
				response.nichos.forEach((nicho: any) => {
					nicho.filas.forEach((fila: any) => {
						fila.medidores.forEach((medidor: any) => {
							// Asegurarse de que el medidor tenga un ID consistente y el campo nicho
							const medidorConId = {
								...medidor,
								LM_ID: medidor.id || medidor.LM_ID,
								ME_Digitos: medidor.digitos || medidor.ME_Digitos || 0,
								LM_ValorUltimaLectura: medidor.ultimaLectura || medidor.LM_ValorUltimaLectura || 0,
								ME_ConstanteMultiplicar: medidor.constante || medidor.ME_ConstanteMultiplicar || 1,
								LM_ConsumoMesAnterior:
									medidor.consumoAnterior || medidor.LM_ConsumoMesAnterior || '0',
								ME_NSerie: medidor.nSerie || medidor.ME_NSerie || '',
								nicho: nicho.nombre, // Campo nicho para store inteligente
								periodo: selectedPeriodo,
								sector: selectedSector
							};
							todosMedidores.push(medidorConId);
						});
					});
				});
			}
			// Guardar medidores y contexto
			lecturasStore.setMedidores(todosMedidores, selectedPeriodo, selectedSector);
			lecturasStore.setContextoBusqueda(selectedPeriodo, selectedSector);
		} catch (err) {
			console.error(err);
			errorLecturas = err instanceof Error ? err.message : 'Error al cargar las lecturas';
			lecturas = null;
		} finally {
			loadingLecturas = false;
		}
	}

	// Función para actualizar las fechas cuando cambia el periodo
	function onPeriodoChange() {
		const periodo = periodos.find((p) => p.IdPeriodo === selectedPeriodo);
		if (periodo) {
			// Fecha de inicio: FechaInicio del periodo seleccionado (convertida a formato HTML)
			fechaInicio = convertirFechaAFormatoHTML(periodo.FechaInicio);
			// Fecha fin: siempre la fecha de hoy
			fechaFin = getFechaHoy();
		}
	}
</script>

<div class="mx-auto max-w-7xl px-4 py-6">
	<!-- Page Header -->
	<div class="mb-6">
		<h1 class="text-2xl font-bold text-slate-900">Consulta de Lecturas</h1>
		<p class="mt-1 text-sm text-slate-600">
			Seleccione los filtros y busque las lecturas de los medidores
		</p>
	</div>

	{#if loadingCatalogos}
		<div class="flex justify-center py-12">
			<LoadingSpinner size="lg" message="Cargando catálogos..." />
		</div>
	{:else if errorCatalogos}
		<div class="rounded-lg border border-red-200 bg-red-50 p-4">
			<p class="text-sm font-medium text-red-800">{errorCatalogos}</p>
		</div>
	{:else}
		<!-- Formulario de búsqueda -->
		<Card class="mb-6">
			<h2 class="mb-6 text-xl font-semibold text-slate-900">Filtros de búsqueda</h2>

			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<!-- 1. Sector (Obligatorio) -->
				<FormField label="Sector" htmlFor="sector" required={true}>
					<select
						id="sector"
						class="w-full rounded-lg border border-slate-300 px-3 py-2.5 shadow-sm transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
						bind:value={selectedSector}
						disabled={sectores.length === 0}
					>
						<option value="" disabled>Seleccione un sector</option>
						{#each sectores as sector}
							<option value={sector.sectorId}>
								{sector.descripcion}
							</option>
						{/each}
					</select>
				</FormField>

				<!-- 2. Periodo (Obligatorio) -->
				<FormField label="Periodo" htmlFor="periodo" required={true}>
					<select
						id="periodo"
						class="w-full rounded-lg border border-slate-300 px-3 py-2.5 shadow-sm transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
						bind:value={selectedPeriodo}
						onchange={onPeriodoChange}
						disabled={periodos.length === 0}
					>
						<option value="" disabled>Seleccione un periodo</option>
						{#each periodos as periodo}
							<option value={periodo.IdPeriodo}>
								{periodo.DescripcionPeriodo}
							</option>
						{/each}
					</select>
				</FormField>

				<!-- 3. Fecha de inicio (Obligatorio - automática del periodo) -->
				<FormField
					label="Fecha de inicio"
					htmlFor="fecha-inicio"
					required={true}
					helper="desde inicio del periodo"
				>
					<input
						type="date"
						id="fecha-inicio"
						class="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 shadow-sm transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none"
						bind:value={fechaInicio}
						readonly
					/>
				</FormField>

				<!-- 4. Fecha final (Obligatorio) -->
				<FormField label="Fecha final" htmlFor="fecha-final" required={true}>
					<input
						type="date"
						id="fecha-final"
						class="w-full rounded-lg border border-slate-300 px-3 py-2.5 shadow-sm transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none"
						bind:value={fechaFin}
					/>
				</FormField>
			</div>

			<!-- Filtros opcionales -->
			<div class="mt-6 border-t border-slate-200 pt-6">
				<h3 class="mb-4 text-lg font-medium text-slate-800">Filtros opcionales</h3>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
					<!-- 5. Clave (Opcional - se envía como tipoclave) -->
					<FormField label="Tipo de Clave" htmlFor="tipoclave">
						<select
							id="tipoclave"
							class="w-full rounded-lg border border-slate-300 px-3 py-2.5 shadow-sm transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
							bind:value={selectedTipoClave}
							disabled={claves.length === 0}
						>
							<option value="">Todos</option>
							{#each claves as clave}
								<option value={clave.IdClave}>
									{clave.DescripcionClave}
								</option>
							{/each}
						</select>
					</FormField>

					<!-- 6. Estado (Opcional - se envía como clave) -->
					<FormField label="Estado" htmlFor="estado">
						<select
							id="estado"
							class="w-full rounded-lg border border-slate-300 px-3 py-2.5 shadow-sm transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none"
							bind:value={selectedEstado}
						>
							{#each estadosDisponibles as estado}
								<option value={estado}>
									{estado}
								</option>
							{/each}
						</select>
					</FormField>

					<!-- 7. Número de serie del medidor (Opcional) -->
					<FormField label="Nº Serie Medidor" htmlFor="medidor">
						<input
							type="text"
							id="medidor"
							placeholder="Ej: 12345678"
							class="w-full rounded-lg border border-slate-300 px-3 py-2.5 shadow-sm transition-colors placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none"
							bind:value={numeroSerieMedidor}
						/>
					</FormField>
				</div>
			</div>

			<!-- Botón de búsqueda -->
			<div class="mt-6 flex justify-end">
				<Button
					variant="primary"
					size="md"
					onclick={cargarLecturas}
					disabled={loadingLecturas ||
						!selectedSector ||
						!selectedPeriodo ||
						!fechaInicio ||
						!fechaFin}
				>
					{loadingLecturas ? 'Buscando...' : 'Buscar Lecturas'}
				</Button>
			</div>
		</Card>

		<!-- Mensajes de error -->
		{#if errorLecturas}
			<div class="rounded-lg border border-red-200 bg-red-50 p-4">
				<p class="text-sm font-medium text-red-800">{errorLecturas}</p>
			</div>
		{/if}

		<!-- Resultados de lecturas -->
		{#if loadingLecturas}
			<div class="flex justify-center py-12">
				<LoadingSpinner size="lg" message="Cargando lecturas..." />
			</div>
		{:else if lecturas}
			<!-- Indicador de progreso -->
			{@const totalMedidores = lecturas.nichos.reduce(
				(total: number, nicho: any) =>
					total +
					nicho.filas.reduce(
						(filaTotal: number, fila: any) => filaTotal + fila.medidores.length,
						0
					),
				0
			)}
			{@const medidoresConLectura = lecturas.nichos.reduce(
				(total: number, nicho: any) =>
					total +
					nicho.filas.reduce(
						(filaTotal: number, fila: any) =>
							filaTotal +
							fila.medidores.filter((m: any) => m.fechaLectura && m.fechaLectura !== '').length,
						0
					),
				0
			)}

			<div class="mb-4 rounded-lg border border-sky-200 bg-sky-50 p-4">
				<div class="mb-2 flex items-center justify-between">
					<p class="text-sm font-medium text-sky-900">Progreso de Lecturas</p>
					<p class="text-sm font-semibold text-sky-700">
						{medidoresConLectura} de {totalMedidores}
					</p>
				</div>
				<div class="h-2 w-full overflow-hidden rounded-full bg-sky-100">
					<div
						class="h-full bg-sky-600 transition-all duration-300"
						style="width: {totalMedidores > 0 ? (medidoresConLectura / totalMedidores) * 100 : 0}%"
					></div>
				</div>
			</div>

			<!-- Lista de medidores -->
			{#if lecturas.nichos && lecturas.nichos.length > 0}
				<div class="space-y-6">
					{#each lecturas.nichos as nicho}
						<!-- Encabezado de Nicho -->
						<div>
							<div class="mb-3 flex items-center gap-2 border-b-2 border-sky-500 pb-2">
								<svg
									class="h-5 w-5 text-sky-600"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
									/>
								</svg>
								<h3 class="text-lg font-semibold text-slate-900">{nicho.nombre}</h3>
							</div>

							<!-- Medidores del nicho -->
							<div class="space-y-3">
								{#each nicho.filas as fila}
									{#each fila.medidores as medidor}
										<ModernMeterCard
											medidor={{
												...medidor,
												nSerie: medidor.nSerie || '',
												ultimaLectura: medidor.ultimaLectura || 0,
												consumo: medidor.consumo || 0
											}}
										/>
									{/each}
								{/each}
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<Card>
					<div class="py-12 text-center">
						<svg
							class="mx-auto h-12 w-12 text-slate-300"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
							/>
						</svg>
						<p class="mt-4 text-slate-500">No se encontraron lecturas</p>
					</div>
				</Card>
			{/if}
		{/if}
	{/if}
</div>
