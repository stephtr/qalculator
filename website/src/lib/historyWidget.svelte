<script lang="ts">
	import { readable } from 'svelte/store';
	import { slide } from 'svelte/transition';
	import type { Calculation } from './calculator';
	import type { History } from './history';
	import LoadingIndicator from './loadingIndicator.svelte';
	import { getOS } from './tools';

	export let history: History;
	export let showLoadingIndicator: boolean;
	export let onselectcalculation: (input: string) => void;
	/** this event triggers on the onMouseDownEvent */
	export let onabouttoselect: () => void;

	// this mechanism is necessary for coupling Svelte to the events of `History`
	$: store = readable<{
		calculations: Calculation[];
		historyHasEntries: boolean;
	}>(undefined, (set) => {
		const onHistoryChanges = () =>
			set({
				calculations: history.entries,
				historyHasEntries: !history.isEmpty(),
			});
		onHistoryChanges();
		history.addChangeListener(onHistoryChanges);
		return () => history.removeChangeListener(onHistoryChanges);
	});
	$: ({ calculations, historyHasEntries } = $store);

	let appBanner: { link: string; imageUrl: string } | null = null;

	if (typeof window !== 'undefined') {
		switch (getOS()) {
			case 'win':
				if (typeof window !== 'undefined' && !(window as any).Windows) {
					appBanner = {
						link: 'ms-windows-store://pdp/?ProductId=9P4866X24PD3&mode=mini',
						imageUrl: '/badge-microsoft-store.svg',
					};
				}
				break;
			case 'android':
				appBanner = {
					link: 'https://play.google.com/store/apps/details?id=xyz.qalculator.twa',
					imageUrl: '/badge-google-play.png',
				};
				break;
			case 'ios':
				appBanner = {
					link: 'https://apps.apple.com/app/qalculator-xyz/id1611421527',
					imageUrl: '/badge-appstore.png',
				};
				break;
			default:
		}
	}
</script>

{#if showLoadingIndicator}
	<div transition:slide class="response">
		<LoadingIndicator />
	</div>
{/if}
{#each calculations as calculation (calculation.id)}
	<button
		on:mousedown={() => onabouttoselect()}
		on:click={() => onselectcalculation(calculation.rawInput)}
		transition:slide
		class="response"
	>
		<div class="input">
			{@html calculation.input}
		</div>
		<div class="output">
			{@html calculation.output}
		</div>
		{#if calculation.messages.length > 0}
			<div
				class="message"
				class:error={calculation.severity === 'error'}
				class:warning={calculation.severity === 'warning'}
				class:info={calculation.severity === 'info'}
			>
				{#each calculation.messages as message}
					<div>{message}</div>
				{/each}
			</div>
		{/if}
	</button>
{/each}
<a href="examples" class="examples response">
	See more examples &rarr;
</a>
{#if appBanner}
	<a href={appBanner.link} class="calloutApp response">
		<img src={appBanner.imageUrl} alt="Download app" />
		<span> Download the free Qalculator app </span>
	</a>
{/if}
<div>
	{#if historyHasEntries}
		<button class="cleanButton" on:mousedown={() => history.clear()}>
			Clear history
		</button>
	{/if}
</div>

<style>
	.response {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 10px;
		padding: 5px 10px;
		text-align: left;
		cursor: pointer;
		overflow: hidden;
		position: relative;
		display: block;
		width: 100%;
		border: none;
		color: inherit;
	}

	.response + .response {
		margin-top: 10px;
	}

	.message {
		margin: 10px 0 5px;
		font-size: 0.8em;
		opacity: 0.8;
		-webkit-hyphens: auto;
		hyphens: auto;
	}

	.error {
		color: lightsalmon;
	}

	.warning {
		color: orange;
	}

	.info {
		opacity: 0.8;
	}

	.output {
		margin: 20px 40px;
		font-size: 1.1em;
	}

	.calloutApp.calloutApp {
		display: flex;
		flex-direction: row;
		align-items: center;
		line-height: 1.3;
		font-size: 1.1rem;
		text-decoration: none;
	}

	.calloutApp img {
		display: block;
		margin: 0 15px 0 -5px;
		width: 120px;
	}

	.calloutApp {
		font-size: 1rem;
		opacity: 0.85;
	}

	@media (display-mode: standalone) {
		.calloutApp.calloutApp {
			display: none;
		}
	}

	.examples {
		text-decoration: none;
		text-align: center;
		padding: 10px;
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
