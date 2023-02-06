import { type Calculation } from './calculator';

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

export class CalculationHistory {
	entries: Calculation[] = [];

	add(calculation: Calculation) {
		this.entries = [
			calculation,
			...this.entries.filter((c) => c.rawInput !== calculation.rawInput),
		];
		if (this.entries.length > 30) {
			this.entries = this.entries.slice(0, 30);
		}
		this.save();
		this.notifyChangeListeners();
	}

	private changeListeners: Array<() => void> = [];

	private notifyChangeListeners() {
		this.changeListeners.forEach((l) => l());
	}

	addChangeListener(listener: () => void) {
		this.changeListeners.push(listener);
	}

	removeChangeListener(listener: () => void) {
		this.changeListeners = this.changeListeners.filter(
			(l) => l !== listener,
		);
	}

	load() {
		let savedHistory: string | null = null;
		if (typeof window !== 'undefined') {
			savedHistory = window.localStorage?.getItem('qalculator-history');
		}
		if (savedHistory) {
			this.entries = JSON.parse(savedHistory);
		} else {
			this.clear();
		}
		this.notifyChangeListeners();
	}

	save() {
		if (typeof window === 'undefined') return;
		window.localStorage?.setItem(
			'qalculator-history',
			JSON.stringify(this.entries),
		);
	}

	clear() {
		this.entries = [...tutorialCalculations];
		this.save();
		this.notifyChangeListeners();
	}

	isEmpty() {
		return this.entries.every((c) => c.id.startsWith('tut'));
	}

	constructor() {
		this.load();
	}
}
