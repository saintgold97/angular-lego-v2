/**
 * Smoothly scrolls to the given section id.
 * It takes into account the position of the header and scrolls
 * to the section so that the top of the section is aligned with
 * the bottom of the header.
 * @param sectionId - The id of the section to scroll to.
 */

export function scrollTo(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
        const headerOffset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;

        window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
        });
    }
}