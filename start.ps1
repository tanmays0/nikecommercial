# Nike Commercial — local dev server
$Port = 55333
$Root = $PSScriptRoot

Set-Location $Root

Write-Host ""
Write-Host "  Nike Air Max Pulse" -ForegroundColor White
Write-Host "  http://localhost:$Port/" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Press Ctrl+C to stop." -ForegroundColor DarkGray
Write-Host ""

python -m http.server $Port
