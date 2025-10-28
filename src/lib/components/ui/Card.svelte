<script lang="ts">
	import type { Snippet } from 'svelte';

	interface CardProps {
		variant?: 'default' | 'bordered' | 'elevated';
		padding?: 'none' | 'sm' | 'md' | 'lg';
		class?: string;
		children?: Snippet;
	}

	let {
		variant = 'default',
		padding = 'md',
		class: className = '',
		children
	}: CardProps = $props();

	const baseClasses = 'rounded-lg bg-white';

	const variantClasses = {
		default: 'border border-slate-200 shadow-sm',
		bordered: 'border border-slate-300',
		elevated: 'shadow-lg border border-slate-100'
	};

	const paddingClasses = {
		none: '',
		sm: 'p-4',
		md: 'p-6',
		lg: 'p-8'
	};

	const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`;
</script>

<div class={combinedClasses}>
	{@render children?.()}
</div>
