// ----- Routing -----
function showViewFromHash() {
  const hash = window.location.hash.replace('#', '') || 'dashboard';
  const views = ['dashboard', 'workouts', 'barefoot'];

  views.forEach(viewId => {
    const viewElement = document.getElementById(viewId);
    if (viewElement) {
      viewElement.style.display = (viewId === hash) ? 'block' : 'none';
    }
  });
}

window.addEventListener('DOMContentLoaded', showViewFromHash);
window.addEventListener('hashchange', showViewFromHash);

// ----- Workout Form + Log -----
function createWorkoutForm() {
  const container = document.getElementById('workoutFormContainer');
  if (!container) return;

  const today = new Date().toISOString().split('T')[0];

  container.innerHTML = `
    <h2>Log New Workout</h2>
    <form id="workoutForm" class="form">
      <label>
        Date
        <input type="date" id="workoutDate" value="${today}" required>
      </label>

      <label>
        Duration (seconds) <span style="color: red">*</span>
        <input type="number" id="workoutDuration" min="1" required>
      </label>

      <label>
        Weight (kg)
        <input type="number" id="workoutWeight" min="0" step="0.1">
      </label>

      <label>
        Notes
        <textarea id="workoutNotes" rows="3"></textarea>
      </label>

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

  // Edit
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

  // Delete
  container.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const idx = parseInt(this.dataset.idx);
      workouts.splice(idx, 1);
      localStorage.setItem('workouts', JSON.stringify(workouts));
      renderWorkoutLog();
    });
  });
}

// ----- Barefoot Tracker Stubs -----
function loadBarefootTasks() {
  console.log('Barefoot tasks loaded (stub)');
}

function loadConfidenceRating() {
  console.log('Confidence rating loaded (stub)');
}

// ----- Init -----
window.addEventListener('DOMContentLoaded', () => {
  createWorkoutForm();
  renderWorkoutLog();
  loadBarefootTasks();
  loadConfidenceRating();
});
