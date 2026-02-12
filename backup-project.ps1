# Simple Project Backup Script
# This works WITHOUT Git - just run this file!

# Configuration
$projectPath = "C:\Users\Nir SCH\OneDrive\Desktop\Cursor_Project\Protfoliu_Tracker"
$backupBasePath = "C:\Users\Nir SCH\OneDrive\Desktop\Cursor_Project\Backups"
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupName = "Protfoliu_Tracker_BACKUP_$timestamp"
$backupFullPath = Join-Path $backupBasePath $backupName

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Portfolio Tracker Backup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Create backup directory if it doesn't exist
if (-not (Test-Path $backupBasePath)) {
    Write-Host "Creating backup directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $backupBasePath -Force | Out-Null
}

Write-Host "Backing up project..." -ForegroundColor Green
Write-Host "From: $projectPath" -ForegroundColor Gray
Write-Host "To:   $backupFullPath" -ForegroundColor Gray
Write-Host ""

try {
    # Copy the entire project folder
    Copy-Item -Path $projectPath -Destination $backupFullPath -Recurse -Force
    
    # Remove node_modules from backup (saves space)
    $nodeModulesPath = Join-Path $backupFullPath "node_modules"
    if (Test-Path $nodeModulesPath) {
        Write-Host "Removing node_modules from backup (saves space)..." -ForegroundColor Yellow
        Remove-Item -Path $nodeModulesPath -Recurse -Force
    }
    
    # Remove .next from backup (build files)
    $nextPath = Join-Path $backupFullPath ".next"
    if (Test-Path $nextPath) {
        Write-Host "Removing .next from backup (build files)..." -ForegroundColor Yellow
        Remove-Item -Path $nextPath -Recurse -Force
    }
    
    Write-Host ""
    Write-Host "✅ SUCCESS! Backup created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Backup location:" -ForegroundColor Cyan
    Write-Host "  $backupFullPath" -ForegroundColor White
    Write-Host ""
    Write-Host "To restore this backup:" -ForegroundColor Yellow
    Write-Host "  1. Delete or rename your current project folder" -ForegroundColor Gray
    Write-Host "  2. Copy the backup folder back to:" -ForegroundColor Gray
    Write-Host "     C:\Users\Nir SCH\OneDrive\Desktop\Cursor_Project\Protfoliu_Tracker" -ForegroundColor Gray
    Write-Host "  3. Run 'npm install' to restore node_modules" -ForegroundColor Gray
    Write-Host ""
    
    # List all backups
    $allBackups = Get-ChildItem -Path $backupBasePath -Directory | Sort-Object CreationTime -Descending
    Write-Host "All your backups ($($allBackups.Count) total):" -ForegroundColor Cyan
    foreach ($backup in $allBackups | Select-Object -First 5) {
        $size = (Get-ChildItem $backup.FullName -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
        Write-Host "  - $($backup.Name) [$([math]::Round($size, 2)) MB]" -ForegroundColor Gray
    }
    
    if ($allBackups.Count -gt 5) {
        Write-Host "  ... and $($allBackups.Count - 5) more" -ForegroundColor DarkGray
    }
    
} catch {
    Write-Host "❌ ERROR: Backup failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
