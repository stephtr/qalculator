const lastWordSelector = /\p{L}[\p{L}_\d]*$/u;

export interface Suggestion {
	name: string;
	description: string;
}

export interface MatchedSuggestion extends Suggestion {
	match: boolean;
	matchIgnoringCase: boolean;
	partialMatch: boolean;
}

export function getLastWord(input: string) {
	return lastWordSelector.exec(input)?.[0];
}

export function generateSuggestions(input: string) {
	const lastWord = getLastWord(input);
	if (!lastWord) return [];
	const lastWordLowerCase = lastWord.toLocaleLowerCase();
	return Module.variables
		.map<MatchedSuggestion>((v) => ({
			match: v.aliases.some((a) => a === lastWord),
			matchIgnoringCase: v.aliases.some(
				(a) => a.toLocaleLowerCase() === lastWordLowerCase,
			),
			partialMatch:
				v.aliases.some((a) =>
					a.toLocaleLowerCase().startsWith(lastWordLowerCase),
				) ||
				(v.name === 'ℎ' && lastWordLowerCase === 'h'),
			...v,
		}))
		.filter((v) => v.partialMatch)
		.sort(
			(a, b) =>
				(+b.match - +a.match) * 2 +
				(+b.matchIgnoringCase - +a.matchIgnoringCase),
		);
}
