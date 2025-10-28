<script lang="ts">
	import type { Snippet } from 'svelte';

	interface ButtonProps {
		variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
		size?: 'sm' | 'md' | 'lg';
		disabled?: boolean;
		type?: 'button' | 'submit' | 'reset';
		onclick?: (e: MouseEvent) => void;
		class?: string;
		children?: Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		disabled = false,
		type = 'button',
		onclick,
		class: className = '',
		children
	}: ButtonProps = $props();

	const baseClasses =
		'inline-flex items-center justify-center font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-lg';

	const variantClasses = {
		primary:
			'bg-sky-600 text-white hover:bg-sky-700 active:bg-sky-800 focus:ring-sky-500 shadow-sm',
		secondary:
			'bg-slate-200 text-slate-900 hover:bg-slate-300 active:bg-slate-400 focus:ring-slate-400',
		ghost:
			'bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200 focus:ring-slate-400',
		danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-500 shadow-sm'
	};

	const sizeClasses = {
		sm: 'px-3 py-1.5 text-sm min-h-[36px]',
		md: 'px-6 py-2.5 text-sm min-h-[44px]',
		lg: 'px-8 py-3 text-base min-h-[48px]'
	};

	const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
</script>

<button {type} class={combinedClasses} {disabled} {onclick}>
	{@render children?.()}
</button>
