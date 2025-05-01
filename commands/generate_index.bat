@echo off
cd /d "%~dp0"
echo // Auto-generated command imports > index.js

for %%f in (*.js) do (
    if /i not "%%f"=="index.js" (
        echo import "./%%f"; >> index.js
    )
)

echo Generated index.js with imports:
type index.js