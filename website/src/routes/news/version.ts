const newsVersion = '2023-11-05';

let newsReadListener: Array<() => void> = [];

export function newsAvailable() {
	if (typeof window !== 'undefined') {
		const lastNews = window.localStorage?.getItem('qalculator-last-news');
		return lastNews !== newsVersion;
	}
	return false;
}

export function addNewsReadLister(listener: () => void) {
	newsReadListener.push(listener);
}

export function removeNewsReadListener(listener: () => void) {
	newsReadListener = newsReadListener.filter((l) => l !== listener);
}

export function onNewsRead() {
	if (typeof window !== 'undefined') {
		window.localStorage?.setItem('qalculator-last-news', newsVersion);
	}
	newsReadListener.forEach((listener) => listener());
}
