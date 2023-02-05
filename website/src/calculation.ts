import { delay, wasmVectorToArray } from './tools';

type Severity = 'error' | 'warning' | 'info';

export interface Calculation {
	id: string;
	input: string;
	rawInput: string;
	output: string;
	messages: string[];
	severity?: Severity;
}

function parseCalculation(messagesString: string): {
	messages: string[];
	severity?: Severity;
} {
	const messages = messagesString.split('\n');
	const severity = messages.find((m) => m.startsWith('Error'))
		? 'error'
		: messages.find((m) => m.startsWith('Warning'))
		? 'warning'
		: messages.length > 0
		? 'info'
		: null;
	return {
		messages: messages.map((m) => m.replace(/^(Error|Warning|Info): /, '')),
		severity,
	};
}

export function isCalculatorLoaded(cb: () => void): boolean {
	const isBrowser = typeof window !== 'undefined';
	const hasLoaded = isBrowser && !!window.Module?.calculate;
	if (isBrowser && !hasLoaded) {
		const onLoaded = async () => {
			while (!Module.calculate) {
				// eslint-disable-next-line no-await-in-loop
				await delay(250);
			}
			cb();
		};
		if (window.Module) {
			(window as any).Module.preRun = onLoaded;
		} else {
			(window as any).Module = {
				preRun: onLoaded,
			};
		}
	}
	return hasLoaded;
}

export const CalculationHistory = {
	load: () => {
		let savedHistory: string = null;
		if (typeof window !== 'undefined') {
			savedHistory = window.localStorage?.getItem('qalculator-history');
		}
		return savedHistory
			? JSON.parse(savedHistory)
			: CalculationHistory.reset();
	},

	save: (calculations: Calculation[]) => {
		if (typeof window === 'undefined') return;
		window.localStorage?.setItem(
			'qalculator-history',
			JSON.stringify(calculations),
		);
	},

	reset: () => {
		CalculationHistory.save(tutorialCalculations);
		return [...tutorialCalculations];
	},

	hasEntries: (calculations: Calculation[]) => {
		return calculations.find((c) => !c.id.startsWith('tut'));
	},
};

export function calculate(
	textInput: string,
	timeoutMs: number = 500,
): Calculation {
	const calculation = Module.calculate(textInput, timeoutMs);
	let { messages, severity } = parseCalculation(calculation.messages);
	let { input, output } = calculation;
	if (output === 'timed out') {
		messages = ['Calculation timed out'];
		severity = 'error';
		output = '';
	}
	calculation.delete();
	return {
		id: Math.random().toString(),
		input,
		rawInput: textInput,
		output,
		messages,
		severity,
	};
}

const tutorialCalculations: Calculation[] = [
	{
		id: 'tut3',
		input: 'sqrt(<span style="color:#FFFFAA">pi</span>^<span style="color:#AAFFFF">2</span>)',
		rawInput: 'sqrt(pi^2)',
		output: '<span style="color:#FFFFAA">π</span> ≈ <span style="color:#AAFFFF">3,1415927</span>',
		messages: [],
		severity: null,
	},
	{
		id: 'tut2',
		input: '<span style="color:#AAFFFF">1</span> <span style="color:#BBFFBB">kg</span> + <span style="color:#AAFFFF">1</span> <span style="color:#BBFFBB">g</span>',
		rawInput: '1kg + 1g',
		output: '<span style="color:#AAFFFF">1,001</span> <span style="color:#BBFFBB">kg</span>',
		messages: [],
		severity: null,
	},
	{
		id: 'tut1',
		input: '<span style="color:#AAFFFF">1</span> + <span style="color:#AAFFFF">1</span>',
		rawInput: '1 + 1',
		output: '<span style="color:#AAFFFF">2</span>',
		messages: [],
		severity: null,
	},
];

function initCalculator() {
	const M = Module as any;
	if (M.getVariables) {
		M.variables = wasmVectorToArray(M.getVariables()).map((v) => ({
			name: v.name,
			description: v.description,
			aliases: v.aliases.split('\t'),
		}));
	}
}
if (isCalculatorLoaded(initCalculator)) {
	initCalculator();
}
