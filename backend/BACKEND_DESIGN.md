# PhishAware Backend Design

## Goal

The backend owns challenge generation, safe lure storage, session tracking, action scoring, and explanation payloads. The frontend should only consume verified API responses after the backend is tested independently.

## AI generation flow

1. Admin or system sends a generation request to `POST /api/v1/ai/challenges/generate`.
2. `AiGenerationService` validates the request and builds a defensive-only prompt.
3. If `GEMINI_API_KEY` is configured, `GeminiProviderService` calls Gemini `generateContent`.
4. If no key is configured, the service returns deterministic mock output with the same schema.
5. Output is normalized into a safe `GeneratedChallenge` contract.

## Save generated challenge

Use `POST /api/v1/challenges/generate` to generate and store a challenge as `DRAFT` or `AVAILABLE`.

The saved challenge contains:

- `simulationSpec`: channel, lure message, scenario summary, learning objectives, explanation.
- `scoringSpec`: safe actions, risky actions, max score.
- `suspiciousIndicators`: red flags shown after interaction.

## Session flow

1. Start session: `POST /api/v1/sessions/:challengeId/start`.
2. Record learner action: `POST /api/v1/sessions/:sessionId/actions`.
3. Backend evaluates the action as `SAFE`, `RISKY`, or `NEUTRAL`.
4. Response includes score, risk score, suspicious indicators, and the explanation payload.

## API endpoints

For complete request and response examples for every backend route, see `docs/BACKEND_API.md`.

### Generate without saving

`POST /api/v1/ai/challenges/generate`

```json
{
  "channel": "EMAIL",
  "difficulty": "BEGINNER",
  "targetAudience": "University students",
  "theme": "scholarship verification",
  "organizationName": "PhishAware",
  "learningObjectives": ["Inspect sender domain", "Check links before clicking"]
}
```

### Generate and save

`POST /api/v1/challenges/generate`

```json
{
  "channel": "SMS",
  "difficulty": "INTERMEDIATE",
  "targetAudience": "College students",
  "theme": "delivery fee",
  "status": "DRAFT"
}
```

### List challenges

`GET /api/v1/challenges`

### Start session

`POST /api/v1/sessions/:challengeId/start`

### Record action

`POST /api/v1/sessions/:sessionId/actions`

```json
{
  "actionType": "REPORT_MESSAGE",
  "target": "https://delivery-verify.example/check",
  "metadata": {
    "channel": "SMS"
  }
}
```

## Environment

Use `backend/.env.example` as the template.

`GEMINI_API_KEY` is optional during verification. Without it, the backend uses mock generation so routes can be tested safely without external calls.

## Frontend integration plan

Only after backend verification:

1. Replace frontend static challenge data with `GET /api/v1/challenges`.
2. Start simulated phone sessions with `POST /api/v1/sessions/:challengeId/start`.
3. Send phone actions to `POST /api/v1/sessions/:sessionId/actions`.
4. Render returned `result.explanation`, `result.suspiciousIndicators`, `score`, and `riskScore`.
