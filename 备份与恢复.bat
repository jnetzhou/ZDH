@echo off
chcp 65001 >nul
setlocal
title 周大航任务系统 - 备份与恢复
cd /d "%~dp0"

where python >nul 2>&1
if not errorlevel 1 (
  python "%~dp0backup_tool.py"
  goto end
)
where py >nul 2>&1
if not errorlevel 1 (
  py -3 "%~dp0backup_tool.py"
  goto end
)
echo [错误] 没找到 Python，请先安装 Python 3（安装时勾选 Add to PATH）
pause
exit /b 1

:end
pause
