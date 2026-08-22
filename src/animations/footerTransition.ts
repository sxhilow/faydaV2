// Footer
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const FOOTER_HOLD_DISTANCE = 250;
const FOOTER_EXPAND_DISTANCE = 900;
const FOOTER_SUBPAGE_EXPAND_DISTANCE = 450;

export function initFooterTransition(): void {
    const footer = document.querySelector<HTMLElement>("#footer-section");
    const footerBg = document.querySelector<HTMLElement>("[data-footer-bg]");
    const footerContent = document.querySelector<HTMLElement>("[data-footer-content]");
    const badge = document.querySelector<HTMLElement>("[data-floating-badge]");
    const badgeInner = document.querySelector<HTMLElement>("[data-badge-inner]");

    if (!footer || !footerBg || !footerContent || !badge) return;

    // Home runs the full ball-handoff choreography (hold + badge settle);
    // every other page gets a shortened expand with no hold and no badge logic
    const isHomeCtaFlow = Boolean(document.querySelector("[data-cta]"));
    const expandDistance = isHomeCtaFlow
        ? FOOTER_EXPAND_DISTANCE
        : FOOTER_SUBPAGE_EXPAND_DISTANCE;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(footerBg, { clipPath: "none", opacity: 1 });
        gsap.set(footerContent, { opacity: 1, y: 0 });
        return;
    }


    // UPDATE 1: THE EARLY LOCK
    // This stops the bounce gracefully *before* the footer pins
    if (isHomeCtaFlow && badgeInner) {
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
    }

    // UPDATE 2: DYNAMIC VIEWPORT FIX
    // Use native CSS percentages so mobile address bars don't break the alignment
    gsap.set(footerBg, {
        clipPath: "circle(8px at 50% 50%)",
        opacity: 0
    });

    gsap.set(footerContent, { opacity: 0, y: 50 });

    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: footer,
            start: "top top",
            end: `+=${(isHomeCtaFlow ? FOOTER_HOLD_DISTANCE : 0) + expandDistance}`,
            pin: true,
            scrub: 1.5,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            // Removed the lock logic from here, as the Early Lock handles it perfectly
        },
    });

    if (isHomeCtaFlow) {
        tl.to({}, { duration: FOOTER_HOLD_DISTANCE });
    }

    tl.addLabel("expand");

    tl.set(footerBg, { opacity: 1 }, "expand");

    // UPDATE 2 (Continued): Use percentages for the expanded state too
    tl.to(footerBg, {
        clipPath: "circle(150% at 50% 50%)",
        duration: expandDistance,
        ease: "power2.inOut"
    }, "expand");

    if (isHomeCtaFlow) {
        tl.set(badge, { opacity: 0 }, "expand");
    }

    const contentFadeStart = expandDistance * 0.4;
    const contentFadeDuration = expandDistance * 0.6;

    tl.to(footerContent, {
        opacity: 1,
        y: 0,
        duration: contentFadeDuration,
        ease: "power2.out"
    }, `expand+=${contentFadeStart}`);
}