@echo off
chcp 65001 >nul
setlocal
title 周大航任务系统 - 停止服务
cd /d "%~dp0"

set "PORT=8080"
set "FOUND="

echo ==============================================
echo    正在检查 %PORT% 端口上的服务...
echo ==============================================
echo.

rem 只匹配本机端口 %PORT% 且处于 LISTENING 的行，避免误杀其他进程
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /c:":%PORT%" ^| findstr /c:"LISTENING"') do (
  if not "%%P"=="0" (
    set "FOUND=1"
    taskkill /f /pid %%P >nul 2>&1
  )
)

echo.
if defined FOUND (
  echo [完成] 服务已停止，可以关闭这个窗口了。
) else (
  echo [提示] 没有发现占用 %PORT% 端口的服务，可能已经停止了。
)
echo.
pause
