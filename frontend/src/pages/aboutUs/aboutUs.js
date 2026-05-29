const teamMembers = Array.from(document.querySelectorAll(".member"));
const teamArrowLeft = document.querySelector(".team-arrow-left");
const teamArrowRight = document.querySelector(".team-arrow-right");

let activeMemberIndex = 0;
let autoFlipInterval = null;

function isCarouselView() {
    return window.matchMedia("(max-width: 1030px)").matches;
}

function getPreviousIndex(index) {
    return (index - 1 + teamMembers.length) % teamMembers.length;
}

function getNextIndex(index) {
    return (index + 1) % teamMembers.length;
}

function updateCarousel() {
    if (teamMembers.length === 0) return;

    if (!isCarouselView()) {
        teamMembers.forEach((member) => {
            member.classList.remove("is-prev", "is-active", "is-next", "is-flipped");
        });
        return;
    }

    const previousIndex = getPreviousIndex(activeMemberIndex);
    const nextIndex = getNextIndex(activeMemberIndex);

    teamMembers.forEach((member, index) => {
        member.classList.remove("is-prev", "is-active", "is-next", "is-flipped");

        if (index === previousIndex) {
            member.classList.add("is-prev");
        }

        if (index === activeMemberIndex) {
            member.classList.add("is-active");
        }

        if (index === nextIndex) {
            member.classList.add("is-next");
        }
    });
}

function goToNextMember() {
    activeMemberIndex = getNextIndex(activeMemberIndex);
    updateCarousel();
    restartAutoFlip();
}

function goToPreviousMember() {
    activeMemberIndex = getPreviousIndex(activeMemberIndex);
    updateCarousel();
    restartAutoFlip();
}

function flipActiveMember() {
    if (!isCarouselView()) return;

    const activeMember = document.querySelector(".member.is-active");

    if (!activeMember) return;

    activeMember.classList.toggle("is-flipped");
}

function startAutoFlip() {
    if (!isCarouselView()) return;

    autoFlipInterval = setInterval(() => {
        flipActiveMember();
    }, 3000);
}

function stopAutoFlip() {
    if (autoFlipInterval) {
        clearInterval(autoFlipInterval);
        autoFlipInterval = null;
    }
}

function restartAutoFlip() {
    stopAutoFlip();
    startAutoFlip();
}

teamArrowRight?.addEventListener("click", goToNextMember);
teamArrowLeft?.addEventListener("click", goToPreviousMember);

window.addEventListener("resize", () => {
    updateCarousel();

    if (isCarouselView()) {
        restartAutoFlip();
    } else {
        stopAutoFlip();
    }
});

updateCarousel();
startAutoFlip();