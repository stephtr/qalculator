const lastWordSelector = /\p{L}[\p{L}_\d]*$/u;

export interface Suggestion {
	name: string;
	description: string;
}

export interface MatchedSuggestion extends Suggestion {
	matchIdenticalCasing: boolean;
	match: boolean;
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
			matchIdenticalCasing: v.aliases.some((a) => a === lastWord),
			match: v.aliases.some(
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
				(+b.matchIdenticalCasing - +a.matchIdenticalCasing) * 2 +
				(+b.match - +a.match),
		);
}
