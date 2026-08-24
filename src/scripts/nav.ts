export function initNav(): void {
    const checkbox = document.getElementById("menu-toggle") as HTMLInputElement | null;
    if (!checkbox) return;

    const setMenuState = (open: boolean) => {
        if (checkbox.checked !== open) {
            checkbox.checked = open;
            checkbox.dispatchEvent(new Event("change")); // Triggers GSAP in index.ts
        }
    };

    // Close menu when clicking mobile menu links OR the logo link (/#top)
    document.querySelectorAll("#mobile-menu a[href], a[href='/#top']").forEach((link) => {
        link.addEventListener("click", () => setMenuState(false));
    });

    // Handle label clicks: prevent default scroll jump, but toggle state manually
    document.querySelectorAll<HTMLElement>("label[for='menu-toggle']").forEach((label) => {
        label.addEventListener("click", (e) => {
            if ((e.target as Element).closest("a[href], button")) return;
            
            e.preventDefault(); 
            setMenuState(!checkbox.checked);
        });
    });

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && checkbox.checked) {
            setMenuState(false);
        }
    });
}