import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { initMarquee } from "@animations/marquee";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
ScrollTrigger.config({ ignoreMobileResize: true });

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const CLOSED_STATE: Record<string, gsap.TweenVars> = {
	".menu-logo-dark": { opacity: 1 },
	".menu-logo-light": { opacity: 0 },
	".menu-label-open": { opacity: 1, y: 0 },
	".menu-label-close": { opacity: 0, y: 8 },
	".menu-icon-open": { opacity: 1, rotate: 0, scale: 1 },
	".menu-icon-close": { opacity: 0, rotate: -90, scale: 0.6 },
};

const OPEN_STATE: Record<string, gsap.TweenVars> = {
	".menu-logo-dark": { opacity: 0 },
	".menu-logo-light": { opacity: 1 },
	".menu-label-open": { opacity: 0, y: -8 },
	".menu-label-close": { opacity: 1, y: 0 },
	".menu-icon-open": { opacity: 0, rotate: 90, scale: 0.6 },
	".menu-icon-close": { opacity: 1, rotate: 0, scale: 1 },
};

const menuToggle = document.getElementById("menu-toggle") as HTMLInputElement | null;
const mobileMenu = document.getElementById("mobile-menu");

const syncMenu = (checked: boolean, duration: number) => {
	if (mobileMenu) mobileMenu.inert = !checked;

	const targets = checked ? OPEN_STATE : CLOSED_STATE;
	for (const [selector, vars] of Object.entries(targets)) {
		gsap.to(selector, { ...vars, duration });
	}
};

menuToggle?.addEventListener("change", () => {
	ScrollSmoother.get()?.paused(menuToggle.checked);
	syncMenu(menuToggle.checked, prefersReducedMotion ? 0 : 0.3);
});

syncMenu(menuToggle?.checked ?? false, 0);

if (!prefersReducedMotion) {
	const smoother = ScrollSmoother.create({
		wrapper: "#smooth-wrapper",
		content: "#smooth-content",
		smooth: 1.2,
		effects: true,
		smoothTouch: 0.1,
	});

	window.addEventListener("load", () => {
		smoother.refresh();
	});

	initMarquee();
}
