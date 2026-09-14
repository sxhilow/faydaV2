const W_MIN = 40;
const H_MIN = 120;
const DEBOUNCE_MS = 450;

export function initViewportReload(): void {
	const W = window.innerWidth;
	const H = window.innerHeight;
	let timer: ReturnType<typeof setTimeout> | null = null;

	const maybeReload = () => {
		const dW = Math.abs(window.innerWidth - W);
		const dH = Math.abs(window.innerHeight - H);
		if (dW >= W_MIN || dH >= H_MIN) window.location.reload();
	};

	const schedule = () => {
		if (timer) clearTimeout(timer);
		timer = setTimeout(maybeReload, DEBOUNCE_MS);
	};

	window.addEventListener("resize", schedule);
	window.addEventListener("orientationchange", schedule);
}