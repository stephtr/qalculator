<script lang="ts">
	import { getContext } from 'svelte';
	import { calculatorKey, type CalculatorContext } from './calculatorHost';
	import type { Settings } from './settings';

	export let settings: Settings;

	const { updateCurrentResult } =
		getContext<CalculatorContext>(calculatorKey);

	function update() {
		settings.save();
		setTimeout(() => $updateCurrentResult(), 100);
	}
</script>

<label>
	<input
		type="checkbox"
		bind:checked={settings.useUnitPrefixes}
		on:change={update}
	/>
	Use prefixes for units<br />
	{#if settings.useUnitPrefixes}
		<span style="color:#AAFFFF">10</span>
		<span style="color:#BBFFBB">kHz</span>
	{:else}
		<span style="color:#AAFFFF">10 000</span>
		<span style="color:#BBFFBB">Hz</span>
	{/if}
</label>

<style>
	label {
		display: block;
		margin: 20px 0;
	}
</style>
