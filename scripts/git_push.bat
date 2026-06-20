@echo off
E:
cd E:\Projects\GridDown
git commit -m "feat: HAM radio, vehicle & homestead categories, translator tool, Morse code, field manuals"
git push origin main
git tag v1.1.0-beta
git push origin v1.1.0-beta
echo.
echo === Done ===
git log --oneline -3
