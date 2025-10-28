<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Medidor } from '../../../types';
	import { Button, Card, ConfirmationDialog } from '$lib/components/ui';
	import { clavesStore, type ClaveOption } from '$lib/stores/claves';
	import {
		validarDigitos,
		calcularConsumo,
		detectarConsumoAnomalo,
		getMaxValuePermitido,
		detectarOlvidoComa,
		convertirComaANumero,
		formatearFechaParaInput,
		formatearFechaParaBackend
	} from '$lib/utils/validations';
	import { lecturasBT43Api } from '$lib/api/lecturas-bt43';

	interface Props {
		medidor: Medidor;
	}

	let { medidor }: Props = $props();

	// Estados Energía Activa
	let inputActivaValue = $state('');
	let consumoActivaCalculado = $state('');
	let tipoLecturaActiva = $state<'menor' | 'igual' | 'mayor' | null>(null);
	let selectedClaveActiva = $state('0');
	let isActivaValidated = $state(false);

	// Estados Energía Reactiva
	let inputReactivaValue = $state('');
	let consumoReactivaCalculado = $state('');
	let tipoLecturaReactiva = $state<'menor' | 'igual' | 'mayor' | null>(null);
	let selectedClaveReactiva = $state('0');
	let isReactivaValidated = $state(false);

	// Estados Demandas
	let dpInputValue = $state('');
	let dsInputValue = $state('');
	let demandaData = $state({
		dp: 0,
		dpFecha: '',
		dpHora: '',
		ds: 0,
		dsFecha: '',
		dsHora: ''
	});
	let showComaWarningDP = $state(false);
	let showComaWarningDS = $state(false);

	// Diálogos
	let showMenorActivaDialog = $state(false);
	let showIgualActivaDialog = $state(false);
	let showMayorActivaDialog = $state(false);
	let showConsumoExcesivoActivaDialog = $state(false);
	let showMenorReactivaDialog = $state(false);
	let showIgualReactivaDialog = $state(false);
	let showMayorReactivaDialog = $state(false);
	let showConsumoExcesivoReactivaDialog = $state(false);

	let isSubmitting = $state(false);

	// Valores del medidor
	const digito = medidor.ME_Digitos;
	const valorActivaAnterior = medidor.LM_ValorUltimaLectura;
	const valorReactivaAnterior = parseInt(medidor.LMC_ValorUltimaLectEnergiaReactiva1) || 0;
	const consumoAnterior = parseInt(medidor.LM_ConsumoMesAnterior) || 0;
	const constante = medidor.ME_ConstanteMultiplicar;
	const maxValuePermitido = getMaxValuePermitido(digito);

	// Cargar claves
	let clavesState = $state($clavesStore);
	clavesStore.subscribe((state) => {
		clavesState = state;
	});

	$effect(() => {
		if (clavesState.claves.length === 0 && !clavesState.isLoading) {
			clavesStore.loadClaves();
		}
	});

	// Pre-cargar datos existentes
	$effect(() => {
		const energiaActiva = medidor.LMC_EnergiaActiva;
		if (energiaActiva !== undefined && energiaActiva !== null && energiaActiva >= 0) {
			// Pre-cargar energía activa
			const lecturaActiva = medidor.LMC_EnergiaActiva!.toString();
			inputActivaValue = lecturaActiva;
			const resultadoActiva = calcularConsumo(
				lecturaActiva,
				valorActivaAnterior,
				digito,
				constante
			);
			consumoActivaCalculado = resultadoActiva.consumo;
			tipoLecturaActiva = resultadoActiva.tipo;
			if (medidor.LM_FechaLectura) {
				isActivaValidated = true;
			}

			// Pre-cargar energía reactiva
			const lecturaReactiva = medidor.LMC_EnergiaReactiva!.toString();
			inputReactivaValue = lecturaReactiva;
			const resultadoReactiva = calcularConsumo(
				lecturaReactiva,
				valorReactivaAnterior,
				digito,
				constante
			);
			consumoReactivaCalculado = resultadoReactiva.consumo;
			tipoLecturaReactiva = resultadoReactiva.tipo;
			isReactivaValidated = true;

			// Pre-cargar demandas
			const dpValue = parseFloat(medidor.LMC_DemandaPunta || '0');
			const dsValue = parseFloat(medidor.LMC_DemandaSuministrada || '0');

			demandaData = {
				dp: dpValue,
				dpFecha: formatearFechaParaInput(medidor.LMC_FechaDemandaPunta || ''),
				dpHora: medidor.LMC_HoraDemandaPunta || '',
				ds: dsValue,
				dsFecha: formatearFechaParaInput(medidor.LMC_FechaDemandaSuminis || ''),
				dsHora: medidor.LMC_HoraDemandaSuminis || ''
			};

			dpInputValue = dpValue > 0 ? dpValue.toString().replace('.', ',') : '';
			dsInputValue = dsValue > 0 ? dsValue.toString().replace('.', ',') : '';
		}
	});

	// Opciones de claves
	const clavesOptions = $derived(clavesStore.getClavesForGroup('100', clavesState));
	const clavesIgualOptions = $derived(clavesStore.getClavesForGroup('200', clavesState));

	function handleActivaInputChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const value = target.value;

		if (value === '') {
			inputActivaValue = value;
			consumoActivaCalculado = '';
			tipoLecturaActiva = null;
			isActivaValidated = false;
			return;
		}

		if (isNaN(Number(value)) || Number(value) < 0 || !validarDigitos(value, digito)) {
			return;
		}

		inputActivaValue = value;
		const resultado = calcularConsumo(value, valorActivaAnterior, digito, constante);
		consumoActivaCalculado = resultado.consumo;
		tipoLecturaActiva = resultado.tipo;
		isActivaValidated = false;
	}

	function handleReactivaInputChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const value = target.value;

		if (value === '') {
			inputReactivaValue = value;
			consumoReactivaCalculado = '';
			tipoLecturaReactiva = null;
			isReactivaValidated = false;
			return;
		}

		if (isNaN(Number(value)) || Number(value) < 0 || !validarDigitos(value, digito)) {
			return;
		}

		inputReactivaValue = value;
		const resultado = calcularConsumo(value, valorReactivaAnterior, digito, constante);
		consumoReactivaCalculado = resultado.consumo;
		tipoLecturaReactiva = resultado.tipo;
		isReactivaValidated = false;
	}

	function handleDemandaPuntaChange(value: string) {
		dpInputValue = value;
		if (detectarOlvidoComa(value)) {
			showComaWarningDP = true;
		} else {
			showComaWarningDP = false;
		}
		const numeroValue = convertirComaANumero(value);
		demandaData = { ...demandaData, dp: numeroValue };
	}

	function handleDemandaSuministradaChange(value: string) {
		dsInputValue = value;
		if (detectarOlvidoComa(value)) {
			showComaWarningDS = true;
		} else {
			showComaWarningDS = false;
		}
		const numeroValue = convertirComaANumero(value);
		demandaData = { ...demandaData, ds: numeroValue };
	}

	function validarLecturaActiva() {
		if (
			!inputActivaValue ||
			isNaN(Number(inputActivaValue)) ||
			!validarDigitos(inputActivaValue, digito)
		) {
			return;
		}

		const anomalia = detectarConsumoAnomalo(
			consumoActivaCalculado,
			consumoAnterior,
			digito,
			constante
		);
		if (anomalia.esAnomalo) {
			showConsumoExcesivoActivaDialog = true;
			return;
		}

		if (tipoLecturaActiva === 'menor') {
			showMenorActivaDialog = true;
		} else if (tipoLecturaActiva === 'igual') {
			showIgualActivaDialog = true;
		} else if (tipoLecturaActiva === 'mayor') {
			showMayorActivaDialog = true;
		}
	}

	function validarLecturaReactiva() {
		if (
			!inputReactivaValue ||
			isNaN(Number(inputReactivaValue)) ||
			!validarDigitos(inputReactivaValue, digito)
		) {
			return;
		}

		const anomalia = detectarConsumoAnomalo(
			consumoReactivaCalculado,
			consumoAnterior,
			digito,
			constante
		);
		if (anomalia.esAnomalo) {
			showConsumoExcesivoReactivaDialog = true;
			return;
		}

		if (tipoLecturaReactiva === 'menor') {
			showMenorReactivaDialog = true;
		} else if (tipoLecturaReactiva === 'igual') {
			showIgualReactivaDialog = true;
		} else if (tipoLecturaReactiva === 'mayor') {
			showMayorReactivaDialog = true;
		}
	}

	function handleConfirmLecturaActiva() {
		if (selectedClaveActiva === '0') return;
		showMenorActivaDialog = false;
		showIgualActivaDialog = false;
		isActivaValidated = true;
	}

	function handleConfirmMayorActiva() {
		showMayorActivaDialog = false;
		isActivaValidated = true;
	}

	function handleConfirmLecturaReactiva() {
		if (selectedClaveReactiva === '0') return;
		showMenorReactivaDialog = false;
		showIgualReactivaDialog = false;
		isReactivaValidated = true;
	}

	function handleConfirmMayorReactiva() {
		showMayorReactivaDialog = false;
		isReactivaValidated = true;
	}

	function handleConfirmConsumoExcesivoActiva() {
		showConsumoExcesivoActivaDialog = false;
		if (tipoLecturaActiva === 'menor') showMenorActivaDialog = true;
		else if (tipoLecturaActiva === 'igual') showIgualActivaDialog = true;
		else if (tipoLecturaActiva === 'mayor') showMayorActivaDialog = true;
	}

	function handleConfirmConsumoExcesivoReactiva() {
		showConsumoExcesivoReactivaDialog = false;
		if (tipoLecturaReactiva === 'menor') showMenorReactivaDialog = true;
		else if (tipoLecturaReactiva === 'igual') showIgualReactivaDialog = true;
		else if (tipoLecturaReactiva === 'mayor') showMayorReactivaDialog = true;
	}

	async function guardarLectura() {
		if (!isActivaValidated || !isReactivaValidated) {
			return;
		}

		if (
			!demandaData.dp ||
			!demandaData.dpFecha ||
			!demandaData.dpHora ||
			!demandaData.ds ||
			!demandaData.dsFecha ||
			!demandaData.dsHora
		) {
			return;
		}

		const claveActivaId =
			tipoLecturaActiva === 'mayor'
				? clavesStore.getClaveCorrectaId(clavesState)
				: selectedClaveActiva;

		const claveReactivaId =
			tipoLecturaReactiva === 'mayor'
				? clavesStore.getClaveCorrectaId(clavesState)
				: selectedClaveReactiva;

		try {
			isSubmitting = true;
			await lecturasBT43Api.actualizarLectura({
				lmId: medidor.LM_ID,
				lecturaActiva: parseInt(inputActivaValue),
				claveActivaId,
				lecturaReactiva: parseInt(inputReactivaValue),
				claveReactivaId,
				consumoActiva: parseInt(consumoActivaCalculado),
				consumoReactiva: parseInt(consumoReactivaCalculado),
				dp: demandaData.dp,
				dpFecha: formatearFechaParaBackend(demandaData.dpFecha),
				dpHora: demandaData.dpHora,
				ds: demandaData.ds,
				dsFecha: formatearFechaParaBackend(demandaData.dsFecha),
				dsHora: demandaData.dsHora
			});
			goto('/');
		} catch (error) {
			console.error('Error al guardar lectura BT-4.3:', error);
		} finally {
			isSubmitting = false;
		}
	}

	const anomaliaActiva = $derived(
		detectarConsumoAnomalo(consumoActivaCalculado, consumoAnterior, digito, constante)
	);
	const anomaliaReactiva = $derived(
		detectarConsumoAnomalo(consumoReactivaCalculado, consumoAnterior, digito, constante)
	);
</script>

<div class="space-y-4">
	<!-- Energía Activa -->
	<Card>
		<h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
			<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100">
				<svg class="h-4 w-4 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 10V3L4 14h7v7l9-11h-7z"
					/>
				</svg>
			</div>
			<span>Energía Activa</span>
			{#if isActivaValidated}
				<div class="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
					<svg
						class="h-3.5 w-3.5 text-emerald-600"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						/>
					</svg>
				</div>
			{/if}
		</h3>

		<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
			<div class="space-y-2">
				<label for="lectura-activa" class="block text-sm font-medium text-slate-700">
					Lectura Actual <span class="text-red-500">*</span>
				</label>
				<input
					type="number"
					id="lectura-activa"
					value={inputActivaValue}
					oninput={handleActivaInputChange}
					placeholder={valorActivaAnterior.toString()}
					max={maxValuePermitido}
					class="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none"
				/>
				<p class="text-xs text-slate-500">Máx: {maxValuePermitido.toLocaleString('es-CL')}</p>
			</div>

			<div class="space-y-2">
				<label class="block text-sm font-medium text-slate-700">Consumo kWh</label>
				<div
					class="flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-sm"
				>
					{consumoActivaCalculado || '0'}
				</div>
				<p class="text-xs text-slate-500">Ant: {consumoAnterior.toLocaleString('es-CL')}</p>
			</div>

			<div class="space-y-2">
				<label class="block text-sm font-medium text-slate-700">&nbsp;</label>
				<Button
					variant="primary"
					onclick={validarLecturaActiva}
					disabled={!inputActivaValue || isSubmitting || isActivaValidated}
					class="w-full"
				>
					{isActivaValidated ? '✓ Validado' : 'Validar'}
				</Button>
			</div>
		</div>

		{#if anomaliaActiva.esAnomalo && consumoActivaCalculado}
			<div
				class="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
			>
				<svg class="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<div>
					<div class="font-semibold">Consumo anómalo detectado (Activa)</div>
					<div class="leading-relaxed">{anomaliaActiva.mensaje}</div>
				</div>
			</div>
		{/if}
	</Card>

	<!-- Energía Reactiva -->
	<Card>
		<h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
			<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
				<svg class="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
					/>
				</svg>
			</div>
			<span>Energía Reactiva</span>
			{#if isReactivaValidated}
				<div class="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
					<svg
						class="h-3.5 w-3.5 text-emerald-600"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						/>
					</svg>
				</div>
			{/if}
		</h3>

		<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
			<div class="space-y-2">
				<label for="lectura-reactiva" class="block text-sm font-medium text-slate-700">
					Lectura Actual <span class="text-red-500">*</span>
				</label>
				<input
					type="number"
					id="lectura-reactiva"
					value={inputReactivaValue}
					oninput={handleReactivaInputChange}
					placeholder={valorReactivaAnterior.toString()}
					max={maxValuePermitido}
					class="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none"
				/>
				<p class="text-xs text-slate-500">Máx: {maxValuePermitido.toLocaleString('es-CL')}</p>
			</div>

			<div class="space-y-2">
				<label class="block text-sm font-medium text-slate-700">Consumo kVArh</label>
				<div
					class="flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-sm"
				>
					{consumoReactivaCalculado || '0'}
				</div>
				<p class="text-xs text-slate-500">Ant: {consumoAnterior.toLocaleString('es-CL')}</p>
			</div>

			<div class="space-y-2">
				<label class="block text-sm font-medium text-slate-700">&nbsp;</label>
				<Button
					variant="primary"
					onclick={validarLecturaReactiva}
					disabled={!inputReactivaValue || isSubmitting || isReactivaValidated}
					class="w-full"
				>
					{isReactivaValidated ? '✓ Validado' : 'Validar'}
				</Button>
			</div>
		</div>

		{#if anomaliaReactiva.esAnomalo && consumoReactivaCalculado}
			<div
				class="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
			>
				<svg class="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<div>
					<div class="font-semibold">Consumo anómalo detectado (Reactiva)</div>
					<div class="leading-relaxed">{anomaliaReactiva.mensaje}</div>
				</div>
			</div>
		{/if}
	</Card>

	<!-- Demandas -->
	<Card>
		<h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
			<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
				<svg class="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
					/>
				</svg>
			</div>
			<span>Demandas kW</span>
			{#if !isActivaValidated || !isReactivaValidated}
				<span class="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700"
					>Requiere validación previa</span
				>
			{/if}
		</h3>

		<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
			<!-- Demanda Punta -->
			<div class="space-y-2">
				<div class="flex items-center gap-2 text-sm font-medium text-slate-700">
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
						/>
					</svg>
					Demanda Punta
				</div>
				<div class="grid grid-cols-3 gap-2">
					<div>
						<label for="dp-valor" class="block text-xs text-slate-600">Valor kW</label>
						<input
							type="text"
							id="dp-valor"
							value={dpInputValue}
							oninput={(e) => handleDemandaPuntaChange(e.currentTarget.value)}
							placeholder="0,00"
							disabled={!isActivaValidated || !isReactivaValidated}
							class="w-full rounded-lg border border-slate-300 px-2 py-2 font-mono text-sm transition-colors placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
						/>
						{#if showComaWarningDP}
							<p class="mt-1 flex items-center gap-1 text-xs text-amber-600">
								<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
									/>
								</svg>
								¿Olvidó la coma?
							</p>
						{/if}
					</div>
					<div>
						<label for="dp-fecha" class="block text-xs text-slate-600">Fecha</label>
						<input
							type="date"
							id="dp-fecha"
							bind:value={demandaData.dpFecha}
							disabled={!isActivaValidated || !isReactivaValidated}
							class="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
							max={new Date().toISOString().slice(0, 10)}
						/>
					</div>
					<div>
						<label for="dp-hora" class="block text-xs text-slate-600">Hora</label>
						<input
							type="time"
							id="dp-hora"
							bind:value={demandaData.dpHora}
							disabled={!isActivaValidated || !isReactivaValidated}
							class="w-full rounded-lg border border-slate-300 px-2 py-2 font-mono text-sm transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
						/>
					</div>
				</div>
			</div>

			<!-- Demanda Suministrada -->
			<div class="space-y-2">
				<div class="flex items-center gap-2 text-sm font-medium text-emerald-700">
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
						/>
					</svg>
					Demanda Suministrada
				</div>
				<div class="grid grid-cols-3 gap-2">
					<div>
						<label for="ds-valor" class="block text-xs text-slate-600">Valor kW</label>
						<input
							type="text"
							id="ds-valor"
							value={dsInputValue}
							oninput={(e) => handleDemandaSuministradaChange(e.currentTarget.value)}
							placeholder="0,00"
							disabled={!isActivaValidated || !isReactivaValidated}
							class="w-full rounded-lg border border-slate-300 px-2 py-2 font-mono text-sm transition-colors placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
						/>
						{#if showComaWarningDS}
							<p class="mt-1 flex items-center gap-1 text-xs text-amber-600">
								<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
									/>
								</svg>
								¿Olvidó la coma?
							</p>
						{/if}
					</div>
					<div>
						<label for="ds-fecha" class="block text-xs text-slate-600">Fecha</label>
						<input
							type="date"
							id="ds-fecha"
							bind:value={demandaData.dsFecha}
							disabled={!isActivaValidated || !isReactivaValidated}
							class="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
						/>
					</div>
					<div>
						<label for="ds-hora" class="block text-xs text-slate-600">Hora</label>
						<input
							type="time"
							id="ds-hora"
							bind:value={demandaData.dsHora}
							disabled={!isActivaValidated || !isReactivaValidated}
							class="w-full rounded-lg border border-slate-300 px-2 py-2 font-mono text-sm transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
						/>
					</div>
				</div>
			</div>
		</div>

		<!-- Botón Guardar -->
		<div class="mt-6 flex justify-end">
			<Button
				variant="primary"
				onclick={guardarLectura}
				disabled={!isActivaValidated ||
					!isReactivaValidated ||
					!demandaData.dp ||
					!demandaData.dpFecha ||
					!demandaData.dpHora ||
					!demandaData.ds ||
					!demandaData.dsFecha ||
					!demandaData.dsHora ||
					isSubmitting}
			>
				{isSubmitting ? 'Guardando...' : 'Guardar Lectura'}
			</Button>
		</div>
	</Card>
</div>

<!-- Diálogos Energía Activa -->
<ConfirmationDialog
	bind:open={showMenorActivaDialog}
	title="Confirmar Lectura Activa Menor"
	message="La lectura activa ingresada es menor que la anterior. Por favor seleccione un motivo."
	alertColor="yellow"
	showClaveSelect={true}
	claveOptions={clavesOptions}
	bind:selectedClave={selectedClaveActiva}
	onConfirm={handleConfirmLecturaActiva}
	{isSubmitting}
/>

<ConfirmationDialog
	bind:open={showIgualActivaDialog}
	title="Confirmar Lectura Activa Igual"
	message="La lectura activa ingresada es igual a la anterior. Por favor seleccione un motivo."
	alertColor="yellow"
	showClaveSelect={true}
	claveOptions={clavesIgualOptions}
	bind:selectedClave={selectedClaveActiva}
	onConfirm={handleConfirmLecturaActiva}
	{isSubmitting}
/>

<ConfirmationDialog
	bind:open={showMayorActivaDialog}
	title="Confirmar Lectura Activa"
	message="¿Está seguro de que la lectura activa es correcta?"
	alertColor="blue"
	onConfirm={handleConfirmMayorActiva}
	{isSubmitting}
/>

<ConfirmationDialog
	bind:open={showConsumoExcesivoActivaDialog}
	title="⚠️ Consumo de Energía Activa Anómalo"
	message={`${anomaliaActiva.mensaje}

Consumo calculado: ${Number(consumoActivaCalculado).toLocaleString('es-CL')} kWh
Consumo anterior: ${consumoAnterior.toLocaleString('es-CL')} kWh
Lectura actual: ${inputActivaValue}
Lectura anterior: ${valorActivaAnterior}

${
	anomaliaActiva.tipo === 'decimal_truncado'
		? '💡 Sugerencia: Si esta lectura fue importada, verifique que los valores con decimales estén correctos.'
		: '💡 Sugerencia: Verifique los valores de lectura anterior y actual antes de continuar.'
}

¿Desea continuar de todas formas?`}
	alertColor="red"
	onConfirm={handleConfirmConsumoExcesivoActiva}
	{isSubmitting}
/>

<!-- Diálogos Energía Reactiva -->
<ConfirmationDialog
	bind:open={showMenorReactivaDialog}
	title="Confirmar Lectura Reactiva Menor"
	message="La lectura reactiva ingresada es menor que la anterior. Por favor seleccione un motivo."
	alertColor="yellow"
	showClaveSelect={true}
	claveOptions={clavesOptions}
	bind:selectedClave={selectedClaveReactiva}
	onConfirm={handleConfirmLecturaReactiva}
	{isSubmitting}
/>

<ConfirmationDialog
	bind:open={showIgualReactivaDialog}
	title="Confirmar Lectura Reactiva Igual"
	message="La lectura reactiva ingresada es igual a la anterior. Por favor seleccione un motivo."
	alertColor="yellow"
	showClaveSelect={true}
	claveOptions={clavesIgualOptions}
	bind:selectedClave={selectedClaveReactiva}
	onConfirm={handleConfirmLecturaReactiva}
	{isSubmitting}
/>

<ConfirmationDialog
	bind:open={showMayorReactivaDialog}
	title="Confirmar Lectura Reactiva"
	message="¿Está seguro de que la lectura reactiva es correcta?"
	alertColor="blue"
	onConfirm={handleConfirmMayorReactiva}
	{isSubmitting}
/>

<ConfirmationDialog
	bind:open={showConsumoExcesivoReactivaDialog}
	title="⚠️ Consumo de Energía Reactiva Anómalo"
	message={`${anomaliaReactiva.mensaje}

Consumo calculado: ${Number(consumoReactivaCalculado).toLocaleString('es-CL')} kVArh
Consumo anterior: ${consumoAnterior.toLocaleString('es-CL')} kVArh
Lectura actual: ${inputReactivaValue}
Lectura anterior: ${valorReactivaAnterior}

${
	anomaliaReactiva.tipo === 'decimal_truncado'
		? '💡 Sugerencia: Si esta lectura fue importada, verifique que los valores con decimales estén correctos.'
		: '💡 Sugerencia: Verifique los valores de lectura anterior y actual antes de continuar.'
}

¿Desea continuar de todas formas?`}
	alertColor="red"
	onConfirm={handleConfirmConsumoExcesivoReactiva}
	{isSubmitting}
/>
