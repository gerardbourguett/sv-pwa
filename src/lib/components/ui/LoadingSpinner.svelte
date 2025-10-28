<script lang="ts">
	interface LoadingSpinnerProps {
		size?: 'sm' | 'md' | 'lg';
		message?: string;
		class?: string;
	}

	let { size = 'md', message = '', class: className = '' }: LoadingSpinnerProps = $props();

	const sizeClasses = {
		sm: 'h-4 w-4',
		md: 'h-8 w-8',
		lg: 'h-12 w-12'
	};

	const textSizeClasses = {
		sm: 'text-sm',
		md: 'text-base',
		lg: 'text-lg'
	};
</script>

<div class="flex flex-col items-center justify-center gap-3 {className}">
	<div
		class="animate-spin rounded-full border-4 border-slate-200 border-t-sky-600 {sizeClasses[size]}"
		role="status"
		aria-label="Loading"
	></div>
	{#if message}
		<p class="text-slate-600 {textSizeClasses[size]}">{message}</p>
	{/if}
</div>
