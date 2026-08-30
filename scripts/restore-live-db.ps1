# ==============================================================================
# MedERP - Live Database Import & Restore Script (PowerShell / Windows)
# ==============================================================================

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$SqlDump = Join-Path $ProjectRoot "backend\database_backup\unicampus_full_dump.sql"

if (-not (Test-Path $SqlDump)) {
    Write-Error "Dump file not found at: $SqlDump"
    exit 1
}

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "🚀 MedERP Full Database Import & Restore" -ForegroundColor Green
Write-Host "📁 Dump file: $SqlDump" -ForegroundColor Yellow
Write-Host "==================================================================" -ForegroundColor Cyan

$dbHost = if ($env:DB_HOST) { $env:DB_HOST } else { "34.236.107.120" }
$dbPort = if ($env:DB_PORT) { $env:DB_PORT } else { "5433" }
$dbUser = if ($env:DB_USER) { $env:DB_USER } else { "unicampus" }
$dbPass = if ($env:DB_PASS) { $env:DB_PASS } else { "unicampus_dev@qsd!3ous" }
$dbName = if ($env:DB_NAME) { $env:DB_NAME } else { "unicampus_erp" }

# Check for Docker Postgres container
$pgContainer = (docker ps --filter "name=postgres" --format "{{.Names}}" 2>$null | Select-Object -First 1)

if ($pgContainer) {
    Write-Host "📦 Found Docker Postgres Container: $pgContainer" -ForegroundColor Green
    Write-Host "⏳ Importing dump directly into container..." -ForegroundColor Yellow
    Get-Content $SqlDump | docker exec -i $pgContainer psql -U $dbUser -d $dbName
    Write-Host "✅ Database restored successfully in Docker container: $pgContainer!" -ForegroundColor Green
} else {
    Write-Host "⚙️ Running Node.js database restore engine..." -ForegroundColor Yellow
    Set-Location (Join-Path $ProjectRoot "backend")
    node scripts/restore_full_database.js
    Write-Host "✅ Database restored successfully via Node.js restore engine!" -ForegroundColor Green
}

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "🎉 Live ERP Database Import Finished!" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Cyan
