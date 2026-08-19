import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { SplitText } from "gsap/SplitText";
import { initMarquee } from "@animations/marquee";
import { initPills } from "@animations/pill";
import { initSweep } from "@animations/sweep";
import { initWhyUs } from "@animations/whyus";
import { initFeatures } from "@animations/features";
import { initRecentProjects } from "@animations/recentProjects";
import { initCtaTransition } from "./ctaTransition";
import { initServices } from "./services";
import { initFaq } from "./faq";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);
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
const header = document.querySelector<HTMLElement>("header");
const heroSection = document.getElementById("top");

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
	initPills();
	initSweep();
	initWhyUs();
	initFeatures();
	initRecentProjects();
	initCtaTransition();
	initServices();
	initFaq();

	if (header && heroSection) {
		const secondaryNav = header.querySelector<HTMLElement>("[data-nav-secondary]");
		const desktopMq = window.matchMedia("(min-width: 1024px)");
		let onHero = true;
		let secondaryHidden = false;

		const showSecondary = () => {
			if (!secondaryNav) return;
			secondaryHidden = false;
			gsap.to(secondaryNav, {
				y: 0,
				autoAlpha: 1,
				duration: 0.5,
				ease: "power3.out",
				overwrite: "auto",
			});
		};

		const hideSecondary = () => {
			if (!secondaryNav) return;
			secondaryHidden = true;
			gsap.to(secondaryNav, {
				y: "-100%",
				autoAlpha: 0,
				duration: 0.4,
				ease: "power2.inOut",
				overwrite: "auto",
			});
		};

		if (secondaryNav) gsap.set(secondaryNav, { y: "-100%", autoAlpha: 0 });

		new IntersectionObserver(
			(entries) => {
				const wasOnHero = onHero;
				onHero = entries[0].isIntersecting;

				if (desktopMq.matches && onHero !== wasOnHero) {
					if (onHero) {
						hideSecondary();
					} else {
						showSecondary();
					}
				}
			},
			{ threshold: 0 },
		).observe(heroSection);

		// Desktop only: the secondary navbar hides on scroll down and
		// slides back in on scroll up.
		ScrollTrigger.create({
			start: "top top",
			end: 99999,
			onUpdate: (self) => {
				if (onHero || !desktopMq.matches) return;

				if (self.direction === 1 && !secondaryHidden) {
					hideSecondary();
				} else if (self.direction === -1 && secondaryHidden) {
					showSecondary();
				}
			},
		});
	}
}
