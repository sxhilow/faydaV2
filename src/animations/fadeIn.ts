import { gsap } from "gsap";

export function initFadeIn(): void {
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

	const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-fade-in-content]"));
	if (!targets.length) return;

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				observer.unobserve(entry.target);
				gsap.fromTo(
					entry.target,
					{ opacity: 0, y: 60 },
					{ opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
				);
			}
		},
		{ threshold: 0.15 },
	);

	targets.forEach((el) => {
		gsap.set(el, { opacity: 0, y: 60 });
		observer.observe(el);
	});
}
