import { gsap } from "gsap";

const STRIP_ID = "sweep-strip";
const ACTIVE_HEIGHT = 180;
const COLLAPSED_HEIGHT = 1;
const EXPAND_DURATION = 0.4;
const COLLAPSE_DURATION = 0.4;
const FOLLOW_DURATION = 2;
const IDLE_TIMEOUT = 800;
const OVERLAP_RATIO = 0.4;

interface InvertTarget {
	el: HTMLElement;
	apply: (inverted: boolean) => void;
	inverted: boolean;
}

interface ClipTarget {
	el: HTMLElement;
	clone: HTMLElement;
	replace?: boolean;
	text?: HTMLElement;
	blue?: HTMLElement;
}

interface BorderTarget {
	el: HTMLElement;
	overlay: HTMLElement;
}

const invertClass =
	(el: HTMLElement, darkClass: string, lightClass: string) => (inverted: boolean) => {
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
	const menuLogo = document.querySelector<HTMLElement>(".menu-logo");
	const logoSahil = document.querySelector<HTMLElement>(".menu-logo-sahil");

	const targets: InvertTarget[] = [];
	const clips: ClipTarget[] = [];

	document.querySelectorAll<HTMLElement>("[data-invert-clip]").forEach((el) => {
		const darkClass = el.dataset.invertDark;
		const lightClass = el.dataset.invertLight;
		if (!darkClass || !lightClass) return;

		const replace = el.dataset.invertReplace;
		const clone = el.cloneNode(true) as HTMLElement;
		clone.removeAttribute("data-invert");
		clone.removeAttribute("data-invert-clip");
		clone.removeAttribute("data-invert-dark");
		clone.removeAttribute("data-invert-light");
		clone.removeAttribute("data-invert-replace");
		clone.removeAttribute("data-pill");
		clone.querySelectorAll("[data-pill-side]").forEach((node) => {
			node.removeAttribute("data-pill-side");
		});

		const darkClasses = darkClass.split(/\s+/).filter(Boolean);
		const lightClasses = lightClass.split(/\s+/).filter(Boolean);
		const nodes = [clone, ...Array.from(clone.querySelectorAll("*"))];
		nodes.forEach((node) => {
			darkClasses.forEach((c) => node.classList.remove(c));
			lightClasses.forEach((c) => node.classList.add(c));
		});

		if (replace) {
			const label = clone.querySelector<HTMLElement>("[data-pill-label]");
			if (label) {
				label.textContent = replace;
				clone.classList.add("justify-center");
			} else {
				clone.innerHTML = replace.split("||").join("<br>");
			}
		}

		if (replace) {
			const wrapper = document.createElement("div");
			wrapper.className = "absolute inset-0 pointer-events-none";
			wrapper.setAttribute("aria-hidden", "true");

			const blue = document.createElement("div");
			blue.className = "absolute inset-0 bg-blue-500";
			blue.style.boxShadow = "0 0 0 10px #2553ff";
			blue.style.clipPath = "inset(100%)";

			clone.classList.add("absolute", "inset-0");
			clone.style.clipPath = "inset(100%)";

			wrapper.append(blue, clone);
			el.classList.add("relative");
			el.appendChild(wrapper);
			clips.push({
				el,
				clone: wrapper,
				text: clone,
				blue,
				replace: true,
			});
			return;
		}

		clone.classList.add("absolute", "inset-0", "pointer-events-none");
		clone.setAttribute("aria-hidden", "true");
		clone.style.clipPath = "inset(100%)";

		el.classList.add("relative");
		el.appendChild(clone);
		clips.push({ el, clone, replace: false });
	});

	document.querySelectorAll<HTMLElement>("[data-invert]").forEach((el) => {
		if (el.hasAttribute("data-invert-clip")) return;
		const darkClass = el.dataset.invertDark;
		const lightClass = el.dataset.invertLight;
		if (!darkClass || !lightClass) return;
		targets.push({
			el,
			apply: invertClass(el, darkClass, lightClass),
			inverted: false,
		});
	});

	if (menuLogo && logoSahil) {
		logoSahil.style.clipPath = "inset(100%)";
		logoSahil.style.opacity = "1";

		const wrapper = document.createElement("div");
		wrapper.className = "absolute inset-0 pointer-events-none";
		wrapper.setAttribute("aria-hidden", "true");

		const blue = document.createElement("div");
		blue.className = "absolute inset-0 bg-blue-500";
		blue.style.boxShadow = "0 0 0 20px #2553ff";
		blue.style.clipPath = "inset(100%)";

		wrapper.append(blue, logoSahil);
		menuLogo.appendChild(wrapper);
		clips.push({ el: menuLogo, clone: wrapper, blue, text: logoSahil, replace: true });
	}

	const borders: BorderTarget[] = [];

	document.querySelectorAll<HTMLElement>("[data-sweep-border]").forEach((el) => {
		el.classList.add("relative");
		const overlay = document.createElement("div");
		overlay.className = "absolute border border-blue-400 pointer-events-none";
		overlay.setAttribute("aria-hidden", "true");
		overlay.style.clipPath = "inset(100%)";
		const cs = getComputedStyle(el);
		overlay.style.top = `-${cs.paddingTop}`;
		overlay.style.right = `-${cs.paddingRight}`;
		overlay.style.bottom = `-${cs.paddingBottom}`;
		overlay.style.left = `-${cs.paddingLeft}`;
		el.appendChild(overlay);
		borders.push({ el, overlay });
	});

	const navBorderSweep = document.getElementById("nav-border-sweep");
	if (navBorderSweep) {
		const navHeader = navBorderSweep.closest("header");
		if (navHeader) {
			borders.push({ el: navHeader, overlay: navBorderSweep });
		}
	}

	if (!targets.length && !clips.length && !borders.length) return;

	const menuToggle = document.getElementById("menu-toggle") as HTMLInputElement | null;

	let running = false;
	let revealed = false;
	let following = false;
	let rafId = 0;
	let idleTimer: number | undefined;
	let targetY = 0;
	let active = heading !== null;
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

	const hideClip = (clip: ClipTarget) => {
		if (clip.replace) {
			if (clip.blue) clip.blue.style.clipPath = "inset(100%)";
			if (clip.text) clip.text.style.clipPath = "inset(100%)";
		} else {
			clip.clone.style.clipPath = "inset(100%)";
		}
	};

	const clipToStrip = (clip: ClipTarget, stripRect: DOMRect) => {
		const rect = clip.clone.getBoundingClientRect();
		if (rect.width <= 0 || rect.height <= 0) {
			hideClip(clip);
			return;
		}

		// Expand intersection check box to ensure we don't hide while descenders/ascenders overlap
		const top = Math.max(stripRect.top, rect.top - 40);
		const bottom = Math.min(stripRect.bottom, rect.bottom + 40);
		const left = Math.max(stripRect.left, rect.left - 40);
		const right = Math.min(stripRect.right, rect.right + 40);
		if (bottom <= top || right <= left) {
			hideClip(clip);
			return;
		}

		// Use polygon to exactly match the strip's rectangle on the screen,
		// allowing clipping outside the element's bounding box (for descenders/ascenders).
		const y1 = stripRect.top - rect.top;
		const y2 = stripRect.bottom - rect.top;
		const x1 = stripRect.left - rect.left;
		const x2 = stripRect.right - rect.left;
		const poly = `polygon(${x1}px ${y1}px, ${x2}px ${y1}px, ${x2}px ${y2}px, ${x1}px ${y2}px)`;

		if (clip.replace) {
			if (clip.blue) clip.blue.style.clipPath = poly;
			if (clip.text) clip.text.style.clipPath = poly;
		} else {
			clip.clone.style.clipPath = poly;
		}
	};

	const resetClips = () => clips.forEach(hideClip);

	const hideBorder = (border: BorderTarget) => {
		border.overlay.style.clipPath = "inset(100%)";
	};

	const clipBorder = (border: BorderTarget, stripRect: DOMRect) => {
		const rect = border.el.getBoundingClientRect();
		if (rect.width <= 0 || rect.height <= 0) {
			hideBorder(border);
			return;
		}

		const overlapTop = Math.max(stripRect.top, rect.top);
		const overlapBottom = Math.min(stripRect.bottom, rect.bottom);
		if (overlapBottom <= overlapTop) {
			hideBorder(border);
			return;
		}

		const top = overlapTop - rect.top;
		const bottom = rect.bottom - overlapBottom;
		border.overlay.style.clipPath = `inset(${top}px 0 ${bottom}px 0)`;
	};

	const resetBorders = () => borders.forEach(hideBorder);

	const loop = () => {
		rafId = 0;
		if (!running) return;
		const stripRect = strip.getBoundingClientRect();
		targets.forEach((t) => applyTarget(t, isOverlapped(stripRect, t.el)));
		clips.forEach((c) => clipToStrip(c, stripRect));
		borders.forEach((b) => clipBorder(b, stripRect));
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
		resetClips();
		resetBorders();
	};

	const collapse = () => {
		following = false;
		gsap.to(strip, {
			height: COLLAPSED_HEIGHT,
			duration: COLLAPSE_DURATION,
			ease: "power2.inOut",
			overwrite: "auto",
		});
	};

	const beginFollow = () => {
		following = true;
		gsap.to(strip, {
			height: ACTIVE_HEIGHT,
			duration: EXPAND_DURATION,
			ease: "power3.out",
			overwrite: "auto",
		});
		gsap.to(strip, {
			y: targetY,
			duration: FOLLOW_DURATION,
			ease: "power3.out",
			overwrite: "auto",
		});
	};

	const collapseStrip = () => {
		window.clearTimeout(idleTimer);
		collapse();
		stop();
	};

	const onPointerMove = (e: PointerEvent) => {
		targetY = e.clientY;

		if (!revealed) {
			revealed = true;
			gsap.to(strip, { opacity: 1, duration: 0.3, overwrite: "auto" });
			start();
		}

		if (!following) {
			beginFollow();
		} else {
			gsap.to(strip, {
				y: targetY,
				duration: FOLLOW_DURATION,
				ease: "power3.out",
				overwrite: "auto",
			});
		}

		window.clearTimeout(idleTimer);
		idleTimer = window.setTimeout(collapse, IDLE_TIMEOUT);
	};

	const onPointerLeave = () => {
		window.clearTimeout(idleTimer);
		collapse();
	};

	const sync = () => {
		const shouldRun = active && !menuOpen;
		if (shouldRun) {
			window.addEventListener("pointermove", onPointerMove, { passive: true });
			window.addEventListener("pointerleave", onPointerLeave);
		} else {
			window.removeEventListener("pointermove", onPointerMove);
			window.removeEventListener("pointerleave", onPointerLeave);
			revealed = false;
			following = false;
			hideStrip();
		}
	};

	gsap.set(strip, { opacity: 0 });

	if (heading) {
		new IntersectionObserver(
			(entries) => {
				active = entries[0].isIntersecting;
				sync();
			},
			{ threshold: 0 },
		).observe(heading);
	}

	menuToggle?.addEventListener("change", () => {
		menuOpen = menuToggle.checked;
		sync();
	});

	sync();
}
