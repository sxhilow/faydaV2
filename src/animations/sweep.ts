import { gsap } from "gsap";

const STRIP_ID = "sweep-strip";
const ACTIVE_HEIGHT = 180;
const COLLAPSED_HEIGHT = 1;
const EXPAND_DURATION = 0.4;
const COLLAPSE_DURATION = 0.4;
const FOLLOW_DURATION = 2;
const IDLE_TIMEOUT = 800;
const FILL_LERP = 0.12;

interface ClipTarget {
	el: HTMLElement;
	clone: HTMLElement;
	replace?: boolean;
	text?: HTMLElement;
	blue?: HTMLElement;
}

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

	const heading = document.querySelector<HTMLElement>("[data-sweep-anchor]");
	const whyUs = document.getElementById("why-us");
	const menuLogo = document.querySelector<HTMLElement>(".menu-logo");
	const logoSahil = document.querySelector<HTMLElement>(".menu-logo-sahil");

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

	if (!clips.length) return;

	const menuToggle = document.getElementById("menu-toggle") as HTMLInputElement | null;

	let running = false;
	let revealed = false;
	let following = false;
	let rafId = 0;
	let idleTimer: number | undefined;
	let targetY = 0;
	let active = heading !== null;
	let menuOpen = false;
	let scrollFilling = false;
	let fillStartY = 0;
	let fillProgress = 0;
	let lastCursorY = window.innerHeight / 2;

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

	const loop = () => {
		rafId = 0;
		if (!running && !scrollFilling) return;

		let rectRaw = strip.getBoundingClientRect();
		let stripBox = {
			top: rectRaw.top,
			bottom: rectRaw.bottom,
			left: rectRaw.left,
			right: rectRaw.right,
			width: rectRaw.width,
			height: rectRaw.height
		};

		if (scrollFilling && whyUs) {
			const rect = whyUs.getBoundingClientRect();
			const vh = window.innerHeight;
			const sectionTop = Math.max(0, rect.top);
			const sectionBottom = Math.min(vh, rect.bottom);

			if (sectionBottom > sectionTop) {
				// Base target progress strictly on how much the section has scrolled up
				const targetProgress = Math.max(0, Math.min(1, (vh - sectionTop) / vh));
				fillProgress += (targetProgress - fillProgress) * FILL_LERP;

				const topClip = fillStartTop + (sectionTop - fillStartTop) * fillProgress;
				const bottomClip =
					(vh - fillStartBottom) +
					((vh - sectionBottom) - (vh - fillStartBottom)) * fillProgress;

				strip.style.clipPath = `inset(${topClip}px 0 ${Math.max(0, bottomClip)}px 0)`;

				const visibleTop = topClip;
				const visibleBottom = vh - Math.max(0, bottomClip);
				stripBox.top = visibleTop;
				stripBox.bottom = visibleBottom;
				stripBox.height = visibleBottom - visibleTop;
			} else {
				scrollFilling = false;
				strip.style.clipPath = "";
				strip.hidden = true;
				gsap.set(strip, { height: COLLAPSED_HEIGHT, y: lastCursorY });
				// When leaving the section, transition back to the cursor if the strip should still be active
				if (active) {
					strip.hidden = false;
					running = true;
					following = true;
					revealed = true;
					gsap.to(strip, {
						height: ACTIVE_HEIGHT,
						y: lastCursorY,
						duration: EXPAND_DURATION,
						ease: "power3.out",
						overwrite: "auto",
					});
					if (!rafId) rafId = requestAnimationFrame(loop);
				}
			}
		}

		if (running) {
			clips.forEach((c) => clipToStrip(c, stripBox as DOMRect));
		}

		rafId = requestAnimationFrame(loop);
	};

	const start = () => {
		running = true;
		if (!rafId) rafId = requestAnimationFrame(loop);
	};

	const stop = () => {
		running = false;
		if (!scrollFilling) {
			if (rafId) cancelAnimationFrame(rafId);
			rafId = 0;
		}
		resetClips();
	};

	let fillStartTop = 0;
	let fillStartBottom = 0;

	const startFill = () => {
		if (scrollFilling) return;
		scrollFilling = true;
		running = false;

		const rect = strip.getBoundingClientRect();
		const stripVisible = !strip.hidden && rect.height > 0;
		fillStartTop = stripVisible ? rect.top : lastCursorY;
		fillStartBottom = stripVisible ? rect.bottom : lastCursorY + COLLAPSED_HEIGHT;
		fillProgress = 0;

		gsap.killTweensOf(strip);
		running = false;
		resetClips();
		strip.hidden = false;

		const vh = window.innerHeight;
		strip.style.clipPath = `inset(${fillStartTop}px 0 ${Math.max(0, vh - fillStartBottom)}px 0)`;
		gsap.set(strip, { height: vh, y: 0, opacity: 1 });

		if (!rafId) rafId = requestAnimationFrame(loop);
	};

	const collapse = () => {
		if (scrollFilling) return;
		following = false;
		gsap.to(strip, {
			height: COLLAPSED_HEIGHT,
			duration: COLLAPSE_DURATION,
			ease: "power2.inOut",
			overwrite: "auto",
		});
	};

	const beginFollow = () => {
		if (scrollFilling) return;
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
		if (scrollFilling) return;
		targetY = e.clientY;

		if (!revealed) {
			revealed = true;
			gsap.set(strip, { y: targetY });
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
			strip.hidden = false;
			window.addEventListener("pointermove", onPointerMove, { passive: true });
			window.addEventListener("pointerleave", onPointerLeave);
		} else {
			window.removeEventListener("pointermove", onPointerMove);
			window.removeEventListener("pointerleave", onPointerLeave);
			revealed = false;
			following = false;
			if (!scrollFilling) {
				strip.hidden = true;
			}
			collapseStrip();
		}
	};

	window.addEventListener("pointermove", (e) => {
		lastCursorY = e.clientY;
	}, { passive: true });

	gsap.set(strip, { opacity: 1, height: COLLAPSED_HEIGHT, y: window.innerHeight / 2 });

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

	if (whyUs) {
		new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) startFill();
			},
			{ threshold: 0 },
		).observe(whyUs);
	}
}
