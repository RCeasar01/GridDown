@echo off
cd /d E:\Projects\GridDown
git tag -a v1.2.0-beta -m "v1.2.0-beta: Complete scenario-based quiz system with Daily Drill 53 quizzes across 12 categories SQLite readiness tracking push notifications"
echo Tag created, exit code: %ERRORLEVEL%
git push origin v1.2.0-beta 2>&1
echo Push tag exit code: %ERRORLEVEL%
