<script lang="ts">
	import type { Snippet } from 'svelte';

	interface FormFieldProps {
		label: string;
		htmlFor?: string;
		required?: boolean;
		helper?: string;
		error?: string;
		class?: string;
		children?: Snippet;
	}

	let {
		label,
		htmlFor,
		required = false,
		helper = '',
		error = '',
		class: className = '',
		children
	}: FormFieldProps = $props();
</script>

<div class="flex flex-col gap-2 {className}">
	<label for={htmlFor} class="text-sm font-medium text-slate-700">
		{label}
		{#if required}
			<span class="text-red-500">*</span>
		{/if}
		{#if helper}
			<span class="ml-1 text-xs font-normal text-slate-500">({helper})</span>
		{/if}
	</label>
	{@render children?.()}
	{#if error}
		<p class="text-xs text-red-600">{error}</p>
	{/if}
</div>
