<script lang="ts">
	import { getContext } from 'svelte';
	import { calculatorKey, type CalculatorContext } from './calculatorHost';
	import { AngleUnit, type Settings } from './settings';
	import { setOption } from './calculatorModule';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
	import { slide } from 'svelte/transition';

	export let settings: Settings;

	const { updateCurrentResult } =
		getContext<CalculatorContext>(calculatorKey);

	function update(applySettings = true) {
		settings.save();
		if (applySettings) {
			settings.apply();
		}
		setTimeout(() => $updateCurrentResult(), 100);
	}

	let localAdditionalOptions = settings.additionalOptions;

	function updateAdditionalOptions() {
		settings.additionalOptions = localAdditionalOptions;
		localAdditionalOptions = settings
			.getCleanedAdditionalOptions()
			.map((option) => {
				const success = setOption(option);
				return `${option}${success ? '' : ' ✗'}`;
			})
			.join('\n');
		update(false);
	}
</script>

<div class="setting">
	For angles, use:<br />
	<div class="optionList">
		<label>
			<input
				type="radio"
				name="angleUnit"
				bind:group={settings.angleUnit}
				value={AngleUnit.None}
				on:change={() => update()}
			/>
			none<br />
			<span style="color:#AAFFFF">1,570</span>
			<span style="color:#BBFFBB">rad</span>
		</label>
		<label>
			<input
				type="radio"
				name="angleUnit"
				bind:group={settings.angleUnit}
				value={AngleUnit.Rad}
				on:change={() => update()}
			/>
			radians<br />
			<span style="color:#FFFFAA">π</span> ∕
			<span style="color:#AAFFFF">2</span>
		</label>
		<label>
			<input
				type="radio"
				name="angleUnit"
				bind:group={settings.angleUnit}
				value={AngleUnit.Deg}
				on:change={() => update()}
			/>
			degrees<br />
			<span style="color:#AAFFFF">90°</span>
		</label>
		<label>
			<input
				type="radio"
				name="angleUnit"
				bind:group={settings.angleUnit}
				value={AngleUnit.Grad}
				on:change={() => update()}
			/>
			gradians<br />
			<span style="color:#AAFFFF">100</span>
			<span style="color:#BBFFBB">grad</span>
		</label>
	</div>
</div>

<label>
	<input
		type="checkbox"
		bind:checked={settings.useUnits}
		on:change={() => update()}
	/>
	Use units<br />
	{#if settings.useUnits}
		<span style="color:#BBFFBB">c</span> =
		<span style="color:#AAFFFF">299 792 458</span>
		<span style="color:#BBFFBB">m ∕ s</span>
	{:else}
		<span style="color:#BBFFBB">c</span> =
		<span style="color:#AAFFFF">299 792 458</span>
	{/if}
</label>

{#if settings.useUnits}
	<label transition:slide>
		<input
			type="checkbox"
			bind:checked={settings.useUnitPrefixes}
			on:change={() => update()}
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
{/if}

<label>
	<input
		type="checkbox"
		bind:checked={settings.useDecimalPoint}
		on:change={() => update()}
	/>
	Use decimal point instead of comma<br />
	{#if settings.useDecimalPoint}
		<span style="color:#AAFFFF">34.5</span>
	{:else}
		<span style="color:#AAFFFF">34,5</span>
	{/if}
</label>

<div class="setting">
	Additional settings (one per line)
	<a
		href="https://qalculate.github.io/manual/qalc.html#SETTINGS"
		target="_blank"
		rel="noreferrer"
		title="Information"
		class="furtherInfoLink"
	>
		<FontAwesomeIcon icon={faCircleInfo} />
	</a><br />
	<textarea
		bind:value={localAdditionalOptions}
		on:blur={updateAdditionalOptions}
	/>
</div>

<label>
	<input
		type="checkbox"
		bind:checked={settings.sendUsageStatistics}
		on:change={() => settings.save()}
	/>
	Send anonymous usage statistics<br />
	<span class="damped">(We don't record your calculations)</span>
</label>

<style>
	label,
	.setting {
		display: block;
		padding: 10px 0;
	}

	.optionList {
		display: flex;
		flex-wrap: wrap;
		gap: 20px;
		row-gap: 5px;
		justify-content: center;
		margin: 5px 0 0;
	}

	.optionList label {
		padding: 0;
	}

	textarea {
		margin-top: 7px;
		width: 300px;
		height: 100px;
		max-width: 100%;
		background: #344;
		border-radius: 5px;
		padding: 5px 10px;
		font-size: 0.8em;
	}

	.furtherInfoLink {
		font-size: 0.9em;
	}

	.damped {
		font-size: 0.8em;
		opacity: 0.8;
	}
</style>
