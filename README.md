# MLX Studio

An interactive, AI-supported learning app for core machine learning algorithms, built for both self-study and classroom teaching.

- **Course:** ET617 Educational Application Development, IIT Bombay
- **Client:** Dr. Kapil Kadam, D Y Patil College of Engineering and Technology, Kolhapur
- **Team:** Aadirath Singh, Umang Gupta, Vaibhavi Kadam

## Topics

| Topic | What the learner does |
| --- | --- |
| Linear Regression | Fits a line by hand, measures the error (MSE), derives and applies Ordinary Least Squares. Sandbox for their own data (typed or CSV). |
| K-Means Clustering | Chooses a dataset (2-feature example, 4-feature Iris flowers, two rings that break an assumption, or own data), chooses K, predicts each assignment, watches the cost J fall, then reads an elbow plot and compares clusters with the real labels. |
| Gradient Descent | Watches a path descend the error surface, tunes the learning rate, and races three learning rates side by side. Four preset datasets. |

## Features

- **Virtual Labs-style structure** for every topic: Aim → Theory → Assumptions → Pretest → Procedure → Simulation → Posttest → References, in a left sidebar.
- **Assumptions section** per topic: the cost function, what the data must look like, how to check it, what breaks, and when to use or avoid the algorithm.
- **Data tables** with named features, the target or label marked, and mean / min / max / standard deviation.
- **Multidimensional K-Means:** clusters the 4-feature Iris data; learners choose which 2 features to plot.
- **Pretest and posttest** on the same questions. After the pretest, learners see which ideas they missed and what to try in the simulation (never the answers); the posttest shows each idea before and after.
- **Live pictures beside the theory:** a draggable line, a K-means stepper and a rolling-ball learning-rate demo that follow the block being read.
- **AI coach** (Gemini) that gives hints and questions, never direct answers. Replies in English, Hindi or Marathi, with read-aloud.
- **Hyperparameter tuning:** elbow plot for K, learning-rate comparison for gradient descent.
- **Experiment log** per topic, downloadable, and read by the AI coach.
- **"Hear the error"** sound mode in K-Means and Gradient Descent.
- **Teacher Mode** for projector demonstrations: presentation mode, keyboard shortcuts, CSV upload, a Python code view synchronised with the diagram, and **Run and break it**, a runnable JavaScript twin of each algorithm with one-click bugs, real error messages and line numbers. Protected by a class passcode.
- **Class insights** for teachers: sessions, before and after scores, most-missed ideas and coach questions, read from an anonymous usage log.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev        # development server, usually http://localhost:5173
npm run build      # production build into dist/
npm run lint       # oxlint
```

The AI coach calls `/api/hint`, a Vercel serverless function. When running locally with `npm run dev`, that endpoint does not exist, so the coach shows a fixed fallback hint. Everything else works offline.

## Deploy (Vercel)

1. Import the repository into Vercel (framework preset: Vite).
2. In Project Settings → Environment Variables, add the variables below (Production at least).
3. Deploy. Every file in `api/` that does not start with an underscore becomes a serverless function.

| Variable | Needed for | Notes |
| --- | --- | --- |
| `GEMINI_API_KEY` | AI coach (`/api/hint`) | From Google AI Studio |
| `TEACHER_PASSCODE` | Teacher Mode (`/api/teacher-login`) | The class passcode. Without it Teacher Mode stays closed. |
| `TEACHER_SECRET` | Optional | Signs the teacher cookie. Defaults to the passcode. |
| `SUPABASE_URL` | Usage log (`/api/log`, `/api/insights`) | Project URL, `https://<id>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Usage log | The secret key. Server only. Never put it in `src/`. |

Nothing breaks if the Supabase variables are missing: events are accepted and dropped, and the teacher dashboard says the database is not connected.

### Usage log (Supabase)

1. Create a free project at supabase.com.
2. In the SQL editor, run `supabase/schema.sql`. It creates one table, `events`, with row level security on and no public policies.
3. Copy the project URL and the service role (secret) key into the two Supabase variables above, then redeploy.

The key is only read on the server and is never sent to the browser.

### Teacher passcode

`/api/teacher-login` compares the passcode with `TEACHER_PASSCODE` and sets a signed, HttpOnly cookie that lasts eight hours. This keeps students out of Teacher Mode. It is not a user-account system, and since the front-end code is public it should not guard anything secret. Per-teacher accounts are future work. On `npm run dev` the gate is open, because the dev server has no `/api`.

## Project structure

```
api/hint.js                     Gemini proxy for the AI coach (Vercel function)
src/
  App.jsx                       Routes
  pages/LabPage.jsx             Sidebar + Aim/Theory/Pretest/Procedure/Simulation/Posttest/References
  pages/*Page.jsx               Simulation pages, summary, about, teacher pages
  components/                   Simulations (LinearRegression, KMeans, GradientDescent, GradientDescentCompare),
                                AI panel, experiment log, assessment runner, sound toggle
  components/teacher/           Teacher Mode workspaces, code view, Run and break it, passcode gate, class insights
  components/theory/            Live pictures beside the theory text
  data/topics.js                Topic metadata and quiz questions
  data/labContent.js            Aim, theory, procedure, references, pretest question choice
  data/pretestMap.js            Each pretest question: the idea it tests and what to try in the simulation
  context/SessionContext.jsx    Quiz and pre/post results for the session
  hooks/                        sessionStorage-backed state and experiment log
  styles/                       Theme, paper style, lab layout
reference/                      Original HTML prototypes the React app was built from
```

## Routes

| Path | Page |
| --- | --- |
| `/` | Topic cards |
| `/topic/:topicId/:section` | Lab page; `section` is `aim`, `theory`, `assumptions`, `pretest`, `procedure`, `simulation`, `posttest` or `references` |
| `/topic/:topicId/summary` | Session summary with pretest vs. posttest |
| `/linear-regression/sandbox` | Fit a line to your own data |
| `/teacher`, `/teacher/:topic` | Teacher Mode |

`topicId` is `linear-regression`, `k-means` or `gradient-descent`. Old links (`/linear-regression`, `/k-means`, `/gradient-descent`, `/topic/:topicId/quiz`) redirect to the new pages.

## Data and privacy

Lesson progress, experiment logs and pre/post scores stay in the browser's `sessionStorage` and disappear when the tab is closed.

In addition, the deployed site sends **anonymous events** to `/api/log`: page views, experiments, predictions, pretest and posttest scores, coach questions and code runs. Each browser tab gets a random ID. The database stores no names, emails or IP addresses. Browsers that send "Do Not Track" are not logged, and nothing is logged on `npm run dev`. The About page tells learners this.

The AI coach also sends the question, a short description of the current screen, recent experiment results and the chosen language to Google's Gemini API.
