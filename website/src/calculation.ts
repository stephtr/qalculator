type Severity = 'error' | 'warning' | 'info';

export interface Calculation {
	id: string;
	input: string;
	rawInput: string;
	output: string;
	messages: string[];
	severity?: Severity;
}

function parseMessages(
	messagesString: string,
): [messages: string[], severity?: Severity] {
	const messages = messagesString.split('\n');
	const severity = messages.find((m) => m.startsWith('Error'))
		? 'error'
		: messages.find((m) => m.startsWith('Warning'))
		? 'warning'
		: messages.length > 0
		? 'info'
		: null;
	return [
		messages.map((m) => m.replace(/^(Error|Warning|Info): /, '')),
		severity,
	];
}

function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isCalculatorLoaded(cb: () => void): boolean {
	const isBrowser = typeof window !== 'undefined';
	const hasLoaded = isBrowser && !!window.Module?.calculate;
	if (isBrowser && !hasLoaded) {
		const onLoaded = async () => {
			while (!Module.calculate) {
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

export const History = {
	load: () => {
		let savedHistory: string = null;
		if (typeof window !== 'undefined') {
			savedHistory = window.localStorage?.getItem('qalculator-history');
		}
		return savedHistory ? JSON.parse(savedHistory) : History.reset();
	},

	save: (calculations: Calculation[]) => {
		if (typeof window == 'undefined') return;
		window.localStorage?.setItem(
			'qalculator-history',
			JSON.stringify(calculations),
		);
	},

	reset: () => {
		History.save(tutorialCalculations);
		return [...tutorialCalculations];
	},

	isEmpty: (calculations: Calculation[]) => {
		return calculations.find((c) => !c.id.startsWith('tut'));
	},
};

export function calculate(textInput, timeoutMs = 500): Calculation {
	const calculation = Module.calculate(textInput, timeoutMs);
	const [messages, severity] = parseMessages(calculation.messages);
	const { input, output } = calculation;
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
