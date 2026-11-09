$ok = $false
for ($i = 1; $i -le 30; $i++) {
  try {
    $r = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 3
    if ($r.StatusCode -eq 200) { $ok = $true; break }
  } catch { Start-Sleep -Seconds 2 }
}
if ($ok) { Write-Output "HTTP 200 - server is up" ; if ($r.Content -match "Tomato-Lite") { Write-Output "Homepage content verified" } }
else { Write-Output "Server not responding after retries" }
