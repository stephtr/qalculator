<script lang="ts">
	import type { Settings } from './settings';

	export let settings: Settings;
	export let onback: () => void;
</script>

<div class="host">
	<h2>Settings</h2>

	<label>
		<input
			type="checkbox"
			bind:checked={settings.useUnitPrefixes}
			on:change={() => settings.save()}
		/>
		Use prefixes for units
	</label>

	<button class="cleanButton" on:click={onback}> &larr; Back</button>
</div>

<style>
	.host {
		padding-top: 20px;
		flex: 1;
	}

	label {
		display: block;
		margin-bottom: 10px;
	}

	.cleanButton {
		display: inline-block;
		background: none;
		font: inherit;
		color: inherit;
		border: none;
		font-size: 0.9rem;
		opacity: 0.5;
		text-decoration: underline;
		cursor: pointer;
		margin: 5px auto;
	}
</style>
