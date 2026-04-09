const STORAGE_KEY = "daily-habit-tracker-v4";
const TIMER_KEY = "daily-habit-tracker-timer-v1";
const NOTES_KEY = "daily-habit-tracker-notes-v1";
const ICONS = {
  Health: "💧",
  Focus: "🧠",
  Fitness: "🏋️",
  Learning: "📖",
  Home: "🏠",
  Mindset: "🪷"
};
const DEFAULT_HABITS = [
  {
    title: "Bathing",
    allocatedMinutes: 10,
    icon: "🚿",
    motivationalText: "Start clean, start sharp."
  },
  {
    title: "Exercise",
    allocatedMinutes: 60,
    icon: "🏋️",
    motivationalText: "Earn the energy you want."
  },
  {
    title: "Me Time",
    allocatedMinutes: 30,
    icon: "☕",
    motivationalText: "Protect your peace."
  },
  {
    title: "Supplements",
    allocatedMinutes: 5,
    icon: "💊",
    motivationalText: "Small inputs, big outcomes."
  }
];
const QUOTE_CATEGORIES = [
  {
    id: "discipline",
    label: "Discipline",
    quotes: [
      "Discipline looks boring until you see what it builds.",
      "You are the greatest project you will ever work on. Restart. Reset. Refocus. As many times as you have to.",
      "If you knew you were 100 rejections away from your dream, think how excited you would be every time someone told you \"no\".",
      "Hard workouts. Difficult books. Uncomfortable conversations. Taking risks. That's how you grow.",
      "6 months of discipline and focused work can change your life forever.",
      "The truth is, it's supposed to feel hard.",
      "Make a plan. And work on it. Every. Single. Day.",
      "You don't lack motivation, you lack leverage.",
      "Actions speak a lot louder than words.",
      "Do not fantasize being a loser."
    ]
  },
  {
    id: "money",
    label: "Money",
    quotes: [
      "If achieving greatness was easy everyone would do it.",
      "High expectations are key to everything.",
      "Have zero tolerance for people who lack integrity.",
      "Whatever you lack, can be overcome through sheer determination.",
      "Out work, out perform, out succeed.",
      "No action, no success.",
      "Success comes from your never ending hard work.",
      "Focus on making money, not spending it.",
      "Persistence is more power than talent, than genius, than education.",
      "If it is to be, it is up to me.",
      "Bet on yourself.",
      "Control expenses."
    ]
  },
  {
    id: "masculine-nature",
    label: "Masculine Nature",
    quotes: [
      "The problem is: You think you have time, but you don't. You really don't.",
      "Control your lust, fear, and greed. The three silent killers of men.",
      "Be outcome-independent, and you will win.",
      "Sometimes, you have to be heartless.",
      "Never trust a man who turns into an entirely different person whenever he's around girls.",
      "You might not realize it yet, but that breakup saved you.",
      "If interest is unclear, stop chasing. Clarity saves time.",
      "Do not stay where you are only tolerated. Move with self-respect.",
      "People stop respecting weak boundaries. Keep your standards clear and be willing to walk away.",
      "Your future is waiting on the version of you that finally wakes up."
    ]
  },
  {
    id: "respect",
    label: "Respect",
    quotes: [
      "Confident men dont accept second-class behavior.",
      "Dont be afraid to lose her.",
      "Women can smell neediness and insecurity a mile away.",
      "No matter what anyone says or does, don't respond in a butt-hurt way.",
      "When you believe in yourself, people believe in you. Confidence is contagious.",
      "When you are not afraid of rejection, people lose their power over you.",
      "Your self-worth should not be dependent on anyone's opinion.",
      "Express interest, but not neediness.",
      "See people as they actually are, not as you wish they were.",
      "Confidence and balls is 90% of the game.",
      "Don't be afraid to get rejected. Be afraid of pussying out.",
      "Confident men are relaxed and keep their composure under intense social pressure."
    ]
  }
];

const habitForm = document.getElementById("habitForm");
const habitNameInput = document.getElementById("habitName");
const habitMinutesInput = document.getElementById("habitMinutes");
const habitCategoryInput = document.getElementById("habitCategory");
const colorPicker = document.getElementById("colorPicker");
const habitList = document.getElementById("habitList");
const habitTemplate = document.getElementById("habitTemplate");
const emptyState = document.getElementById("emptyState");
const todayDate = document.getElementById("todayDate");
const phoneTime = document.getElementById("phoneTime");
const completionRate = document.getElementById("completionRate");
const heroProgressText = document.getElementById("heroProgressText");
const bestStreak = document.getElementById("bestStreak");
const consistencyScore = document.getElementById("consistencyScore");
const focusHabit = document.getElementById("focusHabit");
const weekStrip = document.getElementById("weekStrip");
const progressRing = document.getElementById("progressRing");
const resetTodayButton = document.getElementById("resetTodayButton");
const quoteRail = document.getElementById("quoteRail");
const featuredQuote = document.getElementById("featuredQuote");
const quoteCategoryTitle = document.getElementById("quoteCategoryTitle");
const nextQuoteButton = document.getElementById("nextQuoteButton");
const plannedMinutes = document.getElementById("plannedMinutes");
const completedMinutes = document.getElementById("completedMinutes");
const withinTimeCount = document.getElementById("withinTimeCount");
const overTimeCount = document.getElementById("overTimeCount");
const pager = document.getElementById("pager");
const pageTabs = document.querySelectorAll(".page-tab");
const navItems = document.querySelectorAll(".nav-item[data-page]");
const noteForm = document.getElementById("noteForm");
const noteTitleInput = document.getElementById("noteTitle");
const noteBodyInput = document.getElementById("noteBody");
const noteList = document.getElementById("noteList");
const noteTemplate = document.getElementById("noteTemplate");
const noteEmptyState = document.getElementById("noteEmptyState");

let selectedColor = "#25a9e0";
let habits = loadHabits();
let activeTimer = loadTimerState();
let activeQuoteCategory = QUOTE_CATEGORIES[0].id;
let notes = loadNotes();
let activePage = "habits";

if (habits.length === 0) {
  habits = createDefaultHabits();
  persist();
}

syncDateTime();
render();
setInterval(syncDateTime, 60000);
setInterval(tickTimer, 1000);
syncPager();

colorPicker.addEventListener("click", (event) => {
  const swatch = event.target.closest(".color-swatch");
  if (!swatch) {
    return;
  }

  setSelectedColor(swatch.dataset.color);
});

habitForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = habitNameInput.value.trim();
  const minutesValue = Number(habitMinutesInput.value);
  if (!name) {
    return;
  }

  if (!Number.isFinite(minutesValue) || minutesValue <= 0) {
    return;
  }

  const category = habitCategoryInput.value;
  habits.unshift({
    id: crypto.randomUUID(),
    title: name,
    allocatedMinutes: Math.round(minutesValue),
    actualMinutes: 0,
    actualSeconds: 0,
    status: "not started",
    icon: ICONS[category] ?? "✓",
    motivationalText: "Show up, then keep going.",
    category,
    color: selectedColor,
    createdAt: new Date().toISOString(),
    completions: {}
  });

  persist();
  habitForm.reset();
  habitCategoryInput.value = "Health";
  setSelectedColor("#25a9e0");
  habitNameInput.focus();
  render();
});

habitList.addEventListener("click", (event) => {
  const card = event.target.closest(".habit-card");
  if (!card) {
    return;
  }

  const habit = habits.find((item) => item.id === card.dataset.id);
  if (!habit) {
    return;
  }

  if (event.target.closest(".delete-button")) {
    habits = habits.filter((item) => item.id !== habit.id);
    persist();
    render();
    return;
  }

  const timerButton = event.target.closest(".timer-button");
  if (timerButton) {
    if (activeTimer?.habitId === habit.id) {
      stopTimer();
    } else {
      startTimer(habit);
    }
  }
});

habitList.addEventListener("change", (event) => {
  const allocatedInput = event.target.closest(".habit-allocated");
  if (!allocatedInput) {
    return;
  }

  const card = allocatedInput.closest(".habit-card");
  const habit = habits.find((item) => item.id === card?.dataset.id);
  if (!habit) {
    return;
  }

  const value = Number(allocatedInput.value);
  if (!Number.isFinite(value) || value <= 0) {
    allocatedInput.value = String(habit.allocatedMinutes);
    return;
  }

  habit.allocatedMinutes = Math.round(value);
  habit.status = deriveStatus(habit, activeTimer?.habitId === habit.id);
  persist();
  render();
});

noteForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = noteTitleInput.value.trim();
  const body = noteBodyInput.value.trim();

  if (!title && !body) {
    return;
  }

  notes.unshift({
    id: crypto.randomUUID(),
    title: title || "Untitled",
    description: body,
    completed: false,
    createdAt: new Date().toISOString()
  });

  persistNotes();
  noteForm.reset();
  noteTitleInput.focus();
  renderNotes();
});

noteList.addEventListener("click", (event) => {
  const card = event.target.closest(".note-card");
  if (!card) {
    return;
  }

  const note = notes.find((item) => item.id === card.dataset.id);
  if (!note) {
    return;
  }

  if (event.target.closest(".note-delete")) {
    notes = notes.filter((item) => item.id !== note.id);
    persistNotes();
    renderNotes();
  }

  if (event.target.closest(".note-save")) {
    const titleInput = card.querySelector(".note-title-input");
    const bodyInput = card.querySelector(".note-body");
    note.title = titleInput.value.trim() || "Untitled";
    note.description = bodyInput.value.trim();
    persistNotes();
    renderNotes();
  }
});

noteList.addEventListener("change", (event) => {
  const checkbox = event.target.closest(".note-complete");
  if (!checkbox) {
    return;
  }

  const card = checkbox.closest(".note-card");
  const note = notes.find((item) => item.id === card?.dataset.id);
  if (!note) {
    return;
  }

  note.completed = checkbox.checked;
  persistNotes();
  renderNotes();
});

noteList.addEventListener("input", (event) => {
  const textarea = event.target.closest(".note-body");
  const titleInput = event.target.closest(".note-title-input");
  if (!textarea && !titleInput) {
    return;
  }

  const card = event.target.closest(".note-card");
  if (!card) {
    return;
  }

  const note = notes.find((item) => item.id === card.dataset.id);
  if (!note) {
    return;
  }

  if (titleInput) {
    note.title = titleInput.value;
  }
  if (textarea) {
    note.description = textarea.value;
  }
});

pager.addEventListener("scroll", () => {
  const pageWidth = pager.clientWidth;
  const index = Math.round(pager.scrollLeft / pageWidth);
  const page = index === 0 ? "habits" : "notes";
  if (page !== activePage) {
    activePage = page;
    updatePageIndicators();
  }
});

pageTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    activePage = tab.dataset.page;
    scrollToPage(activePage);
  });
});

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    activePage = item.dataset.page;
    scrollToPage(activePage);
  });
});

resetTodayButton.addEventListener("click", () => {
  habits = habits.map((habit) => ({
    ...habit,
    actualMinutes: 0,
    actualSeconds: 0,
    status: "not started"
  }));
  activeTimer = null;
  persist();
  persistTimer();
  render();
});

quoteRail.addEventListener("click", (event) => {
  const button = event.target.closest(".quote-category-card");
  if (!button) {
    return;
  }

  activeQuoteCategory = button.dataset.category;
  renderQuotes();
});

nextQuoteButton.addEventListener("click", () => {
  const currentIndex = QUOTE_CATEGORIES.findIndex((category) => category.id === activeQuoteCategory);
  const nextIndex = (currentIndex + 1) % QUOTE_CATEGORIES.length;
  activeQuoteCategory = QUOTE_CATEGORIES[nextIndex].id;
  renderQuotes();
});

function render() {
  habitList.innerHTML = "";
  emptyState.hidden = habits.length > 0;
  habitList.hidden = habits.length === 0;

  for (const habit of habits) {
    const isRunning = activeTimer?.habitId === habit.id;
    habit.status = deriveStatus(habit, isRunning);
  }

  for (const habit of habits) {
    habitList.appendChild(createHabitCard(habit));
  }

  updateTopSummary();
  renderQuotes();
  renderNotes();
}

function createHabitCard(habit) {
  const fragment = habitTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".habit-card");
  const icon = fragment.querySelector(".habit-icon");
  const title = fragment.querySelector(".habit-title");
  const motivation = fragment.querySelector(".habit-motivation");
  const status = fragment.querySelector(".habit-status");
  const allocatedInput = fragment.querySelector(".habit-allocated");
  const timerLabel = fragment.querySelector(".habit-timer");
  const timerButton = fragment.querySelector(".timer-button");
  const overtimeNote = fragment.querySelector(".habit-overtime");

  const isRunning = activeTimer?.habitId === habit.id;
  const elapsedSeconds = isRunning ? getActiveElapsedSeconds() : getHabitElapsedSeconds(habit);
  const currentStatus = deriveStatus({ ...habit, actualSeconds: elapsedSeconds }, isRunning);

  card.dataset.id = habit.id;
  icon.textContent = habit.icon ?? "✓";
  icon.style.color = habit.color ?? "inherit";
  title.textContent = habit.title;
  motivation.textContent = habit.motivationalText;
  status.textContent = currentStatus;
  status.dataset.status = currentStatus;
  allocatedInput.value = String(habit.allocatedMinutes);
  timerLabel.textContent = `Elapsed ${formatDuration(elapsedSeconds)} • Actual ${formatMinutes(elapsedSeconds)} min`;
  timerButton.textContent = isRunning ? "Stop" : "Start";

  if (currentStatus === "overtime") {
    overtimeNote.hidden = false;
    overtimeNote.textContent = `You planned ${habit.allocatedMinutes} min, wrap this up`;
  } else {
    overtimeNote.hidden = true;
    overtimeNote.textContent = "";
  }

  return fragment;
}

function renderNotes() {
  noteList.innerHTML = "";
  noteEmptyState.hidden = notes.length > 0;
  noteList.hidden = notes.length === 0;

  for (const note of notes) {
    noteList.appendChild(createNoteCard(note));
  }
}

function createNoteCard(note) {
  const fragment = noteTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".note-card");
  const title = fragment.querySelector(".note-title");
  const date = fragment.querySelector(".note-date");
  const checkbox = fragment.querySelector(".note-complete");
  const body = fragment.querySelector(".note-body");

  card.dataset.id = note.id;
  title.innerHTML = "";
  const input = document.createElement("input");
  input.className = "note-title-input";
  input.value = note.title;
  title.appendChild(input);

  date.textContent = formatNoteDate(note.createdAt);
  checkbox.checked = note.completed;
  body.value = note.description || "";

  if (note.completed) {
    card.classList.add("is-complete");
  }

  return fragment;
}

function updateTopSummary() {
  const planned = habits.reduce((sum, habit) => sum + habit.allocatedMinutes, 0);
  const actual = habits.reduce((sum, habit) => sum + formatMinutes(getHabitElapsedSeconds(habit)), 0);
  const within = habits.filter((habit) => {
    const elapsed = getHabitElapsedSeconds(habit);
    return elapsed > 0 && elapsed <= habit.allocatedMinutes * 60;
  }).length;
  const over = habits.filter((habit) => getHabitElapsedSeconds(habit) > habit.allocatedMinutes * 60).length;

  plannedMinutes.textContent = String(planned);
  completedMinutes.textContent = String(actual);
  withinTimeCount.textContent = String(within);
  overTimeCount.textContent = String(over);

  if (completionRate && heroProgressText && progressRing) {
    completionRate.textContent = "0%";
    heroProgressText.textContent = "0 / 0 habits completed";
    progressRing.style.setProperty("--progress", "0deg");
  }
  if (bestStreak) bestStreak.textContent = "0";
  if (consistencyScore) consistencyScore.textContent = "0";
  if (focusHabit) focusHabit.textContent = "Start small";
}

function renderQuotes() {
  const todaySeed = Number(getTodayKey().replaceAll("-", ""));
  const activeCategory = QUOTE_CATEGORIES.find((category) => category.id === activeQuoteCategory) ?? QUOTE_CATEGORIES[0];
  const featuredIndex = todaySeed % activeCategory.quotes.length;

  quoteCategoryTitle.textContent = activeCategory.label;
  featuredQuote.textContent = activeCategory.quotes[featuredIndex];
  quoteRail.innerHTML = "";

  for (const category of QUOTE_CATEGORIES) {
    const preview = category.quotes[todaySeed % category.quotes.length];
    const card = document.createElement("button");
    card.type = "button";
    card.className = "quote-category-card";
    card.dataset.category = category.id;

    if (category.id === activeCategory.id) {
      card.classList.add("is-active");
    }

    card.innerHTML = `
      <span class="quote-category-name">${category.label}</span>
      <span class="quote-category-preview">${preview}</span>
    `;
    quoteRail.appendChild(card);
  }
}

function createDefaultHabits() {
  return DEFAULT_HABITS.map((habit) => ({
    id: crypto.randomUUID(),
    title: habit.title,
    allocatedMinutes: habit.allocatedMinutes,
    actualMinutes: 0,
    actualSeconds: 0,
    status: "not started",
    icon: habit.icon,
    motivationalText: habit.motivationalText,
    createdAt: new Date().toISOString()
  }));
}

function loadHabits() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((habit) => normalizeHabit(habit));
  } catch {
    return [];
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

function persistNotes() {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

function loadNotes() {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map((note) => ({
      id: note.id ?? crypto.randomUUID(),
      title: note.title ?? "Untitled",
      description: note.description ?? "",
      completed: Boolean(note.completed),
      createdAt: note.createdAt ?? new Date().toISOString()
    }));
  } catch {
    return [];
  }
}

function persistTimer() {
  if (activeTimer) {
    localStorage.setItem(TIMER_KEY, JSON.stringify(activeTimer));
  } else {
    localStorage.removeItem(TIMER_KEY);
  }
}

function loadTimerState() {
  try {
    const raw = localStorage.getItem(TIMER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.habitId || !parsed.startedAt) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function normalizeHabit(habit) {
  const allocatedMinutes = Number.isFinite(habit.allocatedMinutes)
    ? habit.allocatedMinutes
    : Number.isFinite(habit.minutes)
      ? habit.minutes
      : 10;
  const actualMinutes = Number.isFinite(habit.actualMinutes) ? habit.actualMinutes : 0;
  const actualSeconds = Number.isFinite(habit.actualSeconds) ? habit.actualSeconds : actualMinutes * 60;
  return {
    id: habit.id ?? crypto.randomUUID(),
    title: habit.title ?? habit.name ?? "New habit",
    allocatedMinutes,
    actualMinutes,
    actualSeconds,
    status: habit.status ?? "not started",
    icon: habit.icon ?? (habit.category ? ICONS[habit.category] : "✓"),
    motivationalText: habit.motivationalText ?? "Keep moving.",
    category: habit.category,
    color: habit.color,
    createdAt: habit.createdAt ?? new Date().toISOString(),
    completions: habit.completions ?? {}
  };
}

function getHabitElapsedSeconds(habit) {
  if (Number.isFinite(habit.actualSeconds)) {
    return habit.actualSeconds;
  }
  if (Number.isFinite(habit.actualMinutes)) {
    return habit.actualMinutes * 60;
  }
  return 0;
}

function setHabitElapsedSeconds(habit, seconds) {
  habit.actualSeconds = Math.max(0, Math.floor(seconds));
  habit.actualMinutes = formatMinutes(habit.actualSeconds);
}

function deriveStatus(habit, isRunning) {
  const elapsedSeconds = getHabitElapsedSeconds(habit);
  const allocatedSeconds = habit.allocatedMinutes * 60;

  if (elapsedSeconds === 0) {
    return "not started";
  }
  if (elapsedSeconds > allocatedSeconds) {
    return "overtime";
  }
  if (isRunning) {
    return "in progress";
  }
  return "completed";
}

function startTimer(habit) {
  if (activeTimer?.habitId === habit.id) {
    return;
  }
  stopTimer();
  activeTimer = {
    habitId: habit.id,
    startedAt: Date.now(),
    elapsedSeconds: getHabitElapsedSeconds(habit)
  };
  persistTimer();
  render();
}

function stopTimer() {
  if (!activeTimer) {
    return;
  }
  const habit = habits.find((item) => item.id === activeTimer.habitId);
  if (habit) {
    setHabitElapsedSeconds(habit, getActiveElapsedSeconds());
    habit.status = deriveStatus(habit, false);
    persist();
  }
  activeTimer = null;
  persistTimer();
  render();
}

function getActiveElapsedSeconds() {
  if (!activeTimer) {
    return 0;
  }
  return activeTimer.elapsedSeconds + Math.floor((Date.now() - activeTimer.startedAt) / 1000);
}

function tickTimer() {
  if (!activeTimer) {
    return;
  }
  const habit = habits.find((item) => item.id === activeTimer.habitId);
  if (!habit) {
    activeTimer = null;
    persistTimer();
    return;
  }
  setHabitElapsedSeconds(habit, getActiveElapsedSeconds());
  habit.status = deriveStatus(habit, true);
  persist();
  render();
}

function getTodayKey() {
  return formatDateKey(new Date());
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function syncDateTime() {
  const now = new Date();
  todayDate.textContent = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(now);
  phoneTime.textContent = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit"
  }).format(now);
}

function setSelectedColor(color) {
  selectedColor = color;
  for (const item of colorPicker.querySelectorAll(".color-swatch")) {
    item.classList.toggle("active", item.dataset.color === color);
  }
}

function scrollToPage(page) {
  const pageWidth = pager.clientWidth;
  pager.scrollTo({
    left: page === "notes" ? pageWidth : 0,
    behavior: "smooth"
  });
  updatePageIndicators();
}

function updatePageIndicators() {
  pageTabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.page === activePage));
  navItems.forEach((item) => item.classList.toggle("is-active", item.dataset.page === activePage));
}

function syncPager() {
  updatePageIndicators();
  scrollToPage(activePage);
}

function formatNoteDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric"
  }).format(date);
}

function formatDuration(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatMinutes(totalSeconds) {
  if (totalSeconds === 0) {
    return 0;
  }
  return Math.max(1, Math.ceil(totalSeconds / 60));
}
