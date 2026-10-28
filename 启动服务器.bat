@echo off
chcp 65001 >nul
setlocal
title 周大航任务系统 - 本地服务
cd /d "%~dp0"

set "PORT=8080"
set "RULE=ZDH-KidTask-HTTP"

echo ========================================
echo    🚀 周大航任务系统 正在启动
echo ========================================
echo.

rem ---------- 单实例检查：8080 已在监听就不再起第二个 ----------
netstat -ano | findstr /c:":%PORT% " | findstr /c:"LISTENING" >nul 2>&1
if not errorlevel 1 (
  echo [提示] 服务已经在运行（端口固定为 %PORT%），不会重复启动。
  echo        正在打开 http://localhost:%PORT%
  start "" "http://localhost:%PORT%"
  timeout /t 2 >nul
  exit /b 0
)

rem ---------- 防火墙放行（手机/平板访问需要）----------
fltmc >nul 2>&1
if not errorlevel 1 goto add_rule

rem 非管理员：规则已存在就不用再提权
netsh advfirewall firewall show rule name="%RULE%" >nul 2>&1
if not errorlevel 1 goto run

echo 首次运行需要管理员权限放行防火墙，请在弹窗里点“是”...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
if errorlevel 1 (
  echo [提示] 没有获得管理员权限，将以普通权限启动（手机/平板可能连不上）
  echo.
  goto run
)
exit /b

:add_rule
netsh advfirewall firewall show rule name="%RULE%" >nul 2>&1
if not errorlevel 1 goto run
netsh advfirewall firewall add rule name="%RULE%" dir=in action=allow protocol=TCP localport=%PORT% profile=any >nul
if errorlevel 1 (
  echo [警告] 防火墙规则添加失败，手机/平板可能连不上
) else (
  echo [OK] 已放行局域网端口 %PORT%
)
echo.

:run
where python >nul 2>&1
if not errorlevel 1 (
  python "%~dp0server.py" %PORT%
  goto end
)
where py >nul 2>&1
if not errorlevel 1 (
  py -3 "%~dp0server.py" %PORT%
  goto end
)
echo [错误] 没找到 Python，请先安装 Python 3（安装时勾选 Add to PATH）
pause
exit /b 1

:end
if errorlevel 1 (
  echo.
  echo [提示] 服务异常退出，端口 %PORT% 可能被占用，关掉占用程序再试。
  pause
)
