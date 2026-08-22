import { gsap } from "gsap";

export function initWorkLoadMore(): void {
	const list = document.querySelector<HTMLElement>("[data-project-list]");
	const wrap = document.querySelector<HTMLElement>("[data-load-more-wrap]");
	const button = document.querySelector<HTMLAnchorElement>("[data-load-more]");

	if (!list || !wrap || !button) return;

	const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	button.addEventListener("click", (e) => {
		e.preventDefault();

		const hiddenCards = Array.from(
			list.querySelectorAll<HTMLElement>("[data-project-card][hidden]"),
		);
		if (hiddenCards.length === 0) return;

		const batch = Number(button.dataset.batch) || 3;
		const revealed = hiddenCards.slice(0, batch);

		revealed.forEach((card) => card.removeAttribute("hidden"));

		if (!reduceMotion) {
			gsap.from(revealed, {
				opacity: 0,
				y: 40,
				duration: 0.6,
				ease: "power3.out",
				clearProps: "all",
			});
		}

		if (hiddenCards.length <= batch) {
			wrap.setAttribute("hidden", "");
		}
	});
}
