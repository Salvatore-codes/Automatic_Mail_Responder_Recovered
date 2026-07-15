"""Production server entrypoint (no auto-reload — reload spawns a child process
that pm2 can't supervise cleanly). Use run_server.py for local dev with reload."""
import uvicorn

if __name__ == "__main__":
    uvicorn.run("src.server:app", host="127.0.0.1", port=8085, reload=False)
