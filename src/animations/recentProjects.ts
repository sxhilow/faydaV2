import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const PIN_SCROLL_DISTANCE = 2000;
const PEEK = 80;
const GREY_8 = "#dadadb";

export function initRecentProjects(): void {
	const section = document.querySelector<HTMLElement>("[data-recent-projects]");
	const slideContent = section?.querySelector<HTMLElement>("[data-rp-content]");
	const heading = section?.querySelector<HTMLElement>("[data-rp-heading]");
	const cardsContainer = section?.querySelector<HTMLElement>("[data-rp-cards]");

	if (!section || !slideContent || !heading || !cardsContainer) return;

	const cards = Array.from(
		cardsContainer.querySelectorAll<HTMLElement>("[data-rp-card]"),
	);
	if (!cards.length) return;

	const cardContents = cards.map(
		(card) => card.querySelector<HTMLElement>("[data-project-content]"),
	);

	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

	// Set initial absolute positioning for stacking
	cardsContainer.style.position = "relative";

	cards.forEach((card, i) => {
		gsap.set(card, {
			position: "absolute",
			top: 0,
			left: 0,
			width: "100%",
			zIndex: i + 1,
			y: window.innerHeight,
		});
	});

	const updateLayout = () => {
		const maxCardHeight = Math.max(...cards.map((c) => c.offsetHeight));
		const containerHeight = maxCardHeight + (cards.length - 1) * PEEK;
		cardsContainer.style.height = `${containerHeight}px`;
	};

	updateLayout();
	ScrollTrigger.addEventListener("refreshInit", updateLayout);

	// Reveal: slide content up as the section approaches (non-pinned)
	gsap.fromTo(
		slideContent,
		{ y: () => window.innerHeight },
		{
			y: 0,
			ease: "power3.out",
			scrollTrigger: {
				trigger: section,
				start: "top bottom",
				end: "top top",
				scrub: 1,
			},
		},
	);

	// Pin + cascade: cards stack as user scrolls through the pinned section
	const cardFraction = 1 / cards.length;

	const tl = gsap.timeline({
		scrollTrigger: {
			trigger: section,
			start: "top top",
			end: `+=${PIN_SCROLL_DISTANCE}`,
			pin: true,
			scrub: 1,
		},
	});

	cards.forEach((card, i) => {
		const start = i * cardFraction;
		const targetY = i * PEEK;

		tl.fromTo(
			card,
			{ y: () => window.innerHeight },
			{
				y: targetY,
				ease: "power3.out",
				duration: cardFraction,
			},
			start,
		);

		const content = cardContents[i];
		if (content && i < cards.length - 1) {
			const fadeStart = (i + 1) * cardFraction;
			tl.to(
				content.querySelectorAll("h3, p, span, time, a"),
				{
					color: GREY_8,
					ease: "power3.out",
					duration: cardFraction,
				},
				fadeStart,
			);
		}
	});

}
