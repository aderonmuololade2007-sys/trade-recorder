@echo off
echo ====================================
echo Trade Journal - GitHub Update Script
echo ====================================
echo.

cd "c:\Users\Ololade Aderounmu\OneDrive\Desktop\trade recorder"

echo Checking if this is a git repository...
if not exist .git (
    echo Initializing git repository...
    git init
    git remote add origin https://github.com/aderonmuololade/trade-journal.git
) else (
    echo Git repository already initialized.
)

echo.
echo Adding all files...
git add .

echo.
echo Committing changes...
git commit -m "Updated Trade Journal - %date% %time%"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ====================================
echo ✅ Update Complete!
echo ====================================
echo.
echo Visit your live site:
echo https://aderonmuololade.github.io/trade-journal
echo.
echo Press any key to exit...
pause > nul