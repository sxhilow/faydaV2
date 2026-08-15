import { gsap } from "gsap";

const DURATION = 0.5;
const OFFSET = 3;

export function initPills(): void {
	const pills = document.querySelectorAll<HTMLElement>("[data-pill]");
	if (!pills.length) return;

	pills.forEach((pill) => {
		const left = pill.querySelector<HTMLElement>('[data-pill-side="left"]');
		const right = pill.querySelector<HTMLElement>('[data-pill-side="right"]');
		if (!left || !right) return;

		pill.addEventListener("mouseenter", () => {
			gsap.to(left, { y: -OFFSET, duration: DURATION, ease: "power2.out" });
			gsap.to(right, { y: OFFSET, duration: DURATION, ease: "power2.out" });
		});
		pill.addEventListener("mouseleave", () => {
			gsap.to(left, { y: 0, duration: DURATION, ease: "power2.out" });
			gsap.to(right, { y: 0, duration: DURATION, ease: "power2.out" });
		});
	});
}
