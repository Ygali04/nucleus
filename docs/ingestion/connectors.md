# Connectors

A Brand KB is only as useful as the sources it ingests. Nucleus
ships with a small but high-coverage set of connectors that pull
from the places brands actually keep their knowledge.

## The connector list

| Connector | Source | Auth | Push or pull |
|---|---|---|---|
| **PDF / Markdown upload** | Direct file upload | n/a | Push |
| **URL crawler** | Public web pages, sitemaps | n/a | Pull (24h cadence) |
| **Notion** | Notion workspace | OAuth | Pull (1h cadence) |
| **Confluence** | Atlassian Cloud / Server | OAuth or API token | Pull (24h cadence) |
| **Google Drive** | Google Drive folder | OAuth | Pull (24h cadence) |
| **GitHub** | Repo README + wiki + docs | GitHub App | Pull (commit-driven webhook) |
| **TruPeer MCP** | TruPeer's existing knowledge base | OAuth via host | Pull on demand |
| **Custom HTTP** | Any HTTPS endpoint that returns documents | Bearer token | Pull (configurable cadence) |

## Connector design

Every connector implements the same Protocol:

```python
class BrandKBConnector(Protocol):
    name: str
    auth_type: AuthType                      # 'none' | 'oauth' | 'api_key' | 'mcp'

    async def list_documents(
        self,
        config: ConnectorConfig,
    ) -> list[DocumentRef]: ...

    async def fetch_document(
        self,
        ref: DocumentRef,
        config: ConnectorConfig,
    ) -> RawDocument: ...

    async def detect_changes(
        self,
        config: ConnectorConfig,
        since: datetime,
    ) -> list[DocumentRef]: ...
```

The orchestrator's ingestion task calls `list_documents()` once,
`fetch_document()` per new or changed document, and `detect_changes()`
on the configured cadence to keep the KB fresh.

## PDF / Markdown upload

The simplest connector. The host UI exposes a file upload widget;
files arrive at the Nucleus API as multipart form data; the
orchestrator parses, chunks, embeds, and indexes them.

| Property | Value |
|---|---|
| Supported formats | PDF, Markdown, plain text, .docx |
| Max file size | 500 MB per file (Starter), 2 GB (Growth), unlimited (Enterprise) |
| Parsing library | `unstructured` for PDFs, `markdown` for Markdown |
| OCR for image-only PDFs | `unstructured` with Tesseract fallback |
| Output | One `kb_documents` row per file |

For PDFs with embedded images, the parser extracts the text but
discards the images. Image-grounded retrieval is a future feature
(see [research roadmap](../research/research-roadmap.md)).

## URL crawler

For brands that want to ingest their own marketing site without
manual export.

```python
class URLCrawlerConfig(ConnectorConfig):
    seed_urls: list[str]
    max_depth: int = 3
    same_domain_only: bool = True
    include_patterns: list[str] = []
    exclude_patterns: list[str] = []
    respect_robots_txt: bool = True
    crawl_cadence_hours: int = 24
```

The crawler walks the seed URLs, respects robots.txt, follows
internal links to the configured depth, and emits one `DocumentRef`
per crawled page. Page content is extracted via `trafilatura` which
strips chrome and ads while preserving meaningful content.

For sites with sitemaps, the crawler reads the sitemap directly
instead of crawling, which is faster and more polite.

The crawler runs on a schedule (default 24h) and the KB picks up
changes incrementally.

## Notion

```python
class NotionConfig(ConnectorConfig):
    workspace_id: str
    page_ids: list[str] = []                # specific pages, or...
    database_ids: list[str] = []            # ...specific databases
    auth_token: SecretRef                   # OAuth-issued token, stored encrypted
```

The Notion connector uses the Notion REST API. It supports:

- Specific pages
- Entire databases
- Recursive child page traversal
- Block-level change detection (Notion's API exposes
  `last_edited_time`)

Authentication is via Notion's OAuth flow. The host product surfaces
a "Connect Notion" button that walks the tenant through the OAuth
consent screen. The resulting token is stored encrypted in the
secret manager and referenced by `auth_token`.

## Confluence

```python
class ConfluenceConfig(ConnectorConfig):
    base_url: str                            # 'https://acme.atlassian.net/wiki'
    space_keys: list[str]
    auth_type: str                           # 'oauth' | 'api_token'
    auth_token: SecretRef
```

Atlassian's REST API exposes Confluence content. The connector
supports:

- Specific spaces
- Specific page hierarchies
- Page property metadata (used for tagging)
- Markdown export of page content

Authentication is via OAuth (preferred) or API token. The connector
respects Confluence's permission model — only pages the connecting
user can see are ingested.

## Google Drive

```python
class GoogleDriveConfig(ConnectorConfig):
    folder_ids: list[str]
    file_types: list[str] = ['pdf', 'docx', 'gdoc', 'md']
    recursive: bool = True
    auth_token: SecretRef                    # OAuth refresh token
```

The Drive connector ingests files from one or more folders. Google
Docs are converted to Markdown via the Drive Export API; PDFs and
Word docs are downloaded directly.

Authentication via Google OAuth. The host UI walks the tenant
through the consent screen.

## GitHub

```python
class GitHubConfig(ConnectorConfig):
    repos: list[str]                         # 'org/repo'
    paths: list[str] = ['README.md', 'docs/**', 'wiki/**']
    auth_app_id: str
```

The GitHub connector reads READMEs, docs directories, and wikis from
the configured repos. Authentication is via a GitHub App (the
"Nucleus Connector" app) that the tenant installs on their org.

The connector subscribes to commit webhooks, so KB updates are
near-real-time when source documents change.

## TruPeer MCP

This is the connector that makes Nucleus's first deployment fast for
existing TruPeer customers.

TruPeer ships an MCP (Model Context Protocol) server at
`https://api.trupeer.ai/mcp` that exposes two tools:

- `search_knowledge_base(query: str) -> list[DocumentSnippet]`
- `answer_query_from_knowledge_base(query: str) -> str`

```python
class TruPeerMCPConfig(ConnectorConfig):
    auth_type: str = 'oauth'
    auth_token: SecretRef                    # MCP OAuth token via host
```

The Nucleus connector queries the MCP server using the tenant's
existing TruPeer KB credentials, ingests the snippets returned by
the search tool, and indexes them in Nucleus's own Brand KB.

This means a TruPeer customer who already has a TruPeer KB
populated gets a usable Nucleus Brand KB with **zero re-upload work**.
The Nucleus connector is essentially a one-click bootstrap.

For tenants who don't have a TruPeer KB but do use TruPeer's screen-
recording library, the connector falls back to ingesting the
recordings' transcripts as KB documents.

## Custom HTTP

For tenants whose knowledge lives somewhere none of the standard
connectors cover (an internal CMS, a custom DAM, a proprietary
knowledge management system), the Custom HTTP connector accepts any
endpoint that returns documents in a known format.

```python
class CustomHTTPConfig(ConnectorConfig):
    list_endpoint: str                       # GET → list of DocumentRef
    fetch_endpoint: str                      # GET {ref.id} → RawDocument
    auth_type: str = 'bearer'
    auth_token: SecretRef
    response_format: str = 'json'            # 'json' | 'xml' | 'markdown'
    document_path: str = '$.documents[*]'    # JSONPath for the document list
```

This is the escape valve for tenants who can't use the standard
connectors. The fields are configured per tenant in the host UI.

## Connector reliability

Each connector has its own failure surface:

| Connector | Common failure | Mitigation |
|---|---|---|
| URL crawler | Site changes structure, breaks selector | Generic content extraction (trafilatura) is robust to most layout changes |
| Notion | Rate limits | Per-tenant throttling, exponential backoff |
| Confluence | Auth token expires | Refresh token flow, alert tenant on failure |
| Google Drive | OAuth scope changes (Google deprecates scopes) | Watch Google's deprecation list, request new scopes early |
| GitHub | Webhook delivery failures | Periodic poll fallback alongside webhooks |
| TruPeer MCP | TruPeer auth changes | Coordinate with TruPeer engineering, version the MCP endpoint |

Connector failures don't crash the engine. They surface as warnings
in the tenant's KB management UI ("Notion sync failed at 14:23, last
successful sync was 22 hours ago") and trigger an alert if they
persist for > 1 hour.

## Manual control

Tenants can:

- Trigger a manual re-sync of any connector
- Pause a connector temporarily
- Delete a connector entirely (which removes its documents from the
  KB)
- Override the polling cadence per connector
- Filter ingested documents by tag (e.g., "only ingest blog posts
  tagged 'product-launch'")

These controls live in the host product's KB management UI; Nucleus
exposes the API endpoints that the host's UI calls.

## What's intentionally not connected

A few sources we considered and rejected for v1:

| Source | Why not |
|---|---|
| Slack messages | Privacy / content sensitivity is too high; could leak internal strategy into a public ad |
| Email threads | Same |
| Salesforce records | Too noisy; better to ingest the artifacts (case studies) than the raw CRM data |
| HubSpot | Same |
| Zendesk tickets | Privacy concerns; could include customer PII |
| LinkedIn posts | Auth and rate-limit hostile |
| Twitter/X posts | Same |
| Discord messages | Same as Slack |

These can be added in future versions if a customer needs them.
None are blockers for v1.
