<script lang="ts">
	export let suggestions: {
		name: string;
		description?: string;
	}[];
	export let selectedSuggestion: string | undefined;
</script>

<div class="suggestion-host">
	<div class="suggestions">
		{#each suggestions as suggestion (suggestion.name)}
			<div class:selected={suggestion.name === selectedSuggestion}>
				{suggestion.name}
				{#if suggestion.description}
					<span class="description">{suggestion.description}</span>
				{/if}
			</div>
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
		text-align: left;
		overflow-x: hidden;
		overflow-y: auto;
		white-space: nowrap;
		max-height: 6em;
		max-width: 20em;
		z-index: 1;
		box-shadow: rgba(0, 0, 0, 0.5) 0 2px 10px;
		border-radius: 5px;
	}

	.suggestions > div {
		padding: 2px 5px;
	}
	.suggestions > div.selected {
		background: #cdd;
		color: #122;
	}

	.suggestions .description {
		font-style: italic;
		font-size: 0.8em;
		opacity: 0.8;
	}
</style>
