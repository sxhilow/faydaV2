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

    // this flag to completely disable recoil during the crossfade
    let isRecoilDisabled = false;

    const getStartInset = () => `inset(0px 0px ${cta.offsetHeight}px 0px round 0px)`;
    const getOpenInset = () => `inset(0px 0px 0px 0px round 0px)`;
    const getBallInset = () => {
        const h = cta.offsetHeight;
        const w = cta.offsetWidth;
        const radius = 10;
        const insetY = h / 2 - radius;
        const insetX = w / 2 - radius;
        return `inset(${insetY}px ${insetX}px ${insetY}px ${insetX}px round ${radius}px)`;
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

            // when entering CTA section instantly kill of recoil
            onEnter: () => {
                isRecoilDisabled = true;
                if (badgeInner) { gsap.killTweensOf(badgeInner, "y"); gsap.set(badgeInner, { y: 0 }); }
            },
            onEnterBack: () => {
                isRecoilDisabled = true;
                if (badgeInner) { gsap.killTweensOf(badgeInner, "y"); gsap.set(badgeInner, { y: 0 }); }
            },
            // Re-enable the recoil ONLY when the pinning is fully complete
            onLeave: () => { isRecoilDisabled = false; },
            onLeaveBack: () => { isRecoilDisabled = false; }
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

    // The SVG Fades in here — Because we locked it to y: 0 above, this will perfectly align!
    ctaTimeline.to(badge, { opacity: 1, duration: contentFadeDuration, ease: "none" }, `collapse+=${contentFadeStart}`);

    if (ctaLine) {
        ctaTimeline.to(ctaLine, { scaleY: 1, duration: contentFadeDuration, ease: "power2.out" }, `collapse+=${contentFadeStart}`);
    }

    ctaTimeline.set(cta, { opacity: 0 });
    ctaTimeline.to({}, { duration: bufferDistance });

    gsap.to(badge, {
        y: window.innerHeight * 0.4,
        ease: "none",
        scrollTrigger: {
            trigger: footer,
            start: "top bottom",
            end: `+=${BADGE_FOLLOW_DISTANCE}`,
            scrub: 1.5,
        },
    });

    // Rotate the internal SVG, strictly preventing horizontal drifting bugs
    const badgeSvg = badgeInner ? badgeInner.querySelector("svg") : null;
    if (badgeSvg) {
        gsap.to(badgeSvg, {
            rotation: 180,
            ease: "none",
            scrollTrigger: {
                trigger: footer,
                start: "top bottom",
                end: `+=${BADGE_FOLLOW_DISTANCE}`,
                scrub: 1.5,
            },
        });
    }

    // "Ease Out" Recoil effect
    if (badgeInner) {
        ScrollTrigger.create({
            start: 0,
            end: "max",
            onUpdate: (self) => {
                // ABORT: If the CTA timeline is active, skip all recoil math.
                if (isRecoilDisabled) return;

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
            // prevent conflicting with the lock when scrolling stops
            if (isRecoilDisabled) return;

            gsap.to(badgeInner, {
                y: 0,
                duration: 0.7,
                ease: "power3.out",
                overwrite: "auto"
            });
        });
    }
}