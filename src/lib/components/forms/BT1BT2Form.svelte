<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Medidor } from '../../../types';
	import { Button, Card, ConfirmationDialog } from '$lib/components/ui';
	import { clavesStore, type ClaveOption } from '$lib/stores/claves';
	import {
		validarDigitos,
		calcularConsumo,
		detectarConsumoAnomalo,
		getMaxValuePermitido
	} from '$lib/utils/validations';
	import { lecturasBT12Api } from '$lib/api/lecturas-bt12';

	interface Props {
		medidor: Medidor;
	}

	let { medidor }: Props = $props();

	// Estados del formulario
	let inputValue = $state('');
	let consumoCalculado = $state('');
	let tipoLectura = $state<'menor' | 'igual' | 'mayor' | null>(null);
	let selectedClave = $state('0');
	let isSubmitting = $state(false);
	let isValidated = $state(false);

	// Diálogos
	let showMenorDialog = $state(false);
	let showIgualDialog = $state(false);
	let showMayorDialog = $state(false);
	let showConsumoExcesivoDialog = $state(false);

	// DEBUG: Log del medidor recibido
	console.group('🔍 DEBUG: BT1BT2Form - Medidor Recibido');
	console.log('Medidor completo:', medidor);
	console.log('Campos críticos:', {
		LM_ID: medidor.LM_ID,
		ME_Digitos: medidor.ME_Digitos,
		LM_ValorUltimaLectura: medidor.LM_ValorUltimaLectura,
		ME_ConstanteMultiplicar: medidor.ME_ConstanteMultiplicar,
		LM_ConsumoMesAnterior: medidor.LM_ConsumoMesAnterior,
		ME_NSerie: medidor.ME_NSerie
	});
	console.groupEnd();

	// Valores del medidor
	const digito = medidor.ME_Digitos;
	const valorAnterior = medidor.LM_ValorUltimaLectura;
	const constante = medidor.ME_ConstanteMultiplicar;
	const consumoAnterior = parseInt(medidor.LM_ConsumoMesAnterior) || 0;
	const maxValuePermitido = getMaxValuePermitido(digito);

	// Cargar claves
	let clavesState = $state($clavesStore);
	clavesStore.subscribe((state) => {
		clavesState = state;
	});

	// Cargar claves al montar
	$effect(() => {
		if (clavesState.claves.length === 0 && !clavesState.isLoading) {
			clavesStore.loadClaves();
		}
	});

	// Pre-cargar datos existentes
	$effect(() => {
		if (
			medidor.LMC_EnergiaActiva !== undefined &&
			medidor.LMC_EnergiaActiva !== null &&
			medidor.LMC_EnergiaActiva >= 0
		) {
			const lecturaActual = medidor.LMC_EnergiaActiva.toString();
			inputValue = lecturaActual;
			const resultado = calcularConsumo(lecturaActual, valorAnterior, digito, constante);
			consumoCalculado = resultado.consumo;
			tipoLectura = resultado.tipo;
			if (medidor.LM_FechaLectura) {
				isValidated = true;
			}
		}
	});

	// Opciones de claves
	const clavesMenorOptions = $derived(clavesStore.getClavesForGroup('100', clavesState));
	const clavesIgualOptions = $derived(clavesStore.getClavesForGroup('200', clavesState));

	function handleInputChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const value = target.value;

		if (value === '') {
			inputValue = value;
			consumoCalculado = '';
			tipoLectura = null;
			isValidated = false;
			return;
		}

		if (isNaN(Number(value)) || Number(value) < 0) {
			return;
		}

		if (!validarDigitos(value, digito)) {
			return;
		}

		inputValue = value;
		const resultado = calcularConsumo(value, valorAnterior, digito, constante);
		consumoCalculado = resultado.consumo;
		tipoLectura = resultado.tipo;
		isValidated = false;
	}

	function validarLectura() {
		if (!inputValue || isNaN(Number(inputValue))) {
			return;
		}

		if (!validarDigitos(inputValue, digito)) {
			return;
		}

		const anomalia = detectarConsumoAnomalo(consumoCalculado, consumoAnterior, digito, constante);
		if (anomalia.esAnomalo) {
			showConsumoExcesivoDialog = true;
			return;
		}

		if (tipoLectura === 'menor') {
			showMenorDialog = true;
		} else if (tipoLectura === 'igual') {
			showIgualDialog = true;
		} else if (tipoLectura === 'mayor') {
			showMayorDialog = true;
		}
	}

	function handleConfirmLectura() {
		if (selectedClave === '0') {
			return;
		}
		showMenorDialog = false;
		showIgualDialog = false;
		isValidated = true;
	}

	function handleConfirmMayor() {
		showMayorDialog = false;
		isValidated = true;
	}

	function handleConfirmConsumoExcesivo() {
		showConsumoExcesivoDialog = false;
		if (tipoLectura === 'menor') {
			showMenorDialog = true;
		} else if (tipoLectura === 'igual') {
			showIgualDialog = true;
		} else if (tipoLectura === 'mayor') {
			showMayorDialog = true;
		}
	}

	async function guardarLectura() {
		if (!isValidated) {
			console.warn('❌ Lectura no validada');
			return;
		}

		const claid =
			tipoLectura === 'mayor' ? clavesStore.getClaveCorrectaId(clavesState) : selectedClave;

		if (claid === '0') {
			console.warn('❌ Clave no seleccionada');
			return;
		}

		const payload = {
			lmid: medidor.LM_ID.toString(),
			vactual: inputValue,
			consumo: consumoCalculado,
			claid
		};

		console.group('📤 DEBUG: Guardando Lectura BT-1/BT-2');
		console.log('Medidor completo:', medidor);
		console.log('Payload a enviar:', payload);
		console.log('Tipo de lectura:', tipoLectura);
		console.log('Estado de claves:', clavesState);
		console.log('Valores del formulario:', {
			inputValue,
			consumoCalculado,
			valorAnterior,
			digito,
			constante
		});
		console.groupEnd();

		try {
			isSubmitting = true;
			await lecturasBT12Api.actualizarLectura(payload);
			console.log('✅ Lectura guardada exitosamente');
			goto('/');
		} catch (error) {
			console.error('❌ Error al guardar lectura:', error);
			console.error('Detalles del error:', JSON.stringify(error, null, 2));
		} finally {
			isSubmitting = false;
		}
	}

	const anomalia = $derived(
		detectarConsumoAnomalo(consumoCalculado, consumoAnterior, digito, constante)
	);
</script>

<div class="space-y-4">
	<Card>
		<h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
			<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
				<svg class="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
					/>
				</svg>
			</div>
			<span>Lectura BT-1/BT-2</span>
			<span class="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-normal text-slate-500">
				{digito} dígitos
			</span>
		</h3>

		<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
			<!-- Lectura Actual -->
			<div class="space-y-2">
				<label for="lectura-actual" class="block text-sm font-medium text-slate-700">
					Lectura Actual <span class="text-red-500">*</span>
				</label>
				<input
					type="number"
					id="lectura-actual"
					value={inputValue}
					oninput={handleInputChange}
					placeholder={valorAnterior.toString()}
					max={maxValuePermitido}
					class="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none"
				/>
				<p class="text-xs text-slate-500">Máx: {maxValuePermitido.toLocaleString('es-CL')}</p>
			</div>

			<!-- Consumo Calculado -->
			<div class="space-y-2">
				<label class="block text-sm font-medium text-slate-700">Consumo kWh</label>
				<div
					class="flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-sm"
				>
					{consumoCalculado || '0'}
				</div>
				<p class="text-xs text-slate-500">Ant: {consumoAnterior.toLocaleString('es-CL')}</p>
			</div>

			<!-- Botón Validar -->
			<div class="space-y-2">
				<label class="block text-sm font-medium text-slate-700">&nbsp;</label>
				<Button
					variant="primary"
					onclick={validarLectura}
					disabled={!inputValue || isSubmitting || isValidated}
					class="w-full"
				>
					{isValidated ? '✓ Validado' : 'Validar'}
				</Button>
			</div>
		</div>

		<!-- Alertas -->
		{#if clavesState.error}
			<div
				class="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
				Error cargando claves: usando valores por defecto
			</div>
		{/if}

		{#if anomalia.esAnomalo && consumoCalculado}
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
					<div class="font-semibold">Consumo anómalo detectado</div>
					<div class="leading-relaxed">{anomalia.mensaje}</div>
				</div>
			</div>
		{/if}

		{#if Number(consumoCalculado) < 0}
			<div class="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				Consumo negativo - Verifique la lectura
			</div>
		{/if}

		{#if isValidated}
			<div
				class="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M5 13l4 4L19 7"
					/>
				</svg>
				Lectura validada - Puede guardar
			</div>
		{/if}

		<!-- Botón Guardar -->
		<div class="mt-6 flex justify-end">
			<Button variant="primary" onclick={guardarLectura} disabled={!isValidated || isSubmitting}>
				{isSubmitting ? 'Guardando...' : 'Guardar Lectura'}
			</Button>
		</div>
	</Card>
</div>

<!-- Diálogos -->
<ConfirmationDialog
	bind:open={showMenorDialog}
	title="Confirmar lectura menor"
	message="La lectura ingresada es menor que la anterior. Por favor seleccione un motivo."
	alertColor="yellow"
	showClaveSelect={true}
	claveOptions={clavesMenorOptions}
	bind:selectedClave
	onConfirm={handleConfirmLectura}
	{isSubmitting}
/>

<ConfirmationDialog
	bind:open={showIgualDialog}
	title="Confirmar lectura igual"
	message="La lectura ingresada es igual a la anterior. Por favor seleccione un motivo."
	alertColor="yellow"
	showClaveSelect={true}
	claveOptions={clavesIgualOptions}
	bind:selectedClave
	onConfirm={handleConfirmLectura}
	{isSubmitting}
/>

<ConfirmationDialog
	bind:open={showMayorDialog}
	title="Confirmar lectura"
	message="¿Está seguro de que la lectura es correcta?"
	alertColor="blue"
	onConfirm={handleConfirmMayor}
	{isSubmitting}
/>

<ConfirmationDialog
	bind:open={showConsumoExcesivoDialog}
	title="⚠️ Consumo Anómalo Detectado"
	message={`${anomalia.mensaje}

Consumo calculado: ${Number(consumoCalculado).toLocaleString('es-CL')} kWh
Consumo anterior: ${consumoAnterior.toLocaleString('es-CL')} kWh
Lectura actual: ${inputValue}
Lectura anterior: ${valorAnterior}

${
	anomalia.tipo === 'decimal_truncado'
		? '💡 Sugerencia: Si esta lectura fue importada, verifique que los valores con decimales estén correctos.'
		: '💡 Sugerencia: Verifique los valores de lectura anterior y actual antes de continuar.'
}

¿Desea continuar de todas formas?`}
	alertColor="red"
	onConfirm={handleConfirmConsumoExcesivo}
	{isSubmitting}
/>
