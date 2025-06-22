// --- Routing Logic ---
function showViewFromHash() {
  const hash = window.location.hash.replace('#', '') || 'dashboard';
  const views = ['dashboard', 'workouts', 'barefoot'];

  views.forEach(viewId => {
    const viewElement = document.getElementById(viewId);
    if (viewElement) {
      viewElement.style.display = (viewId === hash) ? 'block' : 'none';
    }
  });

  if (hash === 'barefoot') {
    renderFilteredBarefootTasks();
    renderAcceptedTasks();
    renderCompletedTasks();
    setupTaskControlButtons();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  showViewFromHash();
  createWorkoutForm();
  renderWorkoutLog();
  loadBarefootTasksFromFiles();
});

window.addEventListener('hashchange', showViewFromHash);

// --- Workout Tracker Logic ---
function createWorkoutForm() {
  const container = document.getElementById('workoutFormContainer');
  if (!container) return;

  const today = new Date().toISOString().split('T')[0];

  container.innerHTML = `
    <h2>Log New Workout</h2>
    <form id="workoutForm" class="form">
      <label>Date<input type="date" id="workoutDate" value="${today}" required></label>
      <label>Duration (seconds) <span style="color: red">*</span>
        <input type="number" id="workoutDuration" min="1" required></label>
      <label>Weight (kg)
        <input type="number" id="workoutWeight" min="0" step="0.1"></label>
      <label>Notes
        <textarea id="workoutNotes" rows="3"></textarea></label>
      <button type="submit">Save Workout</button>
      <div id="workoutFormMsg" class="form-msg"></div>
    </form>
  `;

  const form = document.getElementById('workoutForm');
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const workout = {
      date: document.getElementById('workoutDate').value,
      duration: parseInt(document.getElementById('workoutDuration').value),
      weight: document.getElementById('workoutWeight').value ? parseFloat(document.getElementById('workoutWeight').value) : null,
      notes: document.getElementById('workoutNotes').value.trim()
    };

    let workouts = [];
    try {
      workouts = JSON.parse(localStorage.getItem('workouts')) || [];
    } catch (e) {
      workouts = [];
    }

    workouts.push(workout);
    localStorage.setItem('workouts', JSON.stringify(workouts));

    form.reset();
    document.getElementById('workoutDate').value = today;
    document.getElementById('workoutFormMsg').textContent = "Workout saved!";
    renderWorkoutLog();
  });
}

function renderWorkoutLog() {
  const container = document.getElementById('workoutLogContainer');
  if (!container) return;

  let workouts = [];
  try {
    workouts = JSON.parse(localStorage.getItem('workouts')) || [];
  } catch (e) {
    workouts = [];
  }

  if (workouts.length === 0) {
    container.innerHTML = `<p>No workouts logged yet.</p>`;
    return;
  }

  container.innerHTML = `
    <h2>Workout Log</h2>
    <ul class="workout-log">
      ${workouts.map((w, i) => `
        <li class="log-item">
          <strong>${w.date}</strong> — ${w.duration}s${w.weight ? `, ${w.weight}kg` : ''}
          ${w.notes ? `<br><em>${w.notes}</em>` : ''}
          <button class="edit-btn" data-idx="${i}">Edit</button>
          <button class="delete-btn" data-idx="${i}">Delete</button>
        </li>
      `).join('')}
    </ul>
  `;

  container.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const idx = parseInt(this.dataset.idx);
      const w = workouts[idx];
      document.getElementById('workoutDate').value = w.date;
      document.getElementById('workoutDuration').value = w.duration;
      document.getElementById('workoutWeight').value = w.weight ?? '';
      document.getElementById('workoutNotes').value = w.notes ?? '';
      workouts.splice(idx, 1);
      localStorage.setItem('workouts', JSON.stringify(workouts));
      renderWorkoutLog();
    });
  });

  container.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const idx = parseInt(this.dataset.idx);
      workouts.splice(idx, 1);
      localStorage.setItem('workouts', JSON.stringify(workouts));
      renderWorkoutLog();
    });
  });
}

// --- Barefoot Confidence Task Logic ---
let barefootTasks = [];
const taskFiles = ['tasks_easy.json', 'tasks_medium.json', 'tasks_brave.json', 'tasks_urban.json'];

async function loadBarefootTasksFromFiles() {
  const allTasks = await Promise.all(
    taskFiles.map(file =>
      fetch(file)
        .then(res => res.ok ? res.json() : [])
        .catch(() => [])
    )
  );
  barefootTasks = allTasks.flat();
  renderFilteredBarefootTasks();
  renderAcceptedTasks();
  renderCompletedTasks();
}

function getAcceptedTasks() {
  return JSON.parse(localStorage.getItem('acceptedTasks') || '[]');
}

function getCompletedTasks() {
  return JSON.parse(localStorage.getItem('completedTasks') || '[]');
}

function saveAcceptedTasks(tasks) {
  localStorage.setItem('acceptedTasks', JSON.stringify(tasks));
}

function saveCompletedTasks(tasks) {
  localStorage.setItem('completedTasks', JSON.stringify(tasks));
}

function renderFilteredBarefootTasks() {
  const container = document.getElementById('barefootTasksContainer');
  if (!container) return;

  const showOutdoor = document.getElementById('filter-outdoor')?.checked;
  const includeUrban = document.getElementById('filter-urban')?.checked;
  const difficultyLevels = ['easy', 'medium', 'brave'].filter(d =>
    document.getElementById(`filter-difficulty-${d}`)?.checked
  );
  const selectedWeather = Array.from(document.querySelectorAll('.weather-filter:checked')).map(el => el.value);
  const accepted = getAcceptedTasks();

  const filtered = barefootTasks.filter(task => {
    const matchDifficulty = difficultyLevels.includes(task.difficulty);
    const matchLocation =
      (task.location === 'outdoors' && showOutdoor) ||
      (task.location === 'indoors' && !showOutdoor) ||
      (task.location === 'urban' && includeUrban);
    const matchWeather =
      task.weather.includes('any') ||
      selectedWeather.length === 0 ||
      task.weather.some(w => selectedWeather.includes(w));
    const notAlreadyAccepted = !accepted.some(a => a.text === task.text);
    return matchDifficulty && matchLocation && matchWeather && notAlreadyAccepted;
  });

  const shuffled = filtered.sort(() => 0.5 - Math.random());
  const tasksToShow = shuffled.slice(0, 6);

  if (tasksToShow.length === 0) {
    container.innerHTML = "<p>No tasks match the selected filters. Try adjusting them!</p>";
    return;
  }

  container.innerHTML = tasksToShow.map(task => `
    <div class="widget task-card">
      <div class="task-main">
        <span class="badge badge-${task.difficulty}">${task.difficulty}</span>
        <label>${task.text}</label>
      </div>
      <button class="accept-task-btn" data-text="${task.text}" data-difficulty="${task.difficulty}">Accept</button>
    </div>
  `).join('');

  container.querySelectorAll('.accept-task-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const taskText = btn.dataset.text;
      const difficulty = btn.dataset.difficulty;
      const accepted = getAcceptedTasks();
      if (!accepted.some(t => t.text === taskText)) {
        accepted.push({ text: taskText, difficulty });
        saveAcceptedTasks(accepted);
        renderAcceptedTasks();
        renderFilteredBarefootTasks();
      }
    });
  });
}

function renderAcceptedTasks() {
  const container = document.getElementById('acceptedTasksContainer');
  if (!container) return;

  const accepted = getAcceptedTasks();
  if (accepted.length === 0) {
    container.innerHTML = "<p>No accepted tasks yet.</p>";
    return;
  }

  container.innerHTML = accepted.map(task => `
    <div class="widget task-card">
      <div class="task-main">
        <span class="badge badge-${task.difficulty}">${task.difficulty}</span>
        <label>${task.text}</label>
      </div>
      <div style="margin-top: 0.5rem;">
        <button class="complete-task-btn" data-text="${task.text}">Mark Complete</button>
        <button class="cancel-task-btn" data-text="${task.text}">Cancel</button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.complete-task-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.dataset.text;
      const accepted = getAcceptedTasks().filter(t => t.text !== text);
      const completed = getCompletedTasks();
      completed.push({ text, date: new Date().toISOString() });
      saveAcceptedTasks(accepted);
      saveCompletedTasks(completed);
      renderAcceptedTasks();
      renderCompletedTasks();
      renderFilteredBarefootTasks();
    });
  });

  container.querySelectorAll('.cancel-task-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.dataset.text;
      const accepted = getAcceptedTasks().filter(t => t.text !== text);
      saveAcceptedTasks(accepted);
      renderAcceptedTasks();
      renderFilteredBarefootTasks();
    });
  });
}

function renderCompletedTasks() {
  const container = document.getElementById('completedTasksContainer');
  if (!container) return;

  const completed = getCompletedTasks();
  if (completed.length === 0) {
    container.innerHTML = "<p>No completed tasks yet.</p>";
    return;
  }

  container.innerHTML = completed.slice().reverse().map((task, i) => `
    <div class="widget task-card completed">
      <label>${task.text}</label>
      <span class="date">(${new Date(task.date).toLocaleDateString()})</span>
      <button class="remove-completed-btn" data-idx="${completed.length - 1 - i}">Remove</button>
    </div>
  `).join('');

  container.querySelectorAll('.remove-completed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx);
      const completed = getCompletedTasks();
      completed.splice(idx, 1);
      saveCompletedTasks(completed);
      renderCompletedTasks();
    });
  });
}


document.getElementById('refreshTasks')?.addEventListener('click', renderFilteredBarefootTasks);
document.querySelectorAll('.filters input')?.forEach(input => {
  input.addEventListener('change', renderFilteredBarefootTasks);
});
