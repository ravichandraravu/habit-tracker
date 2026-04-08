const STORAGE_KEY = "daily-habit-tracker-v2";
const REFLECTION_KEY = "daily-habit-tracker-reflection-v1";

const MESSAGES = [
  "Discipline gets easier when the first step is tiny.",
  "You do not need a perfect day. You need an honest one.",
  "Momentum is built by showing up before you feel ready.",
  "Protect your future self with one clean repeat today.",
  "A calm routine beats a dramatic reset every time."
];

const habitForm = document.getElementById("habitForm");
const habitNameInput = document.getElementById("habitName");
const habitCategoryInput = document.getElementById("habitCategory");
const colorPicker = document.getElementById("colorPicker");
const habitList = document.getElementById("habitList");
const habitTemplate = document.getElementById("habitTemplate");
const emptyState = document.getElementById("emptyState");
const todayDate = document.getElementById("todayDate");
const heroProgressFill = document.getElementById("heroProgressFill");
const heroProgressText = document.getElementById("heroProgressText");
const completionRate = document.getElementById("completionRate");
const habitCount = document.getElementById("habitCount");
const bestStreak = document.getElementById("bestStreak");
const resetTodayButton = document.getElementById("resetTodayButton");
const heroMessage = document.getElementById("heroMessage");
const focusHabit = document.getElementById("focusHabit");
const consistencyScore = document.getElementById("consistencyScore");
const weeklyLabel = document.getElementById("weeklyLabel");
const weekStrip = document.getElementById("weekStrip");
const smallWinText = document.getElementById("smallWinText");
const reflectionInput = document.getElementById("reflectionInput");
const reflectionStatus = document.getElementById("reflectionStatus");

let selectedColor = "#ff7a59";
let habits = loadHabits();

syncTodayDate();
hydrateReflection();
render();

colorPicker.addEventListener("click", (event) => {
  const swatch = event.target.closest(".color-swatch");
  if (!swatch) {
    return;
  }

  selectedColor = swatch.dataset.color;
  for (const item of colorPicker.querySelectorAll(".color-swatch")) {
    item.classList.toggle("active", item === swatch);
  }
});

habitForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = habitNameInput.value.trim();
  if (!name) {
    return;
  }

  habits.unshift({
    id: crypto.randomUUID(),
    name,
    category: habitCategoryInput.value,
    color: selectedColor,
    createdAt: new Date().toISOString(),
    completions: {}
  });

  persist();
  habitForm.reset();
  habitCategoryInput.value = "Health";
  setSelectedColor("#ff7a59");
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

  if (event.target.closest(".habit-toggle")) {
    toggleHabit(habit);
    persist();
    render();
  }
});

resetTodayButton.addEventListener("click", () => {
  const todayKey = getTodayKey();
  habits = habits.map((habit) => {
    const completions = { ...habit.completions };
    delete completions[todayKey];
    return { ...habit, completions };
  });

  persist();
  render();
});

reflectionInput.addEventListener("input", () => {
  const todayKey = getTodayKey();
  const payload = loadReflectionMap();
  payload[todayKey] = reflectionInput.value.trim();
  localStorage.setItem(REFLECTION_KEY, JSON.stringify(payload));
  reflectionStatus.textContent = reflectionInput.value.trim()
    ? "Reflection saved for today."
    : "Saved only on this device.";
});

function render() {
  const todayKey = getTodayKey();
  habitList.innerHTML = "";

  emptyState.hidden = habits.length > 0;
  habitList.hidden = habits.length === 0;

  for (const habit of habits) {
    const fragment = habitTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".habit-card");
    const toggle = fragment.querySelector(".habit-toggle");
    const ring = fragment.querySelector(".habit-toggle-ring");
    const title = fragment.querySelector(".habit-title");
    const category = fragment.querySelector(".habit-category");
    const meta = fragment.querySelector(".habit-meta");
    const badge = fragment.querySelector(".habit-badge");

    const doneToday = Boolean(habit.completions[todayKey]);
    const streak = calculateCurrentStreak(habit);

    card.dataset.id = habit.id;
    card.classList.toggle("is-complete", doneToday);
    card.style.borderLeft = `8px solid ${habit.color}`;

    toggle.style.background = doneToday ? habit.color : "rgba(39, 28, 21, 0.08)";
    ring.style.background = doneToday ? "#fff7f0" : "transparent";
    ring.style.borderColor = doneToday ? "#fff7f0" : "rgba(39, 28, 21, 0.2)";

    title.textContent = habit.name;
    category.textContent = habit.category;
    badge.textContent = streak > 0 ? `${streak} day streak` : "Fresh start";
    meta.textContent = doneToday
      ? "Done today. Protect the streak tomorrow."
      : streak > 0
        ? `You have momentum. Keep ${streak} day${streak === 1 ? "" : "s"} alive.`
        : "Start once today. Repetition begins with a single check.";

    habitList.appendChild(fragment);
  }

  updateStats();
  renderWeekStrip();
  updateMotivation();
}

function updateStats() {
  const todayKey = getTodayKey();
  const total = habits.length;
  const done = habits.filter((habit) => habit.completions[todayKey]).length;
  const rate = total === 0 ? 0 : Math.round((done / total) * 100);
  const streaks = habits.map(calculateCurrentStreak);
  const topStreak = streaks.length ? Math.max(...streaks) : 0;
  const weekSummary = buildWeekSummary();
  const strongDays = weekSummary.filter((day) => day.rate >= 70).length;

  heroProgressFill.style.width = `${rate}%`;
  heroProgressText.textContent = `${done} of ${total} complete`;
  completionRate.textContent = `${rate}%`;
  habitCount.textContent = String(total);
  bestStreak.textContent = String(topStreak);
  consistencyScore.textContent = String(calculateConsistencyScore(weekSummary));
  weeklyLabel.textContent = `${strongDays} strong day${strongDays === 1 ? "" : "s"}`;
}

function renderWeekStrip() {
  const weekSummary = buildWeekSummary();
  weekStrip.innerHTML = "";

  for (const day of weekSummary) {
    const element = document.createElement("div");
    element.className = "week-day";
    if (day.rate >= 70) {
      element.classList.add("is-strong");
    }
    if (day.isToday) {
      element.classList.add("is-today");
    }

    element.innerHTML = `
      <span class="week-day-name">${day.label}</span>
      <span class="week-day-rate">${day.total === 0 ? "-" : `${day.rate}%`}</span>
    `;
    weekStrip.appendChild(element);
  }
}

function updateMotivation() {
  const todayKey = getTodayKey();
  const total = habits.length;
  const doneHabits = habits.filter((habit) => habit.completions[todayKey]);
  const remaining = habits.filter((habit) => !habit.completions[todayKey]);
  const rate = total === 0 ? 0 : Math.round((doneHabits.length / total) * 100);
  const quoteIndex = Number(todayKey.replaceAll("-", "")) % MESSAGES.length;

  heroMessage.textContent = total === 0
    ? "Start with one habit that feels almost too easy. The goal is to make returning tomorrow feel natural."
    : rate === 100
      ? "You closed the loop today. Let that feeling become your new normal."
      : `${MESSAGES[quoteIndex]} ${remaining.length > 0 ? "Your next checkmark matters most." : ""}`;

  focusHabit.textContent = remaining[0]?.name ?? doneHabits[0]?.name ?? "Pick one habit to begin";
  smallWinText.textContent = total === 0
    ? "Add one habit you can complete in under two minutes. Easy wins create return visits."
    : rate === 0
      ? `Start with "${remaining[0]?.name ?? "your easiest habit"}". Make the first win so small you cannot avoid it.`
      : rate < 100
        ? `You're already moving. Finish with "${remaining[0]?.name ?? "one more habit"}" to give today a clean ending.`
        : "Everything is checked off. Take 10 seconds to notice that you kept a promise to yourself.";
}

function toggleHabit(habit) {
  const todayKey = getTodayKey();
  if (habit.completions[todayKey]) {
    delete habit.completions[todayKey];
    return;
  }

  habit.completions[todayKey] = true;
}

function calculateCurrentStreak(habit) {
  let streak = 0;
  const cursor = new Date();

  while (true) {
    const key = formatDateKey(cursor);
    if (!habit.completions[key]) {
      break;
    }

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function buildWeekSummary() {
  const days = [];
  const today = new Date();

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const key = formatDateKey(date);
    const total = habits.length;
    const done = habits.filter((habit) => Boolean(habit.completions[key])).length;
    const rate = total === 0 ? 0 : Math.round((done / total) * 100);

    days.push({
      key,
      total,
      rate,
      isToday: key === getTodayKey(),
      label: new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date)
    });
  }

  return days;
}

function calculateConsistencyScore(weekSummary) {
  if (weekSummary.length === 0 || habits.length === 0) {
    return 0;
  }

  const totalRate = weekSummary.reduce((sum, day) => sum + day.rate, 0);
  return Math.round(totalRate / weekSummary.length);
}

function hydrateReflection() {
  const payload = loadReflectionMap();
  const todayValue = payload[getTodayKey()] ?? "";
  reflectionInput.value = todayValue;
  reflectionStatus.textContent = todayValue
    ? "Reflection saved for today."
    : "Saved only on this device.";
}

function loadReflectionMap() {
  try {
    const raw = localStorage.getItem(REFLECTION_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function loadHabits() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
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

function syncTodayDate() {
  todayDate.textContent = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(new Date());
}

function setSelectedColor(color) {
  selectedColor = color;
  for (const item of colorPicker.querySelectorAll(".color-swatch")) {
    item.classList.toggle("active", item.dataset.color === color);
  }
}
