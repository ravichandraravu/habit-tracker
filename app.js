const STORAGE_KEY = "daily-habit-tracker-v3";
const ICONS = {
  Health: "💧",
  Focus: "🧠",
  Fitness: "🏋️",
  Learning: "📖",
  Home: "🏠",
  Mindset: "🪷"
};

const habitForm = document.getElementById("habitForm");
const habitNameInput = document.getElementById("habitName");
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

let selectedColor = "#25a9e0";
let habits = loadHabits();

syncDateTime();
render();
setInterval(syncDateTime, 60000);

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
  habitList.innerHTML = "";
  emptyState.hidden = habits.length > 0;
  habitList.hidden = habits.length === 0;

  for (const habit of habits) {
    habitList.appendChild(createHabitCard(habit));
  }

  updateTopSummary();
  renderWeekStrip();
}

function createHabitCard(habit) {
  const todayKey = getTodayKey();
  const fragment = habitTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".habit-card");
  const icon = fragment.querySelector(".habit-icon");
  const title = fragment.querySelector(".habit-title");
  const meta = fragment.querySelector(".habit-meta");
  const score = fragment.querySelector(".habit-score");
  const days = fragment.querySelector(".habit-days");
  const toggle = fragment.querySelector(".habit-toggle");

  const streak = calculateCurrentStreak(habit);
  const weeklyDone = getLastSevenDays()
    .filter((day) => habit.completions[day.key]).length;

  card.dataset.id = habit.id;
  icon.textContent = ICONS[habit.category] ?? "✓";
  icon.style.color = habit.color;
  title.textContent = habit.name;
  meta.textContent = `${habit.category} • ${streak > 0 ? `${streak} day streak` : "Fresh start"}`;
  score.textContent = `${weeklyDone} / 7`;
  toggle.textContent = habit.completions[todayKey] ? "Undo today" : "Mark today done";

  for (const day of getLastSevenDays()) {
    const box = document.createElement("div");
    box.className = "habit-day";
    if (habit.completions[day.key]) {
      box.classList.add("is-done");
      box.style.background = habit.color;
      box.style.borderColor = habit.color;
      box.textContent = "✓";
    }
    if (day.key === todayKey) {
      box.classList.add("is-today");
    }
    days.appendChild(box);
  }

  return fragment;
}

function updateTopSummary() {
  const todayKey = getTodayKey();
  const total = habits.length;
  const done = habits.filter((habit) => habit.completions[todayKey]).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  const topStreak = habits.length ? Math.max(...habits.map(calculateCurrentStreak)) : 0;
  const weekRates = getLastSevenDays().map((day) => getCompletionRateForDay(day.key));
  const average = habits.length === 0 ? 0 : Math.round(weekRates.reduce((sum, rate) => sum + rate, 0) / weekRates.length);
  const nextHabit = habits.find((habit) => !habit.completions[todayKey])?.name ?? "All done";

  completionRate.textContent = `${percent}%`;
  heroProgressText.textContent = `${done} / ${total} habits completed`;
  bestStreak.textContent = String(topStreak);
  consistencyScore.textContent = String(average);
  focusHabit.textContent = nextHabit;
  progressRing.style.setProperty("--progress", `${Math.round((percent / 100) * 360)}deg`);
}

function renderWeekStrip() {
  const todayKey = getTodayKey();
  weekStrip.innerHTML = "";

  for (const day of getLastSevenDays()) {
    const rate = getCompletionRateForDay(day.key);
    const item = document.createElement("div");
    item.className = "week-day";
    if (rate >= 60) {
      item.classList.add("is-strong");
    }
    if (day.key === todayKey) {
      item.classList.add("is-today");
    }

    item.innerHTML = `
      <span class="week-day-name">${day.label}</span>
      <span class="week-day-rate">${day.key === todayKey ? day.date : rate === 0 ? "•" : "✓"}</span>
    `;
    weekStrip.appendChild(item);
  }
}

function getCompletionRateForDay(key) {
  if (habits.length === 0) {
    return 0;
  }

  const done = habits.filter((habit) => habit.completions[key]).length;
  return Math.round((done / habits.length) * 100);
}

function getLastSevenDays() {
  const base = new Date();
  const days = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(base);
    date.setDate(base.getDate() - offset);
    days.push({
      key: formatDateKey(date),
      label: new Intl.DateTimeFormat(undefined, { weekday: "narrow" }).format(date),
      date: String(date.getDate())
    });
  }

  return days;
}

function toggleHabit(habit) {
  const todayKey = getTodayKey();
  if (habit.completions[todayKey]) {
    delete habit.completions[todayKey];
  } else {
    habit.completions[todayKey] = true;
  }
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
