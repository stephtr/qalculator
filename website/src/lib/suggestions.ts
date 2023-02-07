const lastWordSelector = /\p{L}[\p{L}_\d]*$/u;

export interface Suggestion {
	name: string;
	description: string;
}

export interface MatchedSuggestion extends Suggestion {
	match: boolean;
	partialMatch: boolean;
}

export function getLastWord(input: string) {
	return lastWordSelector.exec(input)?.[0];
}

export function generateSuggestions(input: string) {
	const lastWord = getLastWord(input);
	if (!lastWord) return [];
	return Module.variables
		.map<MatchedSuggestion>((v) => ({
			match: v.aliases.some((a) => a === lastWord),
			partialMatch:
				v.aliases.some((a) => a.startsWith(lastWord)) ||
				(v.name === 'ℎ' && lastWord === 'h'),
			...v,
		}))
		.filter((v) => v.partialMatch)
		.sort((a, b) => +b.match - +a.match);
}
