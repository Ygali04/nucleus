# CI/CD

This page describes how Nucleus code goes from a developer's laptop to
production. The pipeline is intentionally simple: GitHub → tests →
preview environment → production. No staging-vs-canary-vs-production
ladder, no blue-green deploys for the engine itself (the host product
shell handles user-facing rollout).

## Repo structure

The Nucleus codebase lives in a single repo with two top-level
deployable services and one shared library.

```
nucleus/
├── README.md
├── pyproject.toml                    # Poetry-managed Python project
├── docker-compose.yml                # Local dev stack
├── Dockerfile.api                    # API service image
├── Dockerfile.worker                 # Celery worker image
├── docs/                             # mkdocs site (this site)
├── mkdocs.yml
├── nucleus/                          # The Python package
│   ├── __init__.py
│   ├── api/                          # FastAPI app
│   │   ├── main.py
│   │   ├── routes/
│   │   ├── deps.py                   # auth, tenant context dependencies
│   │   └── middleware/
│   ├── worker/                       # Celery tasks
│   │   ├── tasks.py
│   │   ├── beat.py                   # Celery beat schedule
│   │   └── celery_app.py
│   ├── orchestrator/                 # The state machine
│   │   ├── state_machine.py
│   │   ├── stop_conditions.py
│   │   └── plan_expander.py
│   ├── agents/
│   │   ├── generator/
│   │   ├── editor/
│   │   ├── strategist/
│   │   └── base.py
│   ├── analyzer/                     # Pluggable scoring backends
│   │   ├── base.py
│   │   ├── tribe_v2.py
│   │   ├── attention_proxy.py
│   │   └── behavioral_proxy.py
│   ├── compositors/                  # Render layers
│   │   ├── remotion/
│   │   ├── manim/
│   │   └── ffmpeg_helpers.py
│   ├── providers/                    # External API clients
│   │   ├── elevenlabs.py
│   │   ├── veo.py
│   │   ├── heygen.py
│   │   ├── tavus.py
│   │   ├── lyria.py
│   │   └── base.py
│   ├── kb/                           # Brand KB ingestion + RAG
│   │   ├── ingestion.py
│   │   ├── rag.py
│   │   └── connectors/
│   ├── db/
│   │   ├── models.py
│   │   ├── migrations/
│   │   └── session.py
│   ├── observability/
│   │   ├── logging.py
│   │   ├── metrics.py
│   │   └── tracing.py
│   ├── config.py
│   └── exceptions.py
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── conftest.py
├── scripts/
│   ├── seed_dev_tenant.py
│   ├── recompute_costs.py
│   └── inspect_dlq.py
└── .github/
    └── workflows/
        ├── test.yml
        ├── deploy-staging.yml
        ├── deploy-production.yml
        └── deploy-docs.yml            # already exists, deploys this mkdocs site
```

## Local development

Developers run the full stack with one command:

```bash
docker-compose up
```

`docker-compose.yml` brings up:

- Postgres 16 with pgvector
- Redis 7
- MinIO (S3-compatible)
- Nucleus API (hot-reload)
- Nucleus worker (1 of each queue type)
- Celery beat
- Mock provider services for offline development

The mock providers return canned responses for ElevenLabs, Veo, Lyria,
HeyGen, and the NeuroPeer scorer. This lets developers run the full
loop without burning real provider credits.

## Test pyramid

| Layer | Count | Speed | Coverage scope |
|---|---|---|---|
| Unit | thousands | < 5s total | Pure functions, schemas, state machine logic |
| Integration | hundreds | < 60s total | DB + Redis + S3 (using testcontainers) |
| E2E | tens | 5–15 min total | Full loop against mock providers |
| Smoke (post-deploy) | < 10 | < 30s | Live production endpoint health |

### Unit tests

Pure logic, no I/O. Use pytest with strict markers:

```python
@pytest.mark.unit
def test_stop_condition_max_iterations():
    decision = StopConditions.evaluate(
        score_composite=68.0,
        score_threshold=72.0,
        iteration_index=5,
        max_iterations=5,
        ...
    )
    assert decision == StopDecision.MAX_ITERATIONS
```

### Integration tests

Spin up Postgres, Redis, MinIO via testcontainers. Run real DB
migrations, real RLS policies, real S3 puts/gets. Mock external
providers.

```python
@pytest.mark.integration
async def test_candidate_lifecycle(test_db, test_s3):
    tenant = await create_test_tenant(test_db)
    job = await submit_brief(tenant.id, sample_brief())
    candidate = job.candidates[0]
    await run_to_completion(candidate.id)
    assert candidate.status == "delivered"
    assert candidate.iterations.count() >= 1
```

### E2E tests

Run the full loop end-to-end against the mock provider stack. The
result is a delivered variant + a neural report + a GTM guide. Assert
on the structure of the output.

```python
@pytest.mark.e2e
async def test_full_loop_marketing_archetype(e2e_stack):
    job_id = await e2e_stack.submit_brief(MARKETING_BRIEF)
    await e2e_stack.wait_for_job_completion(job_id, timeout=300)
    job = await e2e_stack.get_job(job_id)
    assert job.status == "complete"
    assert all(c.status in ("delivered", "failed") for c in job.candidates)
    assert any(c.status == "delivered" for c in job.candidates)
```

E2E tests run on every PR but are tagged so they can be skipped for
trivial changes.

### Coverage requirements

The CI pipeline enforces minimum coverage:

| Module | Minimum coverage |
|---|---|
| `nucleus/orchestrator/` | 95% |
| `nucleus/agents/` | 85% |
| `nucleus/api/` | 90% |
| `nucleus/db/` | 85% |
| `nucleus/providers/` | 70% (mocked, hard to fully cover) |
| Overall | 85% |

## CI pipeline

GitHub Actions runs on every push and PR.

```yaml
name: Test
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
      - run: pip install ruff black mypy
      - run: ruff check nucleus tests
      - run: ruff format --check nucleus tests
      - run: mypy nucleus

  unit:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
      - run: pip install -e ".[test]"
      - run: pytest tests/unit -m unit --cov=nucleus --cov-fail-under=85

  integration:
    runs-on: ubuntu-latest
    needs: unit
    services:
      postgres:
        image: postgres:16
      redis:
        image: redis:7
      minio:
        image: minio/minio
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
      - run: pip install -e ".[test]"
      - run: alembic upgrade head
      - run: pytest tests/integration -m integration

  e2e:
    runs-on: ubuntu-latest
    needs: integration
    steps:
      - uses: actions/checkout@v4
      - run: docker-compose -f docker-compose.test.yml up -d
      - run: pytest tests/e2e -m e2e --maxfail=1
      - run: docker-compose -f docker-compose.test.yml down
```

CI must pass before a PR can be merged. No exceptions.

## Preview environments

Every PR gets a preview environment on Railway.

```yaml
name: Deploy preview
on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: railwayapp/railway-deploy@v3
        with:
          service: nucleus-preview-pr-${{ github.event.pull_request.number }}
          token: ${{ secrets.RAILWAY_TOKEN }}
      - run: |
          curl -X POST "https://api.github.com/repos/${{ github.repository }}/issues/${{ github.event.pull_request.number }}/comments" \
            -H "Authorization: token ${{ secrets.GITHUB_TOKEN }}" \
            -d '{"body":"Preview deployed: https://nucleus-preview-pr-${{ github.event.pull_request.number }}.up.railway.app"}'
```

Preview environments use a shared scratch Postgres + Redis + MinIO
instance, isolated by Postgres schema and S3 prefix. They auto-tear-down
when the PR closes.

## Deploy to production

Production deploys are triggered manually from a release tag.

```yaml
name: Deploy production
on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - run: |
          alembic upgrade head
        env:
          DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
      - uses: railwayapp/railway-deploy@v3
        with:
          service: nucleus-api
          token: ${{ secrets.RAILWAY_TOKEN }}
      - uses: railwayapp/railway-deploy@v3
        with:
          service: nucleus-worker
          token: ${{ secrets.RAILWAY_TOKEN }}
      - run: ./scripts/smoke_test.sh
        env:
          NUCLEUS_API_URL: https://api.nucleus.dev
      - if: failure()
        run: ./scripts/rollback.sh
```

Production deploys gate on:

1. Manual approval by a release maintainer
2. All CI tests passing on the tagged commit
3. Database migrations applying cleanly to a fresh test instance first
4. Post-deploy smoke tests passing

If smoke tests fail, the deploy auto-rolls back to the previous
release.

## Database migrations

Migrations live in `nucleus/db/migrations/` and use Alembic.

### Migration rules

1. Every migration must be reversible (`upgrade()` and `downgrade()`)
2. Every migration must work against an empty database AND against the
   previous production schema
3. Schema changes that drop columns or tables require a two-deploy
   ladder: deploy 1 stops writing to the column, deploy 2 drops it
4. Migrations are committed to source control as PR #1, application
   code that depends on the schema as PR #2

### Migration testing

Every PR's CI runs:

```bash
alembic upgrade head     # apply all migrations to a fresh DB
alembic downgrade base   # roll back all migrations
alembic upgrade head     # re-apply
```

If any of these fails, the PR is blocked.

## Release versioning

Semver: `MAJOR.MINOR.PATCH`.

| Bump | When |
|---|---|
| MAJOR | Breaking API changes (rare; we prefer to deprecate-then-remove over a deprecation cycle) |
| MINOR | New features, new edit primitives, new archetypes, schema additions |
| PATCH | Bug fixes, dependency updates, documentation |

Release notes auto-generate from PR titles via a GitHub Action and are
published to the docs site under `/changelog`.

## Rollback strategy

Three layers of rollback:

| Layer | Tool | Time to rollback |
|---|---|---|
| Code | Railway "Roll Back to Previous Deploy" | < 30 seconds |
| Database | Manual `alembic downgrade -1` (only safe for the most recent migration) | < 5 minutes |
| Database (older) | Restore from snapshot | 1–4 hours |

Production deploys are tagged so we always know which database
migration version corresponds to which code commit.

## Secrets in CI

CI secrets live in GitHub Actions environment secrets and are scoped
per environment (preview, production). Production secrets are never
visible to PR-triggered workflows; only manually-tagged release
workflows can read them.

Provider keys, signing keys, database URLs, and S3 credentials all
follow the same pattern. The application reads them from environment
variables at boot, never from code.

See [security → secret management](security.md#secret-management) for
more.
