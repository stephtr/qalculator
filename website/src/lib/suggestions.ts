// \p{L} matches any (unicode) letter
// constants start with a letter, followed by some other letters, numbers or underscores
const lastWordSelector = /\p{L}[\p{L}_\d]*$/u;

export interface Suggestion {
	name: string;
	description: string;
}

export interface MatchedSuggestion extends Suggestion {
	/** whether the suggestion matches exactly, with identical casing */
	matchIdenticalCasing: boolean;
	/** whether the suggestion matches exactly, with casing ignored */
	match: boolean;
	/** whether the suggestion matches partially */
	partialMatch: boolean;
}

/** returns the last word of the input.
 * For example: `2pi` returns `pi`, `c*planck` returns `planck` */
export function getLastWord(input: string) {
	return lastWordSelector.exec(input)?.[0];
}

/** returns suggestions for  */
export function generateSuggestions(input: string): MatchedSuggestion[] {
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
				// in contrast to libqalculate, let's also add
				// the possibility to enter planck's constant via the letter `h`
				(v.name === 'ℎ' && lastWordLowerCase === 'h'),
			...v,
		}))
		.filter((v) => v.partialMatch)
		.sort(
			// sort first by matches with identical casing, then by matches ignoring casing
			(a, b) =>
				(+b.matchIdenticalCasing - +a.matchIdenticalCasing) * 2 +
				(+b.match - +a.match),
		);
}
