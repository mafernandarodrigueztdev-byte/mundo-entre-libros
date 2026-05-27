const teamCarouselWindow = document.querySelector(".team-carousel-window");
const teamTrack = document.querySelector(".team-track");
const teamArrowLeft = document.querySelector(".team-arrow-left");
const teamArrowRight = document.querySelector(".team-arrow-right");

function getScrollAmount() {
    if (!teamCarouselWindow) return 0;

    const memberCard = teamCarouselWindow.querySelector(".member");
    if (!memberCard) return 0;

    const trackStyles = window.getComputedStyle(teamTrack);
    const gap = parseInt(trackStyles.gap) || 16;

    return memberCard.offsetWidth + gap;
}

function moveTeamCarousel(direction) {
    if (!teamCarouselWindow) return;

    const scrollAmount = getScrollAmount();

    const maxScrollLeft =
        teamCarouselWindow.scrollWidth - teamCarouselWindow.clientWidth;

    const currentScroll = teamCarouselWindow.scrollLeft;

    const isAtStart = currentScroll <= 5;
    const isAtEnd = currentScroll >= maxScrollLeft - 5;

    if (direction === 1 && isAtEnd) {
        teamCarouselWindow.scrollTo({
            left: 0,
            behavior: "smooth"
        });
        return;
    }

    if (direction === -1 && isAtStart) {
        teamCarouselWindow.scrollTo({
            left: maxScrollLeft,
            behavior: "smooth"
        });
        return;
    }

    teamCarouselWindow.scrollBy({
        left: direction * scrollAmount,
        behavior: "smooth"
    });
}

teamArrowLeft?.addEventListener("click", () => {
    moveTeamCarousel(-1);
});

teamArrowRight?.addEventListener("click", () => {
    moveTeamCarousel(1);
});