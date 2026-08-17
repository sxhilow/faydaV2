import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

const BLUE_50 = "#e9eeff";
const BLUE_200 = "#9bb0ff";
const SCROLL_DISTANCE = 3000;
const PILL_FRACTION = 0.05;

export function initWhyUs(): void {
	const pin = document.querySelector<HTMLElement>(".why-us-pin");
	const revealEl = document.querySelector<HTMLElement>("[data-why-us-reveal]");
	const cardsEl = document.querySelector<HTMLElement>("[data-why-us-cards]");
	const pill = document.querySelector<HTMLElement>(".why-us-pin [data-pill]");

	if (!pin || !revealEl || !cardsEl) return;

	const borderFills = Array.from(
		document.querySelectorAll<HTMLElement>("[data-border-fill]"),
	);

	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
		borderFills.forEach((overlay) => {
			overlay.style.clipPath = "none";
		});
		return;
	}

	const split = new SplitText(revealEl, { type: "words, chars" });
	const chars = split.chars;
	const charCount = chars.length;

	gsap.set(chars, { color: BLUE_200 });
	if (pill) gsap.set(pill, { opacity: 0 });

	const tl = gsap.timeline({
		scrollTrigger: {
			trigger: pin,
			start: "top top",
			end: `+=${SCROLL_DISTANCE}`,
			pin: true,
			scrub: 1,
			anticipatePin: 1
		},
	});

	if (pill) {
		tl.to(pill, { opacity: 1, duration: PILL_FRACTION, ease: "power2.out" }, 0);
	}

	chars.forEach((char, i) => {
		const position = PILL_FRACTION + ((1 - PILL_FRACTION) * i) / charCount;
		tl.set(char, { color: BLUE_50 }, position);
	});

	const CARD_PIN_DISTANCE = 2000;
	const RIGHT_FILL_FRACTION = 0.15;

	if (borderFills.length) {
		const cardsTl = gsap.timeline({
			scrollTrigger: {
				trigger: cardsEl,
				start: "center center",
				end: `+=${CARD_PIN_DISTANCE}`,
				pin: true,
				scrub: 1,
				anticipatePin: 1,
			},
		});

		const cardCount = borderFills.length;
		const cardFraction = (1 - RIGHT_FILL_FRACTION) / cardCount;

		borderFills.forEach((fill, i) => {
			const cardStart = i * cardFraction;
			const half = cardFraction / 2;

			cardsTl.to(
				fill,
				{
					clipPath: "polygon(0 0, 100% 0, 100% 0, 0 100%, 0 100%)",
					ease: "none",
					duration: half,
				},
				cardStart,
			);

			cardsTl.to(
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
}
