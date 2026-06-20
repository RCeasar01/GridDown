@echo off
E:
cd E:\Projects\GridDown
git pull origin main --rebase
git push origin main
echo.
echo === Final log ===
git log --oneline -5
