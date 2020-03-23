<<<<<<< HEAD
@echo off
setlocal

set npm_config_disturl="https://atom.io/download/atom-shell"
for /f "delims=" %%A in ('powershell -Command "(Get-Content -Raw %~dp0..\package.json | ConvertFrom-Json).electronVersion"') do set "npm_config_target=%%A"
set npm_config_arch="ia32"
set HOME=~\.electron-gyp

npm %*

endlocal
=======
@echo off
setlocal

set npm_config_disturl="https://atom.io/download/atom-shell"
for /f "delims=" %%A in ('powershell -Command "(Get-Content -Raw %~dp0..\package.json | ConvertFrom-Json).electronVersion"') do set "npm_config_target=%%A"
set npm_config_arch="ia32"
set HOME=~\.electron-gyp

npm %*

endlocal
>>>>>>> f315b8ece10915ec3be05e23f63bedcd7561a67d
