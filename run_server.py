import uvicorn

if __name__ == "__main__":
    print("[System] Starting Trofeo Hardware Quotation Server...")
    print("         Access Dashboard at http://192.168.10.169:8085 or http://localhost:8085")
    uvicorn.run("src.server:app", host="0.0.0.0", port=8085, reload=True)
