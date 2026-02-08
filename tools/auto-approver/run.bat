@echo off
title Claude Auto-Approver
cd /d "%~dp0"

:: Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Python not found. Please install Python 3.8+ from python.org
    pause
    exit /b 1
)

:: Install dependencies if needed
if not exist ".venv" (
    echo Setting up virtual environment...
    python -m venv .venv
    call .venv\Scripts\activate.bat
    pip install -r requirements.txt
) else (
    call .venv\Scripts\activate.bat
)

echo Starting Claude Auto-Approver...
python auto_approver.py
