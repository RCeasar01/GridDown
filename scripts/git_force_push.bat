@echo off
E:
cd E:\Projects\GridDown
git stash
git pull origin main --rebase
git stash pop
git push origin main
echo.
echo === Final log ===
git log --oneline -5
