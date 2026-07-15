import uvicorn

if __name__ == "__main__":
    print("[System] Starting Trofeo Hardware Quotation Server...")
    print("         Open http://127.0.0.1:8085 in your browser to access the dashboard.")
    uvicorn.run("src.server:app", host="127.0.0.1", port=8085, reload=True)
