import { gsap } from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const scrollToEl = (el: HTMLElement) => {
	const smoother = ScrollSmoother.get();
	if (smoother) {
		smoother.scrollTo(el, true);
	} else {
		el.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
	}
};

export function initAnchors(): void {
	document.addEventListener("click", (e) => {
		if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
		const link = (e.target as HTMLElement | null)?.closest?.(
			'a[href*="#"]',
		) as HTMLAnchorElement | null;
		if (!link || link.target === "_blank") return;

		let url: URL;
		try {
			url = new URL(link.href);
		} catch {
			return;
		}
		if (url.pathname !== window.location.pathname || !url.hash) return;

		const el = document.getElementById(url.hash.slice(1));
		if (!el) return;

		e.preventDefault();
		history.pushState(null, "", url.hash);
		scrollToEl(el);
	});

	window.addEventListener("load", () => {
		const hash = window.location.hash;
		if (!hash) return;
		const el = document.getElementById(hash.slice(1));
		if (!el) return;
		gsap.delayedCall(0.05, () => scrollToEl(el));
	});
}
