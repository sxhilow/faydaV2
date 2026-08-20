// CTA Transition
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const CTA_REVEAL_DISTANCE = 500;
const CTA_HOLD_DISTANCE = 250;
const CTA_COLLAPSE_DISTANCE = 900;
const BADGE_FOLLOW_DISTANCE = 1200;

export function initCtaTransition(): void {
    const cta = document.querySelector<HTMLElement>("[data-cta]");
    const content = document.querySelector<HTMLElement>("[data-cta-content]");
    const badge = document.querySelector<HTMLElement>("[data-floating-badge]");
    const badgeInner = document.querySelector<HTMLElement>("[data-badge-inner]");
    const footer = document.querySelector<HTMLElement>("footer");
    const ctaLine = document.querySelector<HTMLElement>("[data-cta-line]");

    if (!cta || !badge || !content || !footer) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(cta, { clipPath: "none" });
        gsap.set(badge, { opacity: 0 });
        return;
    }

    const getStartInset = () => `inset(0px 0px ${cta.offsetHeight}px 0px round 0px)`;
    const getOpenInset = () => `inset(0px 0px 0px 0px round 0px)`;
    const getBallInset = () => {
        const h = cta.offsetHeight;
        const w = cta.offsetWidth;
        const radius = 10; // 20px diameter circle

        // Force vertical center to align exactly with 50vh (where fixed badge lives)
        const centerY = window.innerHeight / 2;
        const insetTop = centerY - radius;
        const insetBottom = h - (centerY + radius);
        const insetX = w / 2 - radius;

        return `inset(${insetTop}px ${insetX}px ${insetBottom}px ${insetX}px round ${radius}px)`;
    };

    gsap.set(cta, { clipPath: getStartInset(), opacity: 1 });
    gsap.set(badge, { opacity: 0, xPercent: -50, yPercent: -50, x: 0, y: 0 });

    const ctaTimeline = gsap.timeline({
        scrollTrigger: {
            trigger: cta,
            start: "top top",
            end: `+=${CTA_REVEAL_DISTANCE + CTA_HOLD_DISTANCE + CTA_COLLAPSE_DISTANCE}`,
            pin: true,
            scrub: 1.5,
            anticipatePin: 1,
            invalidateOnRefresh: true,

            // UPDATE 2: Use an HTML attribute so the lock can be read globally
            onEnter: () => {
                badge.setAttribute("data-recoil-locked", "true");
                if (badgeInner) { gsap.killTweensOf(badgeInner, "y"); gsap.set(badgeInner, { y: 0 }); }
            },
            onEnterBack: () => {
                badge.setAttribute("data-recoil-locked", "true");
                if (badgeInner) { gsap.killTweensOf(badgeInner, "y"); gsap.set(badgeInner, { y: 0 }); }
            },
            onLeave: () => { badge.removeAttribute("data-recoil-locked"); },
            onLeaveBack: () => { badge.removeAttribute("data-recoil-locked"); }
        },
    });

    ctaTimeline.to(cta, { clipPath: () => getOpenInset(), duration: CTA_REVEAL_DISTANCE, ease: "none" });
    ctaTimeline.to({}, { duration: CTA_HOLD_DISTANCE });

    const bufferDistance = 150;
    const collapseDuration = CTA_COLLAPSE_DISTANCE - bufferDistance;

    ctaTimeline.addLabel("collapse");
    ctaTimeline.to(cta, { clipPath: () => getBallInset(), duration: collapseDuration, ease: "power2.inOut" }, "collapse");

    const contentFadeDuration = collapseDuration * 0.3;
    const contentFadeStart = collapseDuration - contentFadeDuration;

    ctaTimeline.to(content, { opacity: 0, duration: contentFadeDuration, ease: "power2.out" }, `collapse+=${contentFadeStart}`);
    ctaTimeline.to(badge, { opacity: 1, duration: contentFadeDuration, ease: "none" }, `collapse+=${contentFadeStart}`);

    if (ctaLine) {
        ctaTimeline.to(ctaLine, { scaleY: 1, duration: contentFadeDuration, ease: "power2.out" }, `collapse+=${contentFadeStart}`);
    }

    ctaTimeline.set(cta, { opacity: 0 });
    ctaTimeline.to({}, { duration: bufferDistance });

    // "Ease Out" Recoil effect
    if (badgeInner) {
        ScrollTrigger.create({
            start: 0,
            end: "max",
            onUpdate: (self) => {
                // UPDATE 3: Check for the global lock attribute
                if (badge.hasAttribute("data-recoil-locked")) return;

                let scrollVel = self.getVelocity();
                if (Math.abs(scrollVel) < 10) return;

                let yOffset = -(scrollVel * 0.05);
                yOffset = gsap.utils.clamp(-80, 80, yOffset);

                gsap.to(badgeInner, {
                    y: yOffset,
                    duration: 0.8,
                    ease: "power3.out",
                    overwrite: "auto"
                });
            }
        });

        ScrollTrigger.addEventListener("scrollEnd", () => {
            if (badge.hasAttribute("data-recoil-locked")) return;

            gsap.to(badgeInner, {
                y: 0,
                duration: 0.7,
                ease: "power3.out",
                overwrite: "auto"
            });
        });
    }
}