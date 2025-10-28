<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth';
	import { Button, Card, FormField } from '$lib/components/ui';

	let usuario = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleLogin(event: SubmitEvent) {
		event.preventDefault();
		error = '';
		try {
			loading = true;
			await auth.login(usuario, password);
			goto('/');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error al iniciar sesión';
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-slate-50 px-4">
	<div class="w-full max-w-md">
		<!-- Logo/Brand Header -->
		<div class="mb-8 text-center">
			<div
				class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-600 shadow-lg"
			>
				<svg class="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
					/>
				</svg>
			</div>
			<h1 class="text-3xl font-bold text-slate-900">Enerlova</h1>
			<p class="mt-2 text-sm text-slate-600">Monitor de Lecturas</p>
		</div>

		<!-- Login Card -->
		<Card variant="elevated" padding="lg">
			<h2 class="mb-6 text-center text-xl font-semibold text-slate-900">Iniciar Sesión</h2>

			<form onsubmit={handleLogin} class="space-y-4">
				<FormField label="Usuario" htmlFor="usuario" required={true}>
					<input
						type="text"
						id="usuario"
						bind:value={usuario}
						class="w-full rounded-lg border border-slate-300 px-3 py-2.5 shadow-sm transition-colors placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none"
						placeholder="Ingrese su usuario"
						required
						autocomplete="username"
					/>
				</FormField>

				<FormField label="Contraseña" htmlFor="password" required={true}>
					<input
						type="password"
						id="password"
						bind:value={password}
						class="w-full rounded-lg border border-slate-300 px-3 py-2.5 shadow-sm transition-colors placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none"
						placeholder="Ingrese su contraseña"
						required
						autocomplete="current-password"
					/>
				</FormField>

				{#if error}
					<div class="rounded-lg border border-red-200 bg-red-50 p-3">
						<p class="text-sm font-medium text-red-800">{error}</p>
					</div>
				{/if}

				<Button type="submit" variant="primary" size="lg" disabled={loading} class="w-full">
					{loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
				</Button>
			</form>
		</Card>

		<!-- Footer -->
		<p class="mt-6 text-center text-xs text-slate-500">Sistema de monitoreo de lecturas v1.0</p>
	</div>
</div>
