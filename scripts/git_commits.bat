@echo off
cd /d E:\Projects\GridDown

echo [1/11] Committing quiz content...
git commit -m "feat(quiz): add 53 scenario-based quiz questions across 12 categories - Water Fire Shelter Food Medical Navigation Comms Security Vehicle Homesteading FieldManuals Disaster - Formats multiple_choice priority_order decision_tree - Written to real survival/TCCC standards"
if %ERRORLEVEL% NEQ 0 echo Skipping (nothing to commit or error)

echo [2/11] Staging types and registry...
git add app/types/quiz.ts app/utils/quizRegistry.ts app/utils/dailyDrill.ts types/missing-modules.d.ts

echo [3/11] Committing types and registry...
git commit -m "feat(quiz): add quiz TypeScript types, registry, daily drill utility, and module stubs"
if %ERRORLEVEL% NEQ 0 echo Skipping (nothing to commit or error)

echo [4/11] Staging quiz screens...
git add app/screens/QuizMenuScreen.tsx app/screens/QuizScreen.tsx app/screens/QuizResultScreen.tsx

echo [5/11] Committing quiz screens...
git commit -m "feat(quiz): add QuizMenuScreen QuizScreen QuizResultScreen - 12-category grid with readiness pct Daily Drill card tier gating - handles multiple_choice priority_order decision_tree formats - animated node transitions tap-to-sequence priority ordering"
if %ERRORLEVEL% NEQ 0 echo Skipping (nothing to commit or error)

echo [6/11] Staging infrastructure...
git add app/db/contentLoader.ts app/navigation/AppNavigator.tsx app/screens/HomeScreen.tsx app/screens/MoreScreen.tsx app/screens/SettingsScreen.tsx app.config.ts package.json package-lock.json

echo [7/11] Committing infrastructure...
git commit -m "feat(quiz): wire quiz system into app infrastructure - contentLoader: quiz_results + daily_drill_state SQLite tables + save/readiness/drill functions - HomeScreen: TODAY'S DRILL card - MoreScreen: Quizzes entry first in list - AppNavigator: QuizMenu QuizPlay QuizResult in MoreStack - SettingsScreen: Daily Drill Reminder with expo-notifications - app.config + package.json: expo-notifications ~0.28.19"
if %ERRORLEVEL% NEQ 0 echo Skipping (nothing to commit or error)

echo [8/11] Staging store assets...
git add store-assets/

echo [9/11] Committing store assets...
git commit -m "docs: update APP_STORE_CONNECT.md for v1.2.0-beta quiz system"
if %ERRORLEVEL% NEQ 0 echo Skipping (nothing to commit or error)

echo [10/11] Checking branch...
git branch

echo [11/11] Done with local commits.
