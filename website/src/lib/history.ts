import type { Calculation } from './calculator';

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
	{
		id: 'tut4',
		input: '(<span style="color:#FFFFAA">planck</span> ⋅ <span style="color:#FFFFAA">c</span>) ∕ (<span style="color:#AAFFFF">1550</span> <span style="color:#BBFFBB">nm</span>) to <span style="color:#BBFFBB">eV</span>',
		rawInput: 'planck * c / 1550nm to eV',
		output: '<span style="color:#AAFFFF">0,79989805</span> <span style="color:#BBFFBB">eV</span>',
		messages: [],
		severity: null,
		isBookmarked: true,
		bookmarkName: 'Photon energy',
	},
];

export class History {
	entries: Calculation[] = [];

	add(calculation: Calculation) {
		this.entries = [
			calculation,
			...this.entries.filter(
				(c) => c.rawInput !== calculation.rawInput || c.isBookmarked,
			),
		];
		if (this.entries.length > 30) {
			const begin = this.entries.slice(0, 30);
			const end = this.entries.slice(30);
			this.entries = [...begin, ...end.filter((c) => c.isBookmarked)];
		}
		this.save();
		this.notifyChangeListeners();
	}

	delete(id: string) {
		this.entries = this.entries.filter((c) => c.id !== id);
		this.save();
		this.notifyChangeListeners();
	}

	private doWithEntry(
		id: string,
		callback: (calculation: Calculation) => void,
	) {
		const entry = this.entries.find((c) => c.id === id);
		if (entry) {
			callback(entry);
			this.save();
			this.notifyChangeListeners();
		}
	}

	bookmark(id: string, name?: string) {
		this.doWithEntry(id, (entry) => {
			entry.isBookmarked = true;
			entry.bookmarkName = name;
		});
	}

	renameBookmark(id: string, name?: string) {
		this.doWithEntry(id, (entry) => {
			entry.bookmarkName = name;
		});
	}

	removeBookmark(id: string) {
		this.doWithEntry(id, (entry) => {
			entry.isBookmarked = false;
			delete entry.bookmarkName;
		});
	}

	private changeListeners: Array<() => void> = [];

	/** adds a callback for whenever calculation history changes */
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
			this.entries = [
				...this.entries,
				...tutorialCalculations.filter(
					(cTut) => !this.entries.some((c) => c.id === cTut.id),
				),
			];
		} else {
			this.clear();
		}
		this.notifyChangeListeners();
	}

	save() {
		if (typeof window === 'undefined') return;
		window.localStorage?.setItem(
			'qalculator-history',
			JSON.stringify(
				this.entries
					.filter((e) => e.severity !== 'error')
					.map((e) => ({ ...e, severity: null, messages: [] })),
			),
		);
	}

	clear() {
		const begin = this.entries.filter(
			(c) => c.isBookmarked || c.id.startsWith('tut'),
		);
		this.entries = [
			...begin,
			...tutorialCalculations.filter(
				(cTut) => !begin.some((c) => c.id === cTut.id),
			),
		];
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
