# Restore Project from Backup Script
# Run this if you need to restore from a backup

$backupBasePath = "C:\Users\Nir SCH\OneDrive\Desktop\Cursor_Project\Backups"
$projectPath = "C:\Users\Nir SCH\OneDrive\Desktop\Cursor_Project\Protfoliu_Tracker"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Portfolio Tracker Restore Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if backups exist
if (-not (Test-Path $backupBasePath)) {
    Write-Host "❌ No backups found at: $backupBasePath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Run 'backup-project.ps1' first to create a backup!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press any key to exit..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# List available backups
$allBackups = Get-ChildItem -Path $backupBasePath -Directory | Sort-Object CreationTime -Descending

if ($allBackups.Count -eq 0) {
    Write-Host "❌ No backups found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Press any key to exit..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host "Available backups:" -ForegroundColor Green
Write-Host ""

for ($i = 0; $i -lt $allBackups.Count; $i++) {
    $backup = $allBackups[$i]
    $size = (Get-ChildItem $backup.FullName -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    $createdTime = $backup.CreationTime.ToString("yyyy-MM-dd HH:mm:ss")
    Write-Host "  [$($i+1)] $($backup.Name)" -ForegroundColor Cyan
    Write-Host "      Created: $createdTime | Size: $([math]::Round($size, 2)) MB" -ForegroundColor Gray
    Write-Host ""
}

# Ask user to select a backup
Write-Host "Enter the number of the backup you want to restore (or 'Q' to quit): " -NoNewline -ForegroundColor Yellow
$selection = Read-Host

if ($selection -eq 'Q' -or $selection -eq 'q') {
    Write-Host "Cancelled by user." -ForegroundColor Yellow
    exit 0
}

# Validate selection
$selectedIndex = [int]$selection - 1
if ($selectedIndex -lt 0 -or $selectedIndex -ge $allBackups.Count) {
    Write-Host "❌ Invalid selection!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Press any key to exit..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

$selectedBackup = $allBackups[$selectedIndex]

Write-Host ""
Write-Host "⚠️  WARNING: This will replace your current project!" -ForegroundColor Red
Write-Host "Current project: $projectPath" -ForegroundColor Gray
Write-Host "Will restore:    $($selectedBackup.FullName)" -ForegroundColor Gray
Write-Host ""
Write-Host "Are you sure? Type 'YES' to continue: " -NoNewline -ForegroundColor Yellow
$confirmation = Read-Host

if ($confirmation -ne 'YES') {
    Write-Host "Cancelled by user." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Creating backup of current state before restoring..." -ForegroundColor Yellow

# Backup current state first
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$currentBackupPath = Join-Path $backupBasePath "BEFORE_RESTORE_$timestamp"
Copy-Item -Path $projectPath -Destination $currentBackupPath -Recurse -Force

Write-Host "✅ Current state backed up to: $currentBackupPath" -ForegroundColor Green
Write-Host ""
Write-Host "Restoring backup..." -ForegroundColor Yellow

try {
    # Remove current project (except this script!)
    $items = Get-ChildItem -Path $projectPath -Exclude "restore-backup.ps1", "backup-project.ps1", "SETUP_GIT_BACKUP.md"
    foreach ($item in $items) {
        Remove-Item -Path $item.FullName -Recurse -Force
    }
    
    # Copy backup files
    $backupItems = Get-ChildItem -Path $selectedBackup.FullName
    foreach ($item in $backupItems) {
        Copy-Item -Path $item.FullName -Destination $projectPath -Recurse -Force
    }
    
    Write-Host ""
    Write-Host "✅ SUCCESS! Backup restored!" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Run 'npm install' to restore dependencies!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press any key to exit..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    
} catch {
    Write-Host "❌ ERROR: Restore failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Your current state was backed up to:" -ForegroundColor Yellow
    Write-Host "  $currentBackupPath" -ForegroundColor White
    Write-Host ""
    Write-Host "Press any key to exit..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}
