<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth';

	let showUserMenu = $state(false);

	// Reactive auth state
	let authState = $derived($auth);

	async function handleLogout() {
		try {
			await auth.logout();
			goto('/login');
		} catch (error) {
			console.error('Logout error:', error);
		}
	}

	function toggleUserMenu() {
		showUserMenu = !showUserMenu;
	}

	function closeMenu() {
		showUserMenu = false;
	}
</script>

{#if authState.isAuthenticated}
	<header class="border-b border-slate-200 bg-white shadow-sm">
		<div class="mx-auto max-w-7xl px-4 py-4">
			<div class="flex items-center justify-between">
				<!-- Logo/Brand -->
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-600">
						<svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
							/>
						</svg>
					</div>
					<div>
						<h1 class="text-lg font-bold text-slate-900">Enerlova</h1>
						<p class="text-xs text-slate-500">Monitor de Lecturas</p>
					</div>
				</div>

				<!-- User Menu -->
				<div class="relative">
					<button
						onclick={toggleUserMenu}
						class="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:outline-none"
					>
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100">
							<span class="text-sm font-semibold text-sky-700">
								{authState.user?.usuario?.charAt(0).toUpperCase() || 'U'}
							</span>
						</div>
						<span class="hidden sm:block">{authState.user?.usuario || 'Usuario'}</span>
						<svg
							class="h-4 w-4 text-slate-400 transition-transform {showUserMenu ? 'rotate-180' : ''}"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 9l-7 7-7-7"
							/>
						</svg>
					</button>

					{#if showUserMenu}
						<div
							class="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-slate-200 bg-white shadow-lg"
						>
							<div class="border-b border-slate-200 px-4 py-3">
								<p class="text-sm font-medium text-slate-900">{authState.user?.usuario}</p>
								<p class="text-xs text-slate-500">Operador de campo</p>
							</div>
							<div class="p-2">
								<button
									onclick={handleLogout}
									class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-red-50 hover:text-red-700"
								>
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
										/>
									</svg>
									Cerrar Sesión
								</button>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</header>
{/if}

<!-- Click outside to close menu -->
{#if showUserMenu}
	<div class="fixed inset-0 z-40" onclick={closeMenu}></div>
{/if}
