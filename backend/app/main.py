
import json
import subprocess
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

PROJECT_ROOT = Path(__file__).resolve().parents[2]

app = FastAPI(title="HackLab API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Только эти сервисы разрешено контролировать через API.
ALLOWED_SERVICES = {
    "juice-shop",
    "webgoat",
}

ACTIONS = {
    "start": ["up", "-d"],
    "stop": ["stop"],
    "restart": ["restart"],
}


def run_docker(args: list[str], timeout: int = 60):
    try:
        return subprocess.run(
            ["docker", "compose", *args],
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=True,
        )
    except subprocess.TimeoutExpired as exc:
        raise HTTPException(
            status_code=504,
            detail="Docker operation timed out",
        ) from exc
    except subprocess.CalledProcessError as exc:
        raise HTTPException(
            status_code=503,
            detail="Docker operation failed",
        ) from exc


@app.get("/api/health")
def health():
    return {"status": "online", "name": "HackLab API"}


@app.get("/api/labs")
def labs():
    result = run_docker(["ps", "--format", "json"], timeout=10)

    containers = []

    for line in result.stdout.splitlines():
        if not line.strip():
            continue

        try:
            item = json.loads(line)
            containers.append({
                "name": item.get("Name", "unknown"),
                "service": item.get("Service", "unknown"),
                "state": item.get("State", "unknown"),
                "status": item.get("Status", "unknown"),
                "ports": item.get("Publishers", []),
            })
        except json.JSONDecodeError:
            continue

    return {
        "count": len(containers),
        "containers": containers,
    }


@app.post("/api/labs/{service}/{action}")
def control_lab(service: str, action: str):
    if service not in ALLOWED_SERVICES:
        raise HTTPException(
            status_code=404,
            detail="Unknown laboratory",
        )

    if action not in ACTIONS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported action",
        )

    command = [*ACTIONS[action], service]
    result = run_docker(command)

    return {
        "success": True,
        "service": service,
        "action": action,
        "output": result.stdout.strip(),
    }

