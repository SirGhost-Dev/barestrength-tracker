App Name: BareStrength Tracker
Type: Client-side Web App (SPA using hash routing, localStorage only)
Target Platform: iPhone (via Safari + “Add to Home Screen”)
Hosting: GitHub Pages or Netlify

1. Purpose
To create a personal, mobile-friendly web app that tracks two key areas:

Workouts: Specifically how long weights are held, with progress shown on a line graph

Barefoot Progress: Habit/task-based tracking to build barefoot confidence

The app should be simple, private (local only), offline-capable, and work entirely on the user’s iPhone.

2. Pages (SPA Views)
A. Dashboard Page
#dashboard

Workout Summary Widget

Line graph plotting:

X-axis: Workout session number

Y-axis: Duration (seconds) holding the weight

Pulls data from workout tracker page (localStorage)

Displays latest 5–10 entries

Barefoot Progress Widget

Progress indicator (can be % complete or streak/task system)

Suggested UI options:

Task checklist (e.g., “walk outside for 5 min barefoot”)

Metric (e.g., 3/5 weekly barefoot activities done)

Option to mark tasks complete or reset weekly

B. Workout Tracker Page
#workouts

Input Form:

Date (auto or manual)

Weight held (optional)

Duration held (in seconds)

Notes (optional)

Save Button: Stores entry in localStorage

Workout Log: Lists past workouts with edit/delete option

Link Back to Dashboard

C. Barefoot Confidence Page
#barefoot

Educational Content / Micro Goals:

Short info blurbs on barefooting benefits

Suggested exposure goals (e.g., “Go to mailbox barefoot”, “Stand on grass 10 minutes”)

Confidence Tasks Tracker

Checklist of activities to build tolerance & confidence

Optional rating system (0–10 confidence scale)

3. Functional Requirements
Data is saved using localStorage

App must work offline once loaded

Uses hash routing (#dashboard, #workouts, #barefoot)

JS updates content dynamically based on route

Responsive design for mobile use

All views must fit in a single-page app for deployment simplicity

4. Non-Functional Requirements
Performance: Loads instantly, minimal JS

Security: No external data stored or transmitted; all local

Usability: Touch-friendly UI, large buttons, simple flows

Maintainability: Written in modular HTML/JS/CSS; no build tools

Scalability: Easy to expand with more trackers or sync if needed

5. Technology Stack
HTML/CSS/JavaScript (vanilla)

No frameworks or libraries required (optional: Chart.js for graphs)

Deployment: GitHub Pages (or Netlify)

Editor: Cursor (VS Code AI-enhanced)


/barestrength-tracker
├── index.html         # All views handled here (SPA)
├── style.css          # Global styles
├── script.js          # Routing + logic
├── data.js            # LocalStorage read/write helpers
├── chart.js           # Graph logic (Chart.js)
└── srs.md             # Keep your SRS right here in the repo