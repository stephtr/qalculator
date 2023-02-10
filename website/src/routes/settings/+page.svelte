<script lang="ts">
	import { getContext } from 'svelte';
	import { calculatorKey, type CalculatorContext } from '$lib/calculatorHost';
	import SettingsWidget from '$lib/settingsWidget.svelte';
	import HomeLink from '$lib/homeLink.svelte';

	const { calculator } = getContext<CalculatorContext>(calculatorKey);
</script>

<h2>Settings</h2>
<SettingsWidget settings={calculator.settings} />
<HomeLink />
