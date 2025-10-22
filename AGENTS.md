# Personal Site - Project Structure Documentation

## Overview

**Project Type:** Static Site with Serverless Backend
**Main Technology:** Hugo (Static Site Generator)
**Deployment:** Netlify (static) + Modal (API)
**URL:** https://pawa.lt
**Author:** Peyton Walters

This is a personal website combining Hugo's static site generation with a Modal web endpoint for backend functionality. The kudos system uses JSON file persistence on a Modal volume.

---

## Technology Stack

### Frontend/Static Content
- **Hugo v0.70.0** - Static site generator
- **Theme:** hello-friend-ng
- **Markup:** Markdown with Goldmark renderer
- **Syntax Highlighting:** Pygments with code fences

### Backend/API
- **Platform:** Modal (modal.com)
- **Runtime:** Python 3.11+ with FastAPI
- **Storage:** JSON file on Modal volume
- **Concurrency:** 1 container max
- **Endpoints:** `/get-kudos`, `/add-kudos`

### Build & Deployment
- **Platform:** Netlify (static hosting only)
- **Build Command:** `hugo --gc --minify`
- **Output Directory:** `public/`
- **API Deployment:** `modal deploy modal_kudos.py`

---

## Directory Structure

```
personal-site/
├── archetypes/                 # Hugo content templates
│   └── recipes.md             # Template for creating new recipes
│
├── content/                   # All site content (Markdown)
│   ├── about.md              # About page
│   ├── braindump/            # Quick thoughts/notes (~18 files)
│   ├── posts/                # Blog articles (~30+ markdown files)
│   ├── recipes/              # Recipe content with images
│   │   ├── _index.md
│   │   ├── fish-tacos/
│   │   ├── grilled-chicken-salad.md
│   │   ├── lemon-garlic-mahi/
│   │   ├── oyakomelette.md
│   │   ├── pan-potatoes/
│   │   └── ai_*.md           # AI-generated recipes
│   └── groupmatcher.md       # Special project page
│
├── data/                      # Static data files
│   └── recipes/              # Recipe metadata (JSON)
│       ├── country_fair_lemonade.json
│       └── quick_shredded_chicken.json
│
├── modal_kudos.py            # Modal web endpoint for kudos API
├── requirements.txt          # Python dependencies for Modal
├── MODAL_DEPLOYMENT.md       # Modal deployment documentation
├── functions.old/            # Old Netlify functions (deprecated, can be deleted)
│
├── layouts/                   # Hugo template overrides
│   ├── _default/
│   │   └── rss.xml          # Custom RSS feed template
│   ├── groupmatcher/
│   │   └── single.html      # Groupmatcher project page template
│   ├── recipes/
│   │   └── single.html      # Recipe display template
│   ├── partials/
│   │   ├── head.html        # HTML head partial
│   │   ├── footer.html      # Footer partial
│   │   └── twitter_cards.html # Twitter card meta tags
│   └── shortcodes/          # Custom Hugo shortcodes
│       ├── ai_recipe.html
│       ├── clear.html
│       ├── gallery.html
│       └── ingredients.html # Recipe ingredients display
│
├── static/                    # Static assets (copied as-is)
│   ├── artifacts/           # Project artifacts
│   ├── img/                 # Images (avatars, etc.)
│   ├── yongpt/              # YongPT project files
│   ├── favicon*             # Favicon variants
│   ├── android-chrome-*.png # PWA icons
│   ├── twitter-logo.png
│   └── google*.html         # Google verification
│
├── themes/                    # Hugo themes
│   └── hello-friend-ng/      # Primary theme (external)
│
├── config.toml               # Hugo main configuration
├── netlify.toml             # Netlify build & deploy config
├── package.json             # NPM dependencies (empty - no longer needed)
├── package-lock.json        # NPM lock file
├── README.md                # Project documentation
└── AGENTS.md                # This file - project structure docs
```

---

## Key Configuration Files

### config.toml
Hugo's main configuration file.

**Key Settings:**
- **Base URL:** https://pawa.lt/
- **Theme:** hello-friend-ng
- **Custom Taxonomies:** categories, tags, ingredients, groups
- **Permalinks:** Posts use `/posts/:year/:month/:title/` pattern
- **Features:**
  - Pygments syntax highlighting
  - Goldmark markdown renderer with unsafe HTML enabled
  - Fractions disabled (preserves IP notation like 192.168.2.4/30)
- **Social Links:** Email, GitHub, Twitter, LinkedIn

### netlify.toml
Netlify deployment configuration.

**Configuration:**
- **Publish Directory:** `public/`
- **Build Command:** `npm install && hugo --gc --minify`
- **Functions Directory:** `functions/`
- **Hugo Version:** v0.70.0 (pinned)
- **Dev Command:** `hugo server --baseUrl=http://localhost:8888/`

### package.json
NPM configuration and dependencies.

**Dependencies:**
- `faunadb: ^4.8.0` - FaunaDB client for serverless functions

---

## Content Types

### 1. Blog Posts
**Location:** `/content/posts/`
**Count:** ~30+ articles
**Topics:** Infrastructure, Networking, Linux, Programming, Projects
**Permalink Pattern:** `/posts/YEAR/MONTH/TITLE/`

**Examples:**
- building-icarus
- caplance-dev-update-*
- finding-voice
- golinks
- hacking-farkle

### 2. Braindump
**Location:** `/content/braindump/`
**Count:** ~18 entries
**Purpose:** Quick thoughts and notes

**Examples:**
- nix.md
- ollama.md
- spacemacs-pilled.md
- scalable-tutors.md

### 3. Recipes
**Location:** `/content/recipes/`
**Format:** Markdown files (can reference JSON metadata from `/data/recipes/`)
**Features:**
- Custom shortcodes for ingredients and galleries
- AI-generated recipe support via `{{< ai_recipe >}}` shortcode
- Recipe images stored alongside content

**Examples:**
- fish-tacos/
- oyakomelette.md
- lemon-garlic-mahi/

### 4. Special Pages
- `/about` - Author biography
- `/groupmatcher` - Special project page with custom layout
- `/recipes` - Recipe listing index

---

## Modal Kudos API

The kudos system runs as a Modal web endpoint (see [MODAL_DEPLOYMENT.md](MODAL_DEPLOYMENT.md) for details).

### Architecture
- **Platform:** Modal (modal.com)
- **File:** `modal_kudos.py`
- **Storage:** JSON file at `/data/kudos.json` on Modal volume
- **Max Containers:** 1 (prevents race conditions)
- **Scaledown Window:** 5 minutes

### Endpoints

#### GET /get-kudos
**Purpose:** Retrieve kudos count for a post
**Parameters:**
- `post` - Post title (query param)
- `user` - User UUID (query param)

**Returns:**
```json
{
  "numClicked": 5,
  "userClicked": true
}
```

#### GET /add-kudos
**Purpose:** Add a kudos to a post (idempotent)
**Parameters:**
- `post` - Post title (query param)
- `user` - User UUID (query param)

**Returns:**
```json
{
  "status": "ok"
}
```

### Data Format
Kudos data is stored as JSON:
```json
{
  "post-name": ["user-uuid-1", "user-uuid-2"],
  "another-post": ["user-uuid-3"]
}
```

---

## Build & Deployment Pipeline

### Static Site
1. **Build Static Site:** `hugo --gc --minify`
   - Processes Markdown content
   - Applies theme templates
   - Minifies output
   - Runs garbage collection
2. **Output:** Generated files in `public/` directory
3. **Deploy:** Netlify automatically deploys from `public/`

### Kudos API
1. **Deploy to Modal:** `modal deploy modal_kudos.py`
2. **URL:** `https://pawalt--kudos-api-web.modal.run`
3. **Storage:** Data persists on Modal volume `kudos-data`

---

## Hugo Customizations

### Custom Shortcodes
Located in `/layouts/shortcodes/`:

- **`ai_recipe.html`** - Displays AI-generated recipe disclaimer
- **`clear.html`** - CSS clear utility
- **`gallery.html`** - Image gallery display
- **`ingredients.html`** - Formatted ingredient lists

### Custom Layouts
Located in `/layouts/`:

- **`recipes/single.html`** - Custom recipe page template
- **`groupmatcher/single.html`** - Custom project page template
- **`_default/rss.xml`** - Custom RSS feed

### Partials
Located in `/layouts/partials/`:

- **`head.html`** - Custom HTML head section
- **`footer.html`** - Custom footer
- **`twitter_cards.html`** - Twitter/social media meta tags

---

## Static Assets

**Location:** `/static/` (copied to output as-is)

### Branding & Icons
- Avatar images
- Favicon (multiple sizes)
- PWA icons (android-chrome-192x192.png, android-chrome-512x512.png)
- Apple touch icon
- Twitter logo

### Project Files
- `/artifacts/` - Project-specific files
- `/yongpt/` - YongPT project files

### Meta Files
- Google Search Console verification HTML

---

## Development Workflow

### Local Development
```bash
# Start Hugo dev server
hugo server

# Test Modal API locally (optional)
modal serve modal_kudos.py
# Available at http://localhost:8000
```

### Content Creation
```bash
# Create new blog post
hugo new posts/my-new-post.md

# Create new recipe (uses archetype)
hugo new recipes/my-recipe.md
```

### Deploy Kudos API
```bash
# Install Modal CLI
pip install modal

# Authenticate with Modal
modal token new

# Deploy the API
modal deploy modal_kudos.py
```

---

## Notable Patterns & Principles

1. **Markdown-Centric Content:** All content stored as Markdown with TOML/YAML frontmatter
2. **Data-Driven Sections:** Recipes can use JSON metadata from `/data/recipes/`
3. **Serverless Interactivity:** FaunaDB provides real-time features (kudos system)
4. **Progressive Web App:** PWA capabilities with multiple icon sizes
5. **SEO Optimized:**
   - Custom RSS feed
   - Twitter card meta tags
   - Robots.txt support
   - Clean permalink structure
6. **Custom Taxonomies:** Beyond standard tags/categories, includes ingredients and groups
7. **Reusable Components:** Hugo shortcodes for common UI patterns
8. **Version Control:** Project uses Jujutsu (`.jj/` directory) alongside Git

---

## Entry Points

- **Main Configuration:** `config.toml`
- **Build Configuration:** `netlify.toml`
- **Content Root:** `content/`
- **Theme:** `themes/hello-friend-ng/`
- **Kudos API:** `modal_kudos.py`
- **Static Assets:** `static/`

---

## Dependencies

### Python (requirements.txt)
- `modal>=0.63.0` - Modal platform SDK

### Hugo
- Version: v0.70.0 (specified in netlify.toml)

### External Services
- **Netlify** - Static site hosting
- **Modal** - Kudos API hosting

---

## Future Development Notes

- Theme is external (`hello-friend-ng`), updates may require testing
- Hugo version is pinned to v0.70.0, upgrades should be tested carefully
- Modal API uses single container - consider scaling if traffic increases
- Recipe JSON schema is informal, could benefit from validation
- Consider adding rate limiting to kudos API
- Old `functions.old/` directory can be safely deleted once migration is verified
