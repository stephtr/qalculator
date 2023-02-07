<script lang="ts">
	export let suggestions: {
		name: string;
		description?: string;
	}[];
	export let selectedSuggestion: string | undefined;
	export let acceptSuggestion: (suggestion: string) => void;

	function hasSubscript(name: string) {
		return name.includes('_') && name.indexOf('_') > name.length - 5;
	}
</script>

<div class="suggestion-host">
	<div class="suggestions">
		{#each suggestions as suggestion (suggestion.name)}
			<button
				class="suggestion"
				class:selected={suggestion.name === selectedSuggestion}
				on:mousedown={() => acceptSuggestion(suggestion.name)}
			>
				{#if hasSubscript(suggestion.name)}
					{suggestion.name.split('_')[0]}<sub
						>{suggestion.name.split('_')[1]}</sub
					>
				{:else}
					{suggestion.name}
				{/if}

				{#if suggestion.description}
					<span class="description">{suggestion.description}</span>
				{/if}
			</button>
		{/each}
	</div>
</div>

<style>
	.suggestion-host {
		position: relative;
		margin: 0 25px;
		display: flex;
		justify-content: center;
	}

	.suggestions {
		position: absolute;
		background: #344;
		overflow-x: hidden;
		overflow-y: auto;
		white-space: nowrap;
		max-height: 6em;
		max-width: 20em;
		max-width: min(20em, 90vw);
		z-index: 1;
		box-shadow: rgba(0, 0, 0, 0.5) 0 2px 10px;
		border-radius: 5px;
	}

	.suggestion {
		display: block;
		border: none;
		background: transparent;
		padding: 2px 5px;
		width: 100%;
		text-align: left;
		color: inherit;
	}
	.suggestion.selected,
	.suggestion:hover {
		background: #cdd;
		color: #122;
	}

	.description {
		font-style: italic;
		font-size: 0.8em;
		opacity: 0.8;
	}

	@media (pointer: coarse) {
		.suggestions {
			max-height: 7em;
		}
		.suggestion {
			padding: 12px 5px;
		}
	}
</style>
