# Start Automatic Mail Responder Server at 10:00 AM
$pythonPath = "C:\Users\Admin\AppData\Local\Programs\Python\Python314\python.exe"
$workDir = "D:\sku-matcher-prototype"

# Check if server is already running on port 8085
$portUse = Get-NetTCPConnection -LocalPort 8085 -ErrorAction SilentlyContinue
if (-not $portUse) {
    Write-Host "[10:00 AM Cron] Starting Mail Responder Server on port 8085..."
    Start-Process -FilePath $pythonPath -ArgumentList "src/server.py" -WorkingDirectory $workDir -WindowStyle Hidden
    Write-Host "[10:00 AM Cron] Server started successfully."
} else {
    Write-Host "[10:00 AM Cron] Server is already running on port 8085."
}
