const STORAGE_KEY = "breathing-space-submissions";
const REMOVED_TEST_BREATHS = ["hjg", "asdf"];
const momentStream = document.querySelector(".moment-stream");
const momentList = document.querySelector(".moment-list");
const aboutPanel = document.querySelector(".about-panel");

const loadSubmissions = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
};

const removeTestSubmissions = () => {
  const submissions = loadSubmissions();
  const filteredSubmissions = submissions.filter((submission) => {
    const breath = (submission.breathBefore || "").trim().toLowerCase();
    const title = (submission.title || "").trim().toLowerCase();

    return !REMOVED_TEST_BREATHS.some(
      (testBreath) => breath === testBreath || title === `before ${testBreath}`
    );
  });

  if (filteredSubmissions.length !== submissions.length) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredSubmissions));
  }
};

const createSubmissionMoment = (submission, index) => {
  const number = String(16 + index).padStart(2, "0");
  const card = document.createElement("article");
  const type = document.createElement("p");
  const visual = document.createElement("div");
  const kicker = document.createElement("span");
  const title = document.createElement("h2");
  const button = document.createElement("button");
  const service = document.createElement("p");
  const momentNumber = document.createElement("p");
  const navLink = document.createElement("a");
  const promptTitle = submission.title || `Before ${submission.breathBefore}`;

  card.className = "moment-card is-submission";
  card.id = submission.id;
  card.dataset.title = promptTitle;
  card.dataset.number = number;
  card.dataset.storyLabel = submission.credit
    ? `Submitted by ${submission.credit}`
    : "Submitted breath";
  card.dataset.storyText = submission.story;

  type.className = "moment-type";
  type.textContent = submission.entryway || "Submitted Entryway";

  visual.className = "text-visual is-short";
  kicker.className = "text-kicker";
  kicker.textContent = `Take a breath before you ${submission.breathBefore}`;
  button.className = "prompt-title";
  button.type = "button";
  button.textContent = promptTitle;
  title.append(button);
  visual.append(kicker, title);

  service.className = "moment-service";
  service.textContent = `You don't have to ${submission.dontHaveTo}.`;

  momentNumber.className = "moment-number";
  momentNumber.textContent = number;

  card.append(type, visual, service, momentNumber);

  navLink.href = `#${submission.id}`;
  navLink.textContent = promptTitle;
  momentList.append(navLink);

  return card;
};

const renderSubmittedMoments = () => {
  if (!momentStream || !momentList) {
    return;
  }

  removeTestSubmissions();

  loadSubmissions().forEach((submission, index) => {
    const card = createSubmissionMoment(submission, index);
    momentStream.insertBefore(card, aboutPanel);
  });
};

renderSubmittedMoments();

const momentCards = Array.from(document.querySelectorAll(".moment-card"));
const momentLinks = Array.from(document.querySelectorAll(".moment-list a"));
const statusTitle = document.querySelector(".status-title");
const statusNumber = document.querySelector(".status-number");
const normalizeText = (value) => value.replace(/\s+/g, " ").trim();

const closeExpandedMoments = (exceptCard) => {
  momentCards.forEach((card) => {
    if (card !== exceptCard) {
      card.classList.remove("is-expanded");
      card.querySelector(".prompt-title")?.setAttribute("aria-expanded", "false");
      card.querySelector(".moment-story")?.setAttribute("aria-hidden", "true");
    }
  });
};

const attachMomentStories = () => {
  momentCards.forEach((card) => {
    const sourceStory = card.querySelector(".story-source");
    const story = {
      label: card.dataset.storyLabel,
      text: sourceStory ? normalizeText(sourceStory.textContent) : card.dataset.storyText,
    };
    const titleButton = card.querySelector(".prompt-title");
    const service = card.querySelector(".moment-service");

    if (!story?.text || !titleButton || !service) {
      return;
    }

    const detail = document.createElement("div");
    const storyPanel = document.createElement("div");
    const storyTitle = document.createElement("span");
    const storyText = document.createElement("p");
    const storyId = `${card.id}-story`;

    detail.className = "moment-detail";
    storyPanel.className = "moment-story";
    storyPanel.id = storyId;
    storyPanel.setAttribute("aria-hidden", "true");
    storyTitle.className = "moment-story-title";
    storyTitle.textContent = story.label || "Story";
    storyText.textContent = story.text;

    titleButton.setAttribute("aria-expanded", "false");
    titleButton.setAttribute("aria-controls", storyId);

    storyPanel.append(storyTitle, storyText);
    service.before(detail);
    detail.append(service, storyPanel);

    titleButton.addEventListener("click", () => {
      const shouldOpen = !card.classList.contains("is-expanded");

      closeExpandedMoments(card);
      card.classList.toggle("is-expanded", shouldOpen);
      titleButton.setAttribute("aria-expanded", String(shouldOpen));
      storyPanel.setAttribute("aria-hidden", String(!shouldOpen));

      if (shouldOpen) {
        card.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  });
};

const setActiveMoment = (moment) => {
  momentCards.forEach((card) => {
    card.classList.toggle("is-visible", card.id === moment.id);
  });

  momentLinks.forEach((link) => {
    link.classList.toggle("is-active", link.hash === `#${moment.id}`);
  });

  statusTitle.textContent = moment.dataset.title;
  statusNumber.textContent = moment.dataset.number;
};

const observer = new IntersectionObserver(
  (entries) => {
    const visibleEntry = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (visibleEntry) {
      setActiveMoment(visibleEntry.target);
    }
  },
  {
    rootMargin: "-34% 0px -34% 0px",
    threshold: [0.12, 0.24, 0.36, 0.48, 0.6],
  }
);

attachMomentStories();

momentCards.forEach((card) => observer.observe(card));

if (momentCards.length > 0) {
  setActiveMoment(momentCards[0]);
}

if (window.location.hash) {
  window.requestAnimationFrame(() => {
    const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
}
