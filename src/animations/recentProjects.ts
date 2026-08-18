import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const PIN_SCROLL_DISTANCE = 3000;
const PEEK = 80;

const GREY_8 = "#dadadb";

export function initRecentProjects(): void {
	const section = document.querySelector<HTMLElement>("[data-recent-projects]");
	const heading = section?.querySelector<HTMLElement>("[data-rp-heading]");
	const cardsContainer = section?.querySelector<HTMLElement>("[data-rp-cards]");

	if (!section || !heading || !cardsContainer) return;

	const cards = Array.from(cardsContainer.querySelectorAll<HTMLElement>("[data-rp-card]"));
	if (!cards.length) return;

	// Collect the text content panel inside each card
	const cardContents = cards.map(
		(card) => card.querySelector<HTMLElement>("[data-project-content]"),
	);

	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

	// Set initial absolute positioning and layouts for stacking
	cardsContainer.style.position = "relative";

	cards.forEach((card, i) => {
		gsap.set(card, {
			position: "absolute",
			top: 0,
			left: 0,
			width: "100%",
			zIndex: i + 1,
			y: window.innerHeight, // Start off-screen
		});
	});

	// Function to dynamically update container height on resize / refresh
	const updateLayout = () => {
		const maxCardHeight = Math.max(...cards.map((c) => c.offsetHeight));
		const containerHeight = maxCardHeight + (cards.length - 1) * PEEK;
		cardsContainer.style.height = `${containerHeight}px`;
	};

	updateLayout();
	ScrollTrigger.addEventListener("refreshInit", updateLayout);

	const tl = gsap.timeline({
		scrollTrigger: {
			trigger: section,
			start: "top top",
			end: `+=${PIN_SCROLL_DISTANCE}`,
			pin: true,
			scrub: 1,
			anticipatePin: 1,
		},
	});

	// Cascade cards
	const cardFraction = 1 / cards.length;

	cards.forEach((card, i) => {
		const start = i * cardFraction;
		const targetY = i * PEEK;

		// Slide card up into its stacked position
		tl.fromTo(
			card,
			{ y: () => window.innerHeight },
			{
				y: targetY,
				ease: "none",
				duration: cardFraction,
			},
			start,
		);

		// When the NEXT card starts sliding in, fade this card's text to grey
		const content = cardContents[i];
		if (content && i < cards.length - 1) {
			const fadeStart = (i + 1) * cardFraction;
			const fadeDuration = cardFraction; // fade over first 40% of next card's entry
			tl.to(
				content.querySelectorAll("h3, p, span, time, a"),
				{
					color: GREY_8,
					ease: "none",
					duration: fadeDuration,
				},
				fadeStart,
			);
		}
	});
}
