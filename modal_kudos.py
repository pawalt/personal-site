"""
Modal web endpoint for kudos tracking.
Replaces FaunaDB + Netlify functions with a simple JSON file on Modal volume.
"""
import json
import os
from pathlib import Path
from typing import Dict, List

import modal

# Create Modal app
app = modal.App("kudos-api")

# Create a persistent volume for storing kudos data
volume = modal.Volume.from_name("kudos-data", create_if_missing=True)
VOLUME_PATH = "/data"
KUDOS_FILE = f"{VOLUME_PATH}/kudos.json"

# Create Modal image with required dependencies
image = modal.Image.debian_slim().pip_install("fastapi")


def load_kudos() -> Dict[str, List[str]]:
    """Load kudos data from JSON file."""
    if os.path.exists(KUDOS_FILE):
        try:
            with open(KUDOS_FILE, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return {}
    return {}


def save_kudos(data: Dict[str, List[str]]) -> None:
    """Save kudos data to JSON file."""
    # Ensure directory exists
    os.makedirs(VOLUME_PATH, exist_ok=True)

    with open(KUDOS_FILE, 'w') as f:
        json.dump(data, f, indent=2)


@app.function(
    image=image,
    volumes={VOLUME_PATH: volume},
    min_containers=1,  # Keep 1 container always running (no cold starts)
    max_containers=1,  # Max 1 container as requested
    scaledown_window=300,  # 5 minutes
)
@modal.asgi_app()
def web():
    """FastAPI web endpoint for kudos API."""
    from fastapi import FastAPI, Query
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import JSONResponse

    web_app = FastAPI()

    # Enable CORS for frontend
    web_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # In production, specify your domain
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @web_app.get("/")
    async def root():
        """Health check endpoint."""
        return {"status": "ok", "service": "kudos-api"}

    @web_app.get("/get-kudos")
    async def get_kudos(
        post: str = Query(..., description="Post name/title"),
        user: str = Query(..., description="User UUID")
    ):
        """
        Get kudos count for a post and whether the user has clicked.

        Query Parameters:
            post: Post name/title (required)
            user: User UUID (required)

        Returns:
            {
                "numClicked": int,      # Total number of kudos
                "userClicked": bool     # Whether this user has clicked
            }
        """
        # Load kudos data
        kudos_data = load_kudos()

        # Get users who clicked kudos for this post
        users = kudos_data.get(post, [])

        return JSONResponse({
            "numClicked": len(users),
            "userClicked": user in users
        })

    @web_app.get("/add-kudos")
    async def add_kudos(
        post: str = Query(..., description="Post name/title"),
        user: str = Query(..., description="User UUID")
    ):
        """
        Add a kudos to a post for a specific user.

        Query Parameters:
            post: Post name/title (required)
            user: User UUID (required)

        Returns:
            Empty response with 200 status
        """
        # Load kudos data
        kudos_data = load_kudos()

        # Get or create users list for this post
        if post not in kudos_data:
            kudos_data[post] = []

        # Add user if not already in list
        if user not in kudos_data[post]:
            kudos_data[post].append(user)

            # Save updated data
            save_kudos(kudos_data)

            # Commit volume changes
            volume.commit()

        return JSONResponse({"status": "ok"})

    return web_app


# For local testing
if __name__ == "__main__":
    # Test the kudos functions locally
    print("Testing kudos API...")

    # This would be run with: modal serve modal_kudos.py
    # Or deployed with: modal deploy modal_kudos.py
