const STORAGE_KEY = "daily-habit-tracker-v1";

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

let selectedColor = "#ff7a59";
let habits = loadHabits();

syncTodayDate();
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

  const id = card.dataset.id;
  const habit = habits.find((item) => item.id === id);
  if (!habit) {
    return;
  }

  if (event.target.closest(".delete-button")) {
    habits = habits.filter((item) => item.id !== id);
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
    meta.textContent = doneToday
      ? `Completed today. Current streak: ${streak} day${streak === 1 ? "" : "s"}`
      : `Current streak: ${streak} day${streak === 1 ? "" : "s"}`;

    habitList.appendChild(fragment);
  }

  updateStats();
}

function updateStats() {
  const total = habits.length;
  const done = habits.filter((habit) => habit.completions[getTodayKey()]).length;
  const rate = total === 0 ? 0 : Math.round((done / total) * 100);
  const streaks = habits.map(calculateCurrentStreak);
  const topStreak = streaks.length ? Math.max(...streaks) : 0;

  heroProgressFill.style.width = `${rate}%`;
  heroProgressText.textContent = `${done} of ${total} complete`;
  completionRate.textContent = `${rate}%`;
  habitCount.textContent = String(total);
  bestStreak.textContent = String(topStreak);
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

function loadHabits() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
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
