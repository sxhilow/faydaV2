import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { SplitText } from "gsap/SplitText";
import { initMarquee } from "@animations/marquee";
import { initPills } from "@animations/pill";
import { initSweep } from "@animations/sweep";
import { initWhyUs } from "@animations/whyus";
import { initRecentProjects } from "@animations/recentProjects";

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
const navBg = header?.querySelector<HTMLElement>(".absolute.inset-0.z-10");
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
	if (menuToggle.checked && header) gsap.set(header, { y: 0 });
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
	initRecentProjects();

	if (header && navBg && heroSection) {
		let onHero = true;
		let navHidden = false;
		let isTransitioning = false;

		new IntersectionObserver(
			(entries) => {
				const wasOnHero = onHero;
				onHero = entries[0].isIntersecting;
				navBg.classList.toggle("bg-grey-2", !onHero);

				// Smoothly hide the navbar when scrolling up into the hero section
				if (onHero && !wasOnHero && !navHidden) {
					isTransitioning = true;
					gsap.to(header, {
						y: "-100%",
						opacity: 0,
						duration: 0.4,
						ease: "power2.inOut",
						onComplete: () => {
							isTransitioning = false;
							navHidden = true;
							gsap.set(header, { opacity: 1 });
						},
					});
				}
			},
			{ threshold: 0 },
		).observe(heroSection);

		// While the hero is in view, the navbar scrolls with the page
		// instead of staying pinned to the top of the viewport.
		gsap.ticker.add(() => {
			if (!onHero || menuToggle?.checked || isTransitioning) return;
			gsap.set(header, { y: -smoother.scrollTop() });
			navHidden = true;
		});

		ScrollTrigger.create({
			start: "top top",
			end: 99999,
			onUpdate: (self) => {
				if (onHero || menuToggle?.checked) return;

				if (self.direction === 1 && !navHidden) {
					gsap.to(header, { y: "-100%", duration: 0.5, ease: "power2.inOut" });
					navHidden = true;
				} else if (self.direction === -1 && navHidden) {
					// Ensure it slides down from just above the viewport, not from a huge negative position
					gsap.set(header, { y: "-100%" });
					gsap.to(header, { y: 0, duration: 0.5, ease: "power2.inOut" });
					navHidden = false;
				}
			},
		});
	}
}
