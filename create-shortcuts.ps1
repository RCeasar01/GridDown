$WshShell = New-Object -comObject WScript.Shell
$Desktop = [Environment]::GetFolderPath('Desktop')

$Shortcut = $WshShell.CreateShortcut("$Desktop\GridDown Dev.lnk")
$Shortcut.TargetPath = "C:\Windows\System32\cmd.exe"
$Shortcut.Arguments = '/k "cd /d E:\Projects\GridDown && npx expo start"'
$Shortcut.WorkingDirectory = "E:\Projects\GridDown"
$Shortcut.Description = "Launch GridDown Expo dev server"
$Shortcut.Save()

$Shortcut2 = $WshShell.CreateShortcut("$Desktop\GridDown (Web).lnk")
$Shortcut2.TargetPath = "C:\Windows\System32\cmd.exe"
$Shortcut2.Arguments = '/k "cd /d E:\Projects\GridDown && npx expo start --web"'
$Shortcut2.WorkingDirectory = "E:\Projects\GridDown"
$Shortcut2.Description = "Launch GridDown in web browser for quick testing"
$Shortcut2.Save()

Write-Host "Shortcuts created at: $Desktop"
