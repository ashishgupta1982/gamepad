#!/usr/bin/env pwsh
<#
.SYNOPSIS
Git Sync Status Checker - Review local vs remote status across your repository

.DESCRIPTION
Fetches latest from remote and shows:
- Current branch status (commits ahead/behind)
- Uncommitted changes
- Recent commits (local and remote)
- Sync recommendations

.EXAMPLE
.\sync-check.ps1
#>

param(
    [switch]$Verbose,
    [switch]$All  # Show all branches, not just current
)

function Write-Section {
    param([string]$Title)
    Write-Host "`n━━━ $Title ━━━" -ForegroundColor Cyan
}

function Write-Status {
    param([string]$Message, [string]$Status = "info")
    $color = @{
        "ok" = "Green"
        "warn" = "Yellow"
        "error" = "Red"
        "info" = "White"
    }[$Status]
    Write-Host "  $Message" -ForegroundColor $color
}

# Ensure we're in a git repo
try {
    $root = git rev-parse --show-toplevel 2>$null
    if (-not $root) { throw "Not a git repository" }
} catch {
    Write-Host "Error: Not in a git repository" -ForegroundColor Red
    exit 1
}

Write-Host "`n🔄 Git Sync Status" -ForegroundColor Magenta
Write-Host "Repository: $root" -ForegroundColor Gray

# Fetch latest from remote (non-destructive)
Write-Section "Fetching from remote"
git fetch --all 2>&1 | ForEach-Object { Write-Status $_ }

# Get current branch info
$currentBranch = git rev-parse --abbrev-ref HEAD 2>$null
$isDetached = $currentBranch -eq "HEAD"

if ($isDetached) {
    Write-Status "⚠️  Detached HEAD at $(git rev-parse --short HEAD)" "warn"
} else {
    Write-Status "Current branch: $currentBranch"
}

Write-Section "Local Changes"
$status = git status --porcelain
if ($status) {
    Write-Status "Uncommitted changes found:" "warn"
    $status -split "`n" | Where-Object { $_ } | ForEach-Object {
        Write-Host "    $_" -ForegroundColor Yellow
    }
} else {
    Write-Status "Working directory clean" "ok"
}

Write-Section "Sync Status - Current Branch"
if (-not $isDetached) {
    $trackingBranch = git rev-parse --abbrev-ref "$currentBranch@{u}" 2>$null

    if ($trackingBranch) {
        # Count commits ahead and behind
        $aheadCount = git rev-list --count "$trackingBranch..$currentBranch" 2>$null
        $behindCount = git rev-list --count "$currentBranch..$trackingBranch" 2>$null

        Write-Status "Tracking: $trackingBranch"

        if ($aheadCount -eq 0 -and $behindCount -eq 0) {
            Write-Status "✓ In sync with remote" "ok"
        } else {
            if ($aheadCount -gt 0) {
                Write-Status "↑ $aheadCount commit(s) ahead of remote" "warn"
            }
            if ($behindCount -gt 0) {
                Write-Status "↓ $behindCount commit(s) behind remote" "warn"
            }
        }

        # Show recent commits
        Write-Section "Recent Commits"
        Write-Host "  Local (last 3):" -ForegroundColor Cyan
        git log --oneline -3 $currentBranch 2>$null | ForEach-Object {
            Write-Host "    $_" -ForegroundColor Green
        }

        Write-Host "  Remote (last 3):" -ForegroundColor Cyan
        git log --oneline -3 $trackingBranch 2>$null | ForEach-Object {
            Write-Host "    $_" -ForegroundColor Blue
        }

        # Sync recommendations
        Write-Section "Recommended Actions"
        if ($behindCount -gt 0 -and $aheadCount -eq 0) {
            Write-Status "Your branch is behind. Run: git pull" "warn"
        }
        elseif ($aheadCount -gt 0 -and $behindCount -eq 0) {
            Write-Status "Your branch is ahead. Run: git push" "warn"
        }
        elseif ($aheadCount -gt 0 -and $behindCount -gt 0) {
            Write-Status "Branches have diverged (you have local, remote has new). Options:" "error"
            Write-Host "    1. git pull (merge strategy)" -ForegroundColor Yellow
            Write-Host "    2. git pull --rebase (rebase strategy)" -ForegroundColor Yellow
        }
        else {
            Write-Status "✓ Everything is in sync" "ok"
        }
    } else {
        Write-Status "⚠️  Branch has no upstream tracking" "warn"
        Write-Host "    Set upstream: git push -u origin $currentBranch" -ForegroundColor Yellow
    }
}

# All branches overview if requested
if ($All) {
    Write-Section "All Branches Status"
    git branch -v --all | ForEach-Object {
        if ($_ -match '^\*') {
            Write-Host "  $_" -ForegroundColor Green
        } else {
            Write-Host "  $_" -ForegroundColor Gray
        }
    }
}

Write-Host "`n" -ForegroundColor Gray
