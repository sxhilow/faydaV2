import { gsap } from "gsap";

const CARD_PIN_DISTANCE = 2000;
const RIGHT_FILL_FRACTION = 0.15;

export function initProcess(): void {
	const cardsEl = document.querySelector<HTMLElement>("[data-process-cards]");
	const grid = cardsEl?.querySelector<HTMLElement>("[data-process-grid]");

	if (!cardsEl || !grid) return;

	const borderFills = Array.from(
		document.querySelectorAll<HTMLElement>("[data-border-fill]"),
	);

	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
		borderFills.forEach((overlay) => {
			overlay.style.clipPath = "none";
		});
		return;
	}

	if (!borderFills.length) return;

	const tl = gsap.timeline({
		scrollTrigger: {
			trigger: grid,
			start: "top 100px",
			end: `+=${CARD_PIN_DISTANCE}`,
			pin: cardsEl,
			scrub: 1,
			anticipatePin: 1,
		},
	});

	const cardCount = borderFills.length;
	const cardFraction = (1 - RIGHT_FILL_FRACTION) / cardCount;

	borderFills.forEach((fill, i) => {
		const cardStart = i * cardFraction;
		const half = cardFraction / 2;

		tl.to(
			fill,
			{
				clipPath: "polygon(0 0, 100% 0, 100% 0, 0 100%, 0 100%)",
				ease: "none",
				duration: half,
			},
			cardStart,
		);

		tl.to(
			fill,
			{
				clipPath: "polygon(0 0, 100% 0, 100% 100%, 100% 100%, 0 100%)",
				ease: "none",
				duration: half,
			},
			cardStart + half,
		);
	});
}
