# ARCHIVE — local dev server
$Port = 55333
$Root = $PSScriptRoot

Set-Location $Root

Write-Host ""
Write-Host "  ARCHIVE — Curated Vintage & Pre-Loved Fashion" -ForegroundColor White
Write-Host "  http://localhost:$Port/" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Press Ctrl+C to stop." -ForegroundColor DarkGray
Write-Host ""

npm start
