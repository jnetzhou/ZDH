@echo off
chcp 65001 >nul
setlocal
title 周大航任务系统 - 备份与恢复
cd /d "%~dp0"

rem 周大航任务系统 - 数据备份与恢复
rem Copyright (c) 2026 jnetzhou <742408364@qq.com>
rem SPDX-License-Identifier: AGPL-3.0-or-later（详见根目录 LICENSE）

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
