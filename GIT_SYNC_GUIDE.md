# Git Sync Guide - Working Across Multiple Locations

This guide helps you stay in sync whether you're working locally or making changes directly on the remote.

## Quick Start

Run the sync checker before starting work:
```bash
./sync-check.ps1
```

This tells you:
- ✓ If you're in sync
- ↑↓ How many commits you're ahead/behind
- ⚠️ Any uncommitted changes
- 📋 Recommended actions

## Common Scenarios

### Scenario 1: You pushed remotely, now working locally
**Signs**: `sync-check.ps1` shows "X commits behind remote"

**Fix**:
```bash
git pull
```

This brings your local branch up to date. If you have local uncommitted changes:
```bash
git stash          # Save your work temporarily
git pull           # Update from remote
git stash pop      # Reapply your changes
```

### Scenario 2: You committed locally, need to push
**Signs**: `sync-check.ps1` shows "X commits ahead of remote"

**Fix**:
```bash
git push
```

If the remote has changed since your last pull:
```bash
git pull --rebase  # Gets remote changes and replays your commits on top
git push
```

### Scenario 3: Both local and remote have changes (diverged)
**Signs**: `sync-check.ps1` shows both "X ahead" and "Y behind"

**Fix** (choose one strategy):

**Option A: Merge** (keeps both histories)
```bash
git pull           # Creates a merge commit
git push
```

**Option B: Rebase** (cleaner history, preferred for this repo)
```bash
git pull --rebase  # Replays your commits on top of remote
git push
```

**Option C: Manual review**
```bash
git fetch          # Get remote changes (non-destructive)
git log --oneline -10 origin/master  # See what's on remote
git log --oneline -10 master          # See what's local
# Then decide: merge, rebase, or reset to remote
```

### Scenario 4: "Oops, I made changes locally but remote is the source of truth"
**Fix**:
```bash
git fetch origin
git reset --hard origin/master
```

⚠️ **Warning**: This discards all local uncommitted and unpushed changes.

Safer version (backs up your work first):
```bash
git stash          # Save uncommitted changes
git fetch origin
git reset --hard origin/master
git stash pop      # Recover if needed
```

## Best Practices

### Before Starting Work
```bash
./sync-check.ps1          # Check status
git fetch origin          # Get latest from remote (safe, non-destructive)
```

### After Making Changes
```bash
git add <files>
git commit -m "your message"
./sync-check.ps1          # Check if you're ahead
git push                  # Push to remote
```

### When You Find You're Out of Sync
```bash
# If you're behind: pull the changes
git pull

# If you're ahead and need to sync:
git push

# If both (diverged):
git pull --rebase && git push
```

## Workflow for This Project

Since you edit both locally and remotely, here's a suggested daily workflow:

1. **Start of day**: `./sync-check.ps1` → know your status
2. **Make changes locally**: Commit and push when done
3. **Made changes remotely** (via GitHub/editor/etc.): `./sync-check.ps1` → then `git pull`
4. **Before pushing**: Always `git fetch origin` first to see if remote changed

## Understanding the Output

```
  ↑ 3 commit(s) ahead of remote     → You have local work not pushed
  ↓ 2 commit(s) behind remote       → Remote has work you don't have locally
  ✓ In sync with remote              → Perfect, you're current
```

## Preventing Future Sync Issues

### Set Rebase as Default for Pulls
```bash
git config pull.rebase true
```

Now `git pull` will rebase by default (cleaner history):
```bash
git pull           # Same as: git pull --rebase
```

### Enable Auto-Fetch (Optional)
If you have Git on your machine, you can set a cron job:
```bash
# Run sync-check.ps1 every 2 hours to stay aware of status
# (Add to Task Scheduler on Windows)
```

### Before Critical Work
```bash
# Create a backup branch
git branch backup/my-feature

# Now you can safely pull/rebase knowing you have a checkpoint
git pull --rebase
```

## When Things Go Wrong

**"I accidentally reset the wrong branch"**
```bash
git reflog                  # See all commits, even "lost" ones
git reset --hard <hash>    # Go back to that point
```

**"Merge conflict after pulling"**
```bash
# Files marked with <<<<<<, ======, >>>>>>
# Edit them to resolve, then:
git add <resolved-files>
git commit -m "Resolve merge conflict"
git push
```

**"I'm completely confused about local vs remote"**
```bash
# See everything clearly:
git log --oneline --graph --all  # Visual history

# Nuclear option (⚠️ careful!):
git fetch origin
git reset --hard origin/master   # Makes local identical to remote
```

## Summary

| Command | When | Effect |
|---------|------|--------|
| `./sync-check.ps1` | Anytime | Shows sync status (safe, read-only) |
| `git fetch` | Anytime | Gets latest from remote (safe) |
| `git pull` | When behind | Brings local up to date |
| `git push` | When ahead | Sends local commits to remote |
| `git pull --rebase` | When diverged | Reapplies your commits on top of remote |
| `git stash` | Before destructive ops | Saves your work temporarily |
| `git reflog` | Lost commits | Find your way back |

---

**Pro Tip**: Always run `./sync-check.ps1` before you start coding and after you've pushed. It takes 2 seconds and prevents 99% of sync headaches.
