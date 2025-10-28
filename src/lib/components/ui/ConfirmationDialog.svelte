<script lang="ts">
	import { Dialog } from 'bits-ui';
	import type { ClaveOption } from '$lib/stores/claves';
	import { Button } from '$lib/components/ui';

	interface Props {
		open: boolean;
		onOpenChange?: (open: boolean) => void;
		title: string;
		message: string;
		alertColor?: 'blue' | 'yellow' | 'red';
		showClaveSelect?: boolean;
		claveOptions?: ClaveOption[];
		selectedClave?: string;
		onClaveChange?: (value: string) => void;
		onConfirm: () => void;
		onCancel?: () => void;
		isSubmitting?: boolean;
	}

	let {
		open = $bindable(false),
		onOpenChange,
		title,
		message,
		alertColor = 'blue',
		showClaveSelect = false,
		claveOptions = [],
		selectedClave = $bindable('0'),
		onClaveChange,
		onConfirm,
		onCancel,
		isSubmitting = false
	}: Props = $props();

	const colorClasses = {
		blue: {
			bg: 'bg-blue-50',
			border: 'border-blue-200',
			text: 'text-blue-900',
			icon: 'text-blue-600'
		},
		yellow: {
			bg: 'bg-yellow-50',
			border: 'border-yellow-200',
			text: 'text-yellow-900',
			icon: 'text-yellow-600'
		},
		red: {
			bg: 'bg-red-50',
			border: 'border-red-200',
			text: 'text-red-900',
			icon: 'text-red-600'
		}
	};

	const colors = colorClasses[alertColor];

	function handleOpenChange(newOpen: boolean) {
		if (onOpenChange) {
			onOpenChange(newOpen);
		}
	}

	function handleConfirm() {
		onConfirm();
	}

	function handleCancel() {
		if (onCancel) {
			onCancel();
		} else if (onOpenChange) {
			onOpenChange(false);
		}
	}
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Portal>
		<Dialog.Overlay
			class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50"
		/>
		<Dialog.Content
			class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-50 mx-4 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-lg border border-slate-200 bg-white p-6 shadow-lg duration-200 sm:rounded-lg"
		>
			<!-- Header con ícono -->
			<div class="mb-4 flex items-start gap-3">
				<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full {colors.bg}">
					{#if alertColor === 'blue'}
						<svg
							class="h-5 w-5 {colors.icon}"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					{:else if alertColor === 'yellow'}
						<svg
							class="h-5 w-5 {colors.icon}"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
							/>
						</svg>
					{:else}
						<svg
							class="h-5 w-5 {colors.icon}"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					{/if}
				</div>
				<div class="flex-1">
					<Dialog.Title class="text-lg font-semibold text-slate-900">
						{title}
					</Dialog.Title>
				</div>
			</div>

			<!-- Mensaje -->
			<Dialog.Description class="mb-4 text-sm whitespace-pre-wrap text-slate-600">
				{message}
			</Dialog.Description>

			<!-- Selector de claves (opcional) -->
			{#if showClaveSelect && claveOptions.length > 0}
				<div class="mb-4">
					<label for="clave-select" class="mb-2 block text-sm font-medium text-slate-700">
						Seleccione un motivo <span class="text-red-500">*</span>
					</label>
					<select
						id="clave-select"
						bind:value={selectedClave}
						onchange={(e) => onClaveChange?.(e.currentTarget.value)}
						class="w-full rounded-lg border border-slate-300 px-3 py-2.5 shadow-sm transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none"
					>
						{#each claveOptions as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>
			{/if}

			<!-- Botones -->
			<div class="flex justify-end gap-3">
				<Button variant="ghost" onclick={handleCancel} disabled={isSubmitting}>Cancelar</Button>
				<Button variant="primary" onclick={handleConfirm} disabled={isSubmitting}>
					{isSubmitting ? 'Procesando...' : 'Confirmar'}
				</Button>
			</div>

			<!-- Botón de cerrar -->
			<Dialog.Close
				class="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-slate-100 data-[state=open]:text-slate-500"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
				<span class="sr-only">Close</span>
			</Dialog.Close>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
