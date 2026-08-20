// Footer
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const FOOTER_HOLD_DISTANCE = 250;
const FOOTER_EXPAND_DISTANCE = 900;

export function initFooterTransition(): void {
    const footer = document.querySelector<HTMLElement>("#footer-section");
    const footerBg = document.querySelector<HTMLElement>("[data-footer-bg]");
    const footerContent = document.querySelector<HTMLElement>("[data-footer-content]");
    const badge = document.querySelector<HTMLElement>("[data-floating-badge]");
    const badgeInner = document.querySelector<HTMLElement>("[data-badge-inner]");

    if (!footer || !footerBg || !footerContent || !badge) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(footerBg, { clipPath: "none", opacity: 1 });
        gsap.set(footerContent, { opacity: 1, y: 0 });
        return;
    }

    const badgeVisual = badgeInner ? badgeInner.querySelector("[data-badge-visual]") : null;
    if (badgeVisual) {
        gsap.to(badgeVisual, {
            rotation: 360,
            ease: "none",
            scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 1 },
        });
    }

    // UPDATE 1: THE EARLY LOCK
    // This stops the bounce gracefully *before* the footer pins
    ScrollTrigger.create({
        trigger: footer,
        start: "top bottom", // Fires when footer enters the bottom of the viewport
        onEnter: () => {
            badge.setAttribute("data-recoil-locked", "true");
            if (badgeInner) {
                gsap.killTweensOf(badgeInner, "y");
                // Gives the ball plenty of time to settle smoothly
                gsap.to(badgeInner, { y: 0, duration: 0.6, ease: "power3.out", overwrite: "auto" }); 
            }
        },
        onLeaveBack: () => {
            badge.removeAttribute("data-recoil-locked");
        }
    });

    // UPDATE 2: DYNAMIC VIEWPORT FIX
    // Use native CSS percentages so mobile address bars don't break the alignment
    gsap.set(footerBg, {
        clipPath: "circle(10px at 50% 50%)",
        opacity: 0
    });

    gsap.set(footerContent, { opacity: 0, y: 50 });

    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: footer,
            start: "top top",
            end: `+=${FOOTER_HOLD_DISTANCE + FOOTER_EXPAND_DISTANCE}`,
            pin: true,
            scrub: 1.5,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            // Removed the lock logic from here, as the Early Lock handles it perfectly
        },
    });

    tl.to({}, { duration: FOOTER_HOLD_DISTANCE });

    tl.addLabel("expand");

    tl.set(footerBg, { opacity: 1 }, "expand");

    // UPDATE 2 (Continued): Use percentages for the expanded state too
    tl.to(footerBg, {
        clipPath: "circle(150% at 50% 50%)",
        duration: FOOTER_EXPAND_DISTANCE,
        ease: "power2.inOut"
    }, "expand");

    tl.fromTo(badge, 
        { opacity: 1 },
        { opacity: 0, duration: FOOTER_EXPAND_DISTANCE * 0.2, ease: "power2.inOut", immediateRender: false }, 
        "expand"
    );

    const contentFadeStart = FOOTER_EXPAND_DISTANCE * 0.4;
    const contentFadeDuration = FOOTER_EXPAND_DISTANCE * 0.6;

    tl.to(footerContent, {
        opacity: 1,
        y: 0,
        duration: contentFadeDuration,
        ease: "power2.out"
    }, `expand+=${contentFadeStart}`);
}