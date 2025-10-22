# Personal Site

The backing for https://pawa.lt

## Tech Stack

- **Static Site Generator:** Hugo v0.70.0
- **Theme:** hello-friend-ng
- **Static Hosting:** Netlify
- **API/Backend:** Modal (Python/FastAPI)
- **Storage:** JSON file on Modal volume

## Quick Start

### Install Hugo Extended v0.70.0

This project requires Hugo Extended (with SCSS support). Install to `~/bin`:

```bash
# Download and install Hugo Extended
curl -L https://github.com/gohugoio/hugo/releases/download/v0.70.0/hugo_extended_0.70.0_Linux-64bit.tar.gz -o /tmp/hugo.tar.gz
cd /tmp && tar -xzf hugo.tar.gz
mkdir -p ~/bin
mv hugo ~/bin/hugo
chmod +x ~/bin/hugo

# Verify installation
~/bin/hugo version
# Should output: Hugo Static Site Generator v0.70.0-7F47B99E/extended linux/amd64
```

**Note:** The "extended" version is required for SCSS compilation used by the theme.

### Build Static Site
```bash
~/bin/hugo --gc --minify
```

### Deploy Kudos API
```bash
# First time setup
pip install modal
modal token new

# Deploy
modal deploy modal_kudos.py
```

See [QUICKSTART.md](QUICKSTART.md) for detailed deployment instructions.

## Documentation

- **[AGENTS.md](AGENTS.md)** - Complete project structure documentation
- **[MODAL_DEPLOYMENT.md](MODAL_DEPLOYMENT.md)** - Modal API deployment guide
- **[QUICKSTART.md](QUICKSTART.md)** - Quick reference for deployment
- **[MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md)** - FaunaDB → Modal migration details

## Local Development

```bash
# Start Hugo dev server
~/bin/hugo server

# Test Modal API locally (optional)
modal serve modal_kudos.py
```

**Tip:** Add `~/bin` to your PATH to use `hugo` directly:
```bash
export PATH="$HOME/bin:$PATH"
```

## Project Structure

```
personal-site/
├── content/          # Markdown content (posts, recipes, etc.)
├── layouts/          # Hugo template overrides
├── static/           # Static assets (images, etc.)
├── themes/           # Hugo theme (hello-friend-ng)
├── modal_kudos.py    # Kudos API backend
├── config.toml       # Hugo configuration
└── netlify.toml      # Netlify build configuration
```

See [AGENTS.md](AGENTS.md) for complete project structure.
