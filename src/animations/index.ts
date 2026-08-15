import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { initMarquee } from "@animations/marquee";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
ScrollTrigger.config({ ignoreMobileResize: true });

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

	const menuToggle = document.getElementById("menu-toggle") as HTMLInputElement | null;
	menuToggle?.addEventListener("change", () => {
		ScrollSmoother.get()?.paused(menuToggle.checked);
	});

	initMarquee();
}
