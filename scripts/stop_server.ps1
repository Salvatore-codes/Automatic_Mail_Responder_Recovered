# Stop Automatic Mail Responder Server at 8:00 PM
$portUse = Get-NetTCPConnection -LocalPort 8085 -ErrorAction SilentlyContinue
if ($portUse) {
    $pids = $portUse.OwningProcess | Select-Object -Unique
    foreach ($pidToKill in $pids) {
        Write-Host "[8:00 PM Cron] Stopping Mail Responder Server PID: $pidToKill..."
        Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
    }
    Write-Host "[8:00 PM Cron] Server stopped successfully."
} else {
    Write-Host "[8:00 PM Cron] Server is not currently running."
}
