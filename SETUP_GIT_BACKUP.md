# Git Installation & Backup Setup Guide

## Your Current Situation
Git is not installed on your Windows system. You have two options:

---

## Option 1: Install Git (RECOMMENDED - 10 minutes)

### Step 1: Download & Install Git

1. **Download Git for Windows:**
   - Open your browser and go to: https://git-scm.com/download/win
   - The download should start automatically (64-bit version)

2. **Run the Installer:**
   - Double-click the downloaded `.exe` file
   - Click "Next" through all the screens
   - **IMPORTANT:** On the "Adjusting your PATH environment" screen, select:
     ✅ "Git from the command line and also from 3rd-party software" (should be default)
   - Continue clicking "Next" and then "Install"
   - Click "Finish" when done

3. **Restart Cursor IDE:**
   - Close Cursor completely
   - Open Cursor again
   - Open a new terminal in Cursor

4. **Verify Installation:**
   Open a new terminal and run:
   ```powershell
   git --version
   ```
   You should see something like: `git version 2.43.0.windows.1`

### Step 2: Configure Git (One-time setup)

Run these commands in your terminal (replace with your info):
```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Step 3: Initialize Git for Your Project

In Cursor terminal, run these commands:
```powershell
# Navigate to your project (if not already there)
cd "C:\Users\Nir SCH\OneDrive\Desktop\Cursor_Project\Protfoliu_Tracker"

# Initialize Git repository
git init

# Add all your files
git add .

# Create your first commit (snapshot)
git commit -m "Initial commit - Working version after price fixes (Feb 12, 2026)"
```

### Step 4: Create a Backup Branch (Safety Net)

```powershell
# Create a backup branch you can always return to
git branch backup-stable-feb12-2026

# Check your branches
git branch
```

**✅ DONE!** Your code is now saved. You can always return to this version.

---

## Option 2: Simple Backup Script (Works NOW - No Installation)

I've created `backup-project.ps1` in your project folder. Just run it!

---

## How to Use Git After Setup

### Save Your Current Work (Create a Snapshot)
```powershell
git add .
git commit -m "Description of what you changed"
```

### See What You've Changed
```powershell
git status          # See which files changed
git diff            # See exact changes
```

### Go Back to Previous Version
```powershell
# See all your snapshots
git log --oneline

# Discard ALL changes and go back to last commit
git reset --hard HEAD

# Go back to the backup branch
git checkout backup-stable-feb12-2026

# Return to your main work
git checkout main
```

### Create a New Branch for Experiments
```powershell
# Create and switch to experimental branch
git checkout -b experiment-new-feature

# If experiment works, merge it back
git checkout main
git merge experiment-new-feature

# If experiment fails, just delete it
git checkout main
git branch -D experiment-new-feature
```

---

## Quick Reference: Common Git Commands

| Command | What It Does |
|---------|-------------|
| `git status` | Show what files changed |
| `git add .` | Stage all changes for commit |
| `git commit -m "message"` | Save a snapshot with description |
| `git log --oneline` | Show commit history |
| `git diff` | Show exact changes made |
| `git reset --hard HEAD` | Discard ALL changes, go back to last commit |
| `git checkout <branch>` | Switch to a different branch/version |
| `git branch` | List all branches |

---

## Need Help?

After installing Git, ask me in Cursor and I can help you with any Git commands or create more backup branches!
