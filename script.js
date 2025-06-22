// Workout form logic
const workoutForm = document.getElementById('workout-form');
if (workoutForm) {
  // Autofill date input with today
  const dateInput = document.getElementById('workout-date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
  }

  workoutForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const duration = document.getElementById('workout-duration').value.trim();
    const date = document.getElementById('workout-date').value;
    const weight = document.getElementById('workout-weight').value.trim();
    const notes = document.getElementById('workout-notes').value.trim();
    const msg = document.getElementById('workout-form-msg');

    if (!duration || isNaN(duration) || Number(duration) <= 0) {
      msg.textContent = 'Duration is required and must be a positive number.';
      msg.style.color = 'red';
      return;
    }

    const workout = {
      date,
      duration: Number(duration),
      weight: weight ? Number(weight) : null,
      notes
    };

    let workouts = [];
    try {
      workouts = JSON.parse(localStorage.getItem('workouts')) || [];
    } catch (e) {
      workouts = [];
    }
    workouts.push(workout);
    localStorage.setItem('workouts', JSON.stringify(workouts));
    msg.textContent = 'Workout saved!';
    msg.style.color = 'green';
    workoutForm.reset();
    if (dateInput) dateInput.value = today;
    renderWorkoutLog();
  });
}

function renderWorkoutLog() {
  const log = document.getElementById('workout-log');
  if (!log) return;
  let workouts = [];
  try {
    workouts = JSON.parse(localStorage.getItem('workouts')) || [];
  } catch (e) {
    workouts = [];
  }
  if (workouts.length === 0) {
    log.innerHTML = '<p>No workouts logged yet.</p>';
    return;
  }
  log.innerHTML = '<h3>Workout Log</h3>' +
    '<ul>' +
    workouts.map((w, i) => `
      <li class="log-item">
        <strong>${w.date}</strong> — ${w.duration}s${w.weight ? `, ${w.weight}kg` : ''}
        ${w.notes ? `<br><em>${w.notes}</em>` : ''}
        <button class="edit-btn" data-idx="${i}">Edit</button>
        <button class="delete-btn" data-idx="${i}">Delete</button>
      </li>
    `).join('') +
    '</ul>';

  // Delete handler
  log.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = function() {
      const idx = Number(this.dataset.idx);
      workouts.splice(idx, 1);
      localStorage.setItem('workouts', JSON.stringify(workouts));
      renderWorkoutLog();
      if (typeof renderWorkoutChart === 'function') renderWorkoutChart();
    };
  });

  // Edit handler (simple: loads values into form)
  log.querySelectorAll('.edit-btn').forEach(btn => {
    btn.onclick = function() {
      const idx = Number(this.dataset.idx);
      const w = workouts[idx];
      document.getElementById('workout-date').value = w.date;
      document.getElementById('workout-duration').value = w.duration;
      document.getElementById('workout-weight').value = w.weight ?? '';
      document.getElementById('workout-notes').value = w.notes ?? '';
      // Remove the old entry so saving will overwrite
      workouts.splice(idx, 1);
      localStorage.setItem('workouts', JSON.stringify(workouts));
      renderWorkoutLog();
      if (typeof renderWorkoutChart === 'function') renderWorkoutChart();
    };
  });
}

// Call after saving, deleting, or editing
if (document.getElementById('workout-log')) {
  document.addEventListener('DOMContentLoaded', renderWorkoutLog);
}
if (workoutForm) {
  workoutForm.addEventListener('submit', renderWorkoutLog);
}

// Barefoot confidence checklist and rating logic
function loadBarefootTasks() {
  const form = document.getElementById('barefoot-tasks-form');
  if (!form) return;
  const saved = JSON.parse(localStorage.getItem('barefootTasks') || '{}');
  Array.from(form.elements).forEach(el => {
    if (el.type === 'checkbox') {
      el.checked = !!saved[el.value];
      el.onchange = function() {
        saved[el.value] = el.checked;
        localStorage.setItem('barefootTasks', JSON.stringify(saved));
      };
    }
  });
  document.getElementById('reset-tasks').onclick = function() {
    Array.from(form.elements).forEach(el => {
      if (el.type === 'checkbox') el.checked = false;
    });
    localStorage.removeItem('barefootTasks');
  };
}

function loadConfidenceRating() {
  const slider = document.getElementById('confidence-rating');
  const valueSpan = document.getElementById('confidence-value');
  if (!slider || !valueSpan) return;
  const saved = localStorage.getItem('confidenceRating');
  slider.value = saved !== null ? saved : 5;
  valueSpan.textContent = slider.value;
  slider.oninput = function() {
    valueSpan.textContent = slider.value;
    localStorage.setItem('confidenceRating', slider.value);
  };
}

document.addEventListener('DOMContentLoaded', function() {
  loadBarefootTasks();
  loadConfidenceRating();
});

// Routing logic
function showViewFromHash() {
  const hash = window.location.hash || '#dashboard';
  const views = ['#dashboard', '#workouts', '#barefoot'];
  
  views.forEach(viewId => {
    const viewElement = document.querySelector(viewId);
    if (viewElement) {
      viewElement.style.display = (hash === viewId) ? 'block' : 'none';
    }
  });
}

// Show correct view on page load
document.addEventListener('DOMContentLoaded', showViewFromHash);

// Show correct view when hash changes
window.addEventListener('hashchange', showViewFromHash);

// Generate and insert workout form
function createWorkoutForm() {
  const container = document.getElementById('workoutFormContainer');
  if (!container) return;
  
  const today = new Date().toISOString().split('T')[0];
  
  container.innerHTML = `
    <h2>Log New Workout</h2>
    <form id="workoutForm">
      <label>
        Date
        <input type="date" id="workoutDate" value="${today}" required>
      </label>
      
      <label>
        Duration (seconds) <span style="color: red;">*</span>
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
    </form>
  `;
  
  // Handle form submission
  const form = document.getElementById('workoutForm');
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const workout = {
      date: document.getElementById('workoutDate').value,
      duration: parseInt(document.getElementById('workoutDuration').value),
      weight: document.getElementById('workoutWeight').value ? parseFloat(document.getElementById('workoutWeight').value) : null,
      notes: document.getElementById('workoutNotes').value.trim()
    };
    
    // Load existing workouts
    let workouts = [];
    try {
      workouts = JSON.parse(localStorage.getItem('workouts')) || [];
    } catch (e) {
      workouts = [];
    }
    
    // Append new workout
    workouts.push(workout);
    localStorage.setItem('workouts', JSON.stringify(workouts));
    
    // Reset form
    form.reset();
    document.getElementById('workoutDate').value = today;
    
    alert('Workout saved!');
  });
}

// Initialize form when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  createWorkoutForm();
}); 