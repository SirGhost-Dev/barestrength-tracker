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

  Chart.defaults.resolution = window.devicePixelRatio;

  if (hash === 'barefoot') {
    renderBarefootViews();
  } else if (hash === 'dashboard') {
    renderWorkoutCharts();
  renderBarefootProgress()

  }
}

function renderBarefootViews() {
  renderFilteredBarefootTasks();
  renderAcceptedTasks();
  renderCompletedTasks();
}

window.addEventListener('DOMContentLoaded', async () => {
  await loadBarefootTasksFromFiles();
  createWorkoutForm();
  renderWorkoutLog();
  showViewFromHash();
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

  document.getElementById('workoutForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const workout = {
      date: document.getElementById('workoutDate').value,
      duration: parseInt(document.getElementById('workoutDuration').value),
      weight: document.getElementById('workoutWeight').value ? parseFloat(document.getElementById('workoutWeight').value) : null,
      notes: document.getElementById('workoutNotes').value.trim()
    };

    let workouts = JSON.parse(localStorage.getItem('workouts')) || [];
    workouts.push(workout);
    localStorage.setItem('workouts', JSON.stringify(workouts));

    this.reset();
    document.getElementById('workoutDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('workoutFormMsg').textContent = "Workout saved!";
    renderWorkoutLog();
  });
}

function renderWorkoutLog() {
  const container = document.getElementById('workoutLogContainer');
  if (!container) return;

  const workouts = JSON.parse(localStorage.getItem('workouts')) || [];

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

function renderWorkoutCharts() {
  const workouts = JSON.parse(localStorage.getItem('workouts')) || [];

  const msg = document.getElementById('workoutEmptyMessage');
  const durationCanvas = document.getElementById('durationChart');
  const weightCanvas = document.getElementById('weightChart');

  if (!durationCanvas || !weightCanvas || workouts.length === 0) {
    if (msg) {
      msg.innerHTML = `
        <p style="margin-top: 1rem; font-style: italic;">
          No workout data yet. Log your first workout to see your progress here.
        </p>
      `;
    }
    return;
  }

  // Sort data
  const sorted = workouts.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  const labels = sorted.map(w => w.date);
  const durations = sorted.map(w => w.duration);
  const weights = sorted.map(w => w.weight ?? null);

  if (window.durationChart instanceof Chart) window.durationChart.destroy();
  if (window.weightChart instanceof Chart) window.weightChart.destroy();

  const baseOptions = {
    type: 'line',
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
      plugins: {
        legend: { display: true }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  };

  window.durationChart = new Chart(durationCanvas, {
    ...baseOptions,
    data: {
      labels,
      datasets: [{
        label: 'Workout Duration (s)',
        data: durations,
        borderWidth: 2,
        fill: false,
        tension: 0.2,
        borderColor: '#2563eb'
      }]
    }
  });

  window.weightChart = new Chart(weightCanvas, {
    ...baseOptions,
    data: {
      labels,
      datasets: [{
        label: 'Weight (kg)',
        data: weights,
        borderWidth: 2,
        fill: false,
        tension: 0.2,
        borderColor: '#f59e0b'
      }]
    }
  });
}





// --- Barefoot Confidence Task Logic ---
let barefootTasks = [];
const taskFiles = ['tasks_easy.json', 'tasks_medium.json', 'tasks_brave.json', 'tasks_urban.json'];

async function loadBarefootTasksFromFiles() {
  const allTasks = await Promise.all(
    taskFiles.map(file =>
      fetch(file).then(res => res.ok ? res.json() : []).catch(() => [])
    )
  );
  barefootTasks = allTasks.flat();
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

function renderBarefootProgress() {
  const container = document.getElementById('barefootProgressContainer');
  if (!container) return;

  const accepted = getAcceptedTasks();
  const completed = getCompletedTasks();

  const difficultyCounts = { easy: 0, medium: 0, brave: 0 };
  completed.forEach(task => {
    const diff = task.difficulty?.toLowerCase();
    if (difficultyCounts.hasOwnProperty(diff)) {
      difficultyCounts[diff]++;
    }
  });

  const totalAccepted = accepted.length;
  const totalCompleted = completed.length;

container.innerHTML = `
  <div class="progress-widget">
    <h2>Barefoot Progress</h2>
    <p>🏁 <strong>${totalCompleted}</strong> completed · 🎯 <strong>${totalAccepted}</strong> accepted</p>
  </div>

  <div class="chart-row">
    <div class="chart-box">
      <canvas id="difficultyChart"></canvas>
    </div>
    <div class="chart-box">
      <canvas id="completionDonut"></canvas>
    </div>
  </div>
`;

  // Destroy if exists
  if (window.difficultyChart instanceof Chart) window.difficultyChart.destroy();
  if (window.completionDonut instanceof Chart) window.completionDonut.destroy();

  // Chart 1: Difficulty Breakdown (Bar)
  const diffCtx = document.getElementById('difficultyChart').getContext('2d');
  window.difficultyChart = new Chart(diffCtx, {
    type: 'bar',
    data: {
      labels: ['Easy', 'Medium', 'Brave'],
      datasets: [{
        label: 'Completed Tasks',
        data: [
          difficultyCounts.easy,
          difficultyCounts.medium,
          difficultyCounts.brave
        ],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: 'Completed Tasks by Difficulty'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          precision: 0
        }
      }
    }
  });

  // Chart 2: Accepted vs Completed (Donut)
  const donutCtx = document.getElementById('completionDonut').getContext('2d');
  window.completionDonut = new Chart(donutCtx, {
    type: 'doughnut',
    data: {
      labels: ['Accepted', 'Completed'],
      datasets: [{
        data: [totalAccepted, totalCompleted],
        backgroundColor: ['#3b82f6', '#10b981']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        title: {
          display: true,
          text: 'Accepted vs Completed Tasks'
        }
      }
    }
  });
}

// --- Events ---
document.getElementById('refreshTasks')?.addEventListener('click', renderFilteredBarefootTasks);
document.querySelectorAll('input')?.forEach(input => {
  input.addEventListener('change', renderFilteredBarefootTasks);
});
