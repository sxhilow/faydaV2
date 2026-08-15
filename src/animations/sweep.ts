import { gsap } from "gsap";

const STRIP_ID = "sweep-strip";
const ACTIVE_HEIGHT = 280;
const COLLAPSED_HEIGHT = 8;
const MOVE_DURATION = 0.3;
const EXPAND_DURATION = 0.5;
const COLLAPSE_DURATION = 0.4;
const IDLE_TIMEOUT = 120;
const OVERLAP_RATIO = 0.4;

interface InvertTarget {
	el: HTMLElement;
	apply: (inverted: boolean) => void;
	inverted: boolean;
}

const invertClass =
	(darkClass: string, lightClass: string) => (el: HTMLElement, inverted: boolean) => {
		el.classList.toggle(darkClass, !inverted);
		el.classList.toggle(lightClass, inverted);
	};

export function initSweep(): void {
	const strip = document.getElementById(STRIP_ID);
	if (!strip) return;

	if (
		window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
		!window.matchMedia("(pointer: fine)").matches
	) {
		strip.hidden = true;
		return;
	}

	const heading = document.querySelector<HTMLElement>('[data-invert="heading"]');
	const cta = document.querySelector<HTMLElement>('[data-invert="cta"]');
	const logoLink = document.querySelector<HTMLElement>('a[aria-label="Fayda Studio home"]');
	const logoDark = document.querySelector<HTMLElement>(".menu-logo-dark");
	const logoLight = document.querySelector<HTMLElement>(".menu-logo-light");
	const navLinks = Array.from(
		document.querySelectorAll<HTMLElement>('nav[aria-label="Primary"] a'),
	);
	const menuLabel = document.querySelector<HTMLElement>(".menu-label-open");

	const targets: InvertTarget[] = [];

	if (heading) {
		targets.push({
			el: heading,
			apply: invertClass("text-grey-13", "text-white"),
			inverted: false,
		});
	}
	if (cta) {
		targets.push({
			el: cta,
			apply: invertClass("text-grey-1", "text-white"),
			inverted: false,
		});
	}
	if (logoLink && logoDark && logoLight) {
		targets.push({
			el: logoLink,
			apply: (inverted) => {
				gsap.to(logoDark, { opacity: inverted ? 0 : 1, duration: 0.25, overwrite: "auto" });
				gsap.to(logoLight, { opacity: inverted ? 1 : 0, duration: 0.25, overwrite: "auto" });
			},
			inverted: false,
		});
	}
	navLinks.forEach((link) => {
		targets.push({
			el: link,
			apply: invertClass("text-grey-10", "text-white"),
			inverted: false,
		});
	});
	if (menuLabel) {
		targets.push({
			el: menuLabel,
			apply: invertClass("text-grey-10", "text-white"),
			inverted: false,
		});
	}

	if (!targets.length) return;

	const hero = document.getElementById("top");
	const menuToggle = document.getElementById("menu-toggle") as HTMLInputElement | null;

	let running = false;
	let revealed = false;
	let rafId = 0;
	let idleTimer: number | undefined;
	let heroVisible = hero !== null;
	let menuOpen = false;

	const applyTarget = (target: InvertTarget, inverted: boolean) => {
		if (target.inverted === inverted) return;
		target.inverted = inverted;
		target.apply(inverted);
	};

	const resetTargets = () => targets.forEach((t) => applyTarget(t, false));

	const isOverlapped = (stripRect: DOMRect, el: HTMLElement) => {
		const rect = el.getBoundingClientRect();
		if (rect.width <= 0 || rect.height <= 0) return false;
		const overlap =
			Math.min(stripRect.bottom, rect.bottom) - Math.max(stripRect.top, rect.top);
		return overlap >= rect.height * OVERLAP_RATIO;
	};

	const loop = () => {
		rafId = 0;
		if (!running) return;
		const stripRect = strip.getBoundingClientRect();
		targets.forEach((t) => applyTarget(t, isOverlapped(stripRect, t.el)));
		rafId = requestAnimationFrame(loop);
	};

	const start = () => {
		running = true;
		if (!rafId) rafId = requestAnimationFrame(loop);
	};

	const stop = () => {
		running = false;
		if (rafId) cancelAnimationFrame(rafId);
		rafId = 0;
		resetTargets();
	};

	const hideStrip = () => {
		window.clearTimeout(idleTimer);
		gsap.to(strip, { opacity: 0, duration: 0.3, overwrite: "auto" });
		stop();
	};

	const expand = () => {
		gsap.to(strip, {
			height: ACTIVE_HEIGHT,
			duration: EXPAND_DURATION,
			ease: "power3.out",
			overwrite: "auto",
		});
	};

	const collapse = () => {
		gsap.to(strip, {
			height: COLLAPSED_HEIGHT,
			duration: COLLAPSE_DURATION,
			ease: "power2.inOut",
			overwrite: "auto",
		});
	};

	const onPointerMove = (e: PointerEvent) => {
		if (!revealed) {
			revealed = true;
			gsap.to(strip, { opacity: 1, duration: 0.3, overwrite: "auto" });
			start();
		}
		gsap.to(strip, { y: e.clientY, duration: MOVE_DURATION, ease: "power3.out", overwrite: "auto" });
		expand();
		window.clearTimeout(idleTimer);
		idleTimer = window.setTimeout(collapse, IDLE_TIMEOUT);
	};

	const onPointerLeave = () => {
		window.clearTimeout(idleTimer);
		collapse();
	};

	const sync = () => {
		const shouldRun = heroVisible && !menuOpen;
		if (shouldRun) {
			window.addEventListener("pointermove", onPointerMove, { passive: true });
			window.addEventListener("pointerleave", onPointerLeave);
		} else {
			window.removeEventListener("pointermove", onPointerMove);
			window.removeEventListener("pointerleave", onPointerLeave);
			revealed = false;
			hideStrip();
		}
	};

	gsap.set(strip, { opacity: 0 });

	if (hero) {
		new IntersectionObserver(
			(entries) => {
				heroVisible = entries[0].isIntersecting;
				sync();
			},
			{ threshold: 0 },
		).observe(hero);
	}

	menuToggle?.addEventListener("change", () => {
		menuOpen = menuToggle.checked;
		sync();
	});

	sync();
}
