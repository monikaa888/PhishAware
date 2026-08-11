export const docsHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>PhishAware Backend API Docs</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #0f172a;
        --panel: rgba(203, 213, 225, 0.06);
        --text: #cbd5e1;
        --muted: rgba(203, 213, 225, 0.72);
        --accent: #06b6d4;
        --border: rgba(203, 213, 225, 0.16);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--bg);
        color: var(--text);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        line-height: 1.6;
      }
      main {
        width: min(1080px, calc(100% - 32px));
        margin: 0 auto;
        padding: 48px 0;
      }
      header {
        margin-bottom: 28px;
      }
      h1, h2, h3 {
        line-height: 1.15;
        margin: 0;
      }
      h1 {
        font-size: clamp(32px, 5vw, 56px);
        letter-spacing: -0.03em;
      }
      h2 {
        margin-top: 34px;
        font-size: 24px;
      }
      h3 {
        margin-top: 18px;
        font-size: 18px;
      }
      p {
        color: var(--muted);
        margin: 10px 0 0;
      }
      code, pre {
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
      }
      code {
        color: var(--accent);
      }
      pre {
        overflow-x: auto;
        border: 1px solid var(--border);
        background: #020617;
        border-radius: 12px;
        padding: 14px;
        color: var(--text);
      }
      section, .card {
        border: 1px solid var(--border);
        background: var(--panel);
        border-radius: 14px;
        padding: 20px;
        margin-top: 16px;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 14px;
      }
      .endpoint {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
        margin-top: 12px;
      }
      .method {
        border-radius: 999px;
        background: var(--accent);
        color: #0f172a;
        font-weight: 800;
        padding: 4px 10px;
        font-size: 12px;
      }
      .path {
        color: var(--text);
        font-weight: 700;
      }
      ul {
        margin: 10px 0 0;
        padding-left: 20px;
        color: var(--muted);
      }
      a {
        color: var(--accent);
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <p>PhishAware</p>
        <h1>Backend API Docs</h1>
        <p>Local API base: <code>http://localhost:4000/api/v1</code></p>
      </header>

      <section>
        <h2>Environment</h2>
        <p>MongoDB is the primary persistence layer. <code>GEMINI_API_KEY</code> is optional during verification; when it is missing, AI generation uses deterministic mock output with the same response shape.</p>
        <pre>PORT=4000
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=phishaware
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash</pre>
      </section>

      <section>
        <h2>Auth</h2>
        <div class="endpoint"><span class="method">POST</span><span class="path">/api/v1/auth/register</span></div>
        <p>Creates a learner account and stores it in MongoDB when <code>MONGODB_URI</code> is configured.</p>
        <pre>{"email":"alex@example.com","displayName":"Alex Morgan","password":"strong-password"}</pre>
        <div class="endpoint"><span class="method">POST</span><span class="path">/api/v1/auth/login</span></div>
        <p>Validates credentials and returns the learner profile plus bearer access token.</p>
        <pre>{"email":"alex@example.com","password":"strong-password"}</pre>
      </section>

      <section>
        <h2>Dashboard</h2>
        <div class="endpoint"><span class="method">GET</span><span class="path">/api/v1/dashboard</span></div>
        <p>Returns learner level, rank, XP, streak, security score, and completed challenge count.</p>
      </section>

      <section>
        <h2>AI Generation</h2>
        <div class="endpoint"><span class="method">POST</span><span class="path">/api/v1/ai/challenges/generate</span></div>
        <p>Generates a safe phishing-awareness challenge without saving it. Allowed channels: <code>EMAIL</code>, <code>SMS</code>, <code>SOCIAL</code>. Allowed difficulty: <code>BEGINNER</code>, <code>INTERMEDIATE</code>, <code>ADVANCED</code>.</p>
        <pre>{"channel":"EMAIL","difficulty":"BEGINNER","targetAudience":"University students","theme":"scholarship verification"}</pre>
        <p>Response includes <code>lure</code>, <code>suspiciousIndicators</code>, <code>learningObjectives</code>, <code>scoringRules</code>, <code>explanation</code>, <code>safetyVerdict</code>, and <code>provider</code>.</p>
      </section>

      <section>
        <h2>Challenges</h2>
        <div class="grid">
          <div class="card">
            <div class="endpoint"><span class="method">GET</span><span class="path">/api/v1/challenges</span></div>
            <p>Lists saved challenges. With MongoDB enabled, the default starter challenges are seeded automatically when the collection is empty.</p>
          </div>
          <div class="card">
            <div class="endpoint"><span class="method">GET</span><span class="path">/api/v1/challenges/:id</span></div>
            <p>Returns one challenge by ID. Returns <code>404</code> when not found.</p>
          </div>
          <div class="card">
            <div class="endpoint"><span class="method">POST</span><span class="path">/api/v1/challenges</span></div>
            <p>Creates a simple challenge manually.</p>
            <pre>{"title":"Bank Login Alert","type":"EMAIL","difficulty":"BEGINNER","status":"AVAILABLE"}</pre>
          </div>
          <div class="card">
            <div class="endpoint"><span class="method">POST</span><span class="path">/api/v1/challenges/generate</span></div>
            <p>Generates a challenge and saves it as <code>DRAFT</code> or <code>AVAILABLE</code>.</p>
            <pre>{"channel":"SMS","difficulty":"INTERMEDIATE","targetAudience":"College students","theme":"delivery fee","status":"AVAILABLE"}</pre>
          </div>
        </div>
      </section>

      <section>
        <h2>Sessions</h2>
        <div class="endpoint"><span class="method">POST</span><span class="path">/api/v1/sessions/:challengeId/start</span></div>
        <p>Starts a learner challenge session.</p>
        <div class="endpoint"><span class="method">POST</span><span class="path">/api/v1/sessions/:sessionId/actions</span></div>
        <p>Records an action and returns <code>SAFE</code>, <code>RISKY</code>, or <code>NEUTRAL</code> scoring feedback.</p>
        <pre>{"actionType":"REPORT_MESSAGE","target":"https://delivery-fee-verify.example/check","metadata":{"channel":"SMS"}}</pre>
        <p>Allowed actions:</p>
        <ul>
          <li><code>OPEN_LINK</code></li>
          <li><code>SUBMIT_SECRET</code></li>
          <li><code>REPORT_MESSAGE</code></li>
          <li><code>BLOCK_SENDER</code></li>
          <li><code>MARK_SAFE</code></li>
          <li><code>ARCHIVE</code></li>
          <li><code>REPLY</code></li>
          <li><code>DOWNLOAD_ATTACHMENT</code></li>
        </ul>
      </section>

      <section>
        <h2>Smoke Test</h2>
        <pre>cd backend
PORT=4000 npm run start

curl -s http://127.0.0.1:4000/api/v1/challenges

curl -s -X POST http://127.0.0.1:4000/api/v1/ai/challenges/generate \\
  -H 'Content-Type: application/json' \\
  -d '{"channel":"EMAIL","difficulty":"BEGINNER","targetAudience":"University students","theme":"scholarship verification"}'</pre>
      </section>
    </main>
  </body>
</html>`;
