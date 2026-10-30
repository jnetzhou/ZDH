# -*- coding: utf-8 -*-
# 周大航任务系统 - 本地服务
# Copyright (c) 2026 jnetzhou <742408364@qq.com>
# SPDX-License-Identifier: AGPL-3.0-or-later（详见根目录 LICENSE）
"""
周大航任务系统 - 本地服务
1. 托管当前目录的静态文件（HTML/CSS/JS）
2. 提供 /api/data 读写 data.json，让数据跟着文件夹走（换电脑可续上）
3. 每次落盘自动留档到 backups/，数据丢了可用「备份与恢复.bat」还原
只依赖 Python 标准库，无需 pip install。
"""
import hashlib
import json
import os
import re
import shutil
import socket
import sys
import tempfile
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, 'data.json')
BACKUP_DIR = os.path.join(BASE_DIR, 'backups')
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080

# ---- 自动备份策略 ----
BACKUP_MIN_INTERVAL = 300          # 两次快照最少间隔 5 分钟，避免频繁写盘
BACKUP_KEEP_LATEST = 120           # 最近 120 份快照一定保留
BACKUP_KEEP_DAYS = 90              # 另外每天留最后一份，保留 90 天
BACKUP_NAME_RE = re.compile(r'^data-\d{8}-\d{6}(-\d+)?\.json$')


def _ensure_backup_dir():
    os.makedirs(BACKUP_DIR, exist_ok=True)


def list_backups():
    """按时间顺序返回备份文件的绝对路径（文件名带时间戳，按名字排就是按时间排）"""
    if not os.path.isdir(BACKUP_DIR):
        return []
    names = [n for n in os.listdir(BACKUP_DIR) if BACKUP_NAME_RE.match(n)]
    return [os.path.join(BACKUP_DIR, n) for n in sorted(names)]


def _file_md5(path):
    h = hashlib.md5()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(65536), b''):
            h.update(chunk)
    return h.hexdigest()


def _prune_backups():
    """最近 120 份全留；另外每天的最后一份留 90 天；其余删掉"""
    files = list_backups()
    keep = set(files[-BACKUP_KEEP_LATEST:])

    latest_of_day = {}
    for f in files:
        day = os.path.basename(f)[5:13]
        latest_of_day[day] = f

    cutoff_day = time.strftime('%Y%m%d', time.localtime(time.time() - BACKUP_KEEP_DAYS * 86400))
    for day, f in latest_of_day.items():
        if day >= cutoff_day:
            keep.add(f)

    for f in files:
        if f not in keep:
            try:
                os.remove(f)
            except OSError:
                pass


def make_backup(force=False):
    """把当前 data.json 复制到 backups/。返回新文件路径；不满足条件返回 None。

    force=True 时跳过节流（手动备份 / 启动时用）。
    """
    if not os.path.exists(DATA_FILE):
        return None
    _ensure_backup_dir()

    files = list_backups()
    if files and not force:
        latest = files[-1]
        if time.time() - os.path.getmtime(latest) < BACKUP_MIN_INTERVAL:
            return None
        # 内容没变就不用重复留档
        if _file_md5(latest) == _file_md5(DATA_FILE):
            return None

    stamp = time.strftime('%Y%m%d-%H%M%S')
    dest = os.path.join(BACKUP_DIR, f'data-{stamp}.json')
    if os.path.exists(dest):
        dest = os.path.join(BACKUP_DIR, f'data-{stamp}-{int(time.time() * 1000) % 1000:03d}.json')

    # 用 copyfile 而不是 copy2：保留「备份时间」作为文件时间，节流判断才准确
    shutil.copyfile(DATA_FILE, dest)
    _prune_backups()
    return dest


def local_ip():
    """拿到本机在局域网里的 IPv4（不会真的发包）"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except OSError:
        return '127.0.0.1'


LAN_IP = local_ip()


def desktop_dir():
    """桌面目录：优先问 Windows 要（兼容桌面被 OneDrive 重定向的情况）"""
    try:
        import ctypes
        buf = ctypes.create_unicode_buffer(260)
        # CSIDL_DESKTOPDIRECTORY = 0x0010
        if ctypes.windll.shell32.SHGetFolderPathW(None, 0x0010, None, 0, buf) == 0 and buf.value:
            return buf.value
    except Exception:
        pass
    home = os.path.expanduser('~')
    for cand in (os.path.join(home, 'Desktop'), os.path.join(home, 'OneDrive', 'Desktop')):
        if os.path.isdir(cand):
            return cand
    return os.path.join(home, 'Desktop')


def create_desktop_shortcut():
    """在桌面生成「周大航任务系统.url」，指向本服务；返回快捷方式路径"""
    desktop = desktop_dir()
    dest = os.path.join(desktop, '周大航任务系统.url')
    icon = os.path.join(BASE_DIR, 'favicon.ico')
    # .url 是 INI 格式，必须用 CRLF 换行
    content = (
        '[InternetShortcut]\r\n'
        f'URL=http://localhost:{PORT}/\r\n'
        f'IconFile={icon}\r\n'
        'IconIndex=0\r\n'
    )
    with open(dest, 'w', encoding='utf-8', newline='') as f:
        f.write(content)
    return dest


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def _send_json(self, obj, status=200):
        body = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    # 带版本号的 js/css 与 assets 允许长期缓存（手机端重复打开无需重新下载）；
    # 页面与接口仍禁用缓存，保证数据实时
    def end_headers(self):
        path = self.path.split('?')[0].lower()
        if 'v=' in self.path and (path.startswith('/js/') or path.startswith('/css/')):
            self.send_header('Cache-Control', 'public, max-age=31536000, immutable')
        elif path.startswith('/assets/'):
            self.send_header('Cache-Control', 'public, max-age=31536000, immutable')
        else:
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
            self.send_header('Pragma', 'no-cache')
        super().end_headers()

    def do_GET(self):
        # 先解码、再规整路径，避免 /./backups/、/%62ackups/ 这类写法绕过下面的拦截
        path = os.path.normpath(unquote(self.path.split('?')[0])).replace('\\', '/')
        # 备份目录里是完整数据，不对外提供下载（Windows 路径不区分大小写，这里也忽略大小写）
        lower = path.lower()
        if lower == '/backups' or lower.startswith('/backups/'):
            self._send_json({'error': 'forbidden'}, 403)
            return
        if path == '/api/info':
            self._send_json({'ip': LAN_IP, 'port': PORT})
            return
        if path == '/api/data':
            try:
                with open(DATA_FILE, 'r', encoding='utf-8') as f:
                    self._send_json(json.load(f))
            except FileNotFoundError:
                self._send_json({})
            except Exception as e:
                self._send_json({'error': str(e)}, 500)
            return
        super().do_GET()

    def do_POST(self):
        path = os.path.normpath(unquote(self.path.split('?')[0])).replace('\\', '/')
        if path == '/api/shortcut':
            try:
                self._send_json({'ok': True, 'path': create_desktop_shortcut()})
            except Exception as e:
                self._send_json({'error': str(e)}, 500)
            return
        if path != '/api/data':
            self._send_json({'error': 'not found'}, 404)
            return
        try:
            length = int(self.headers.get('Content-Length') or 0)
            data = json.loads(self.rfile.read(length).decode('utf-8'))
            if not isinstance(data, dict):
                raise ValueError('data must be an object')
            # 先写临时文件再替换，避免写一半断电把 data.json 弄坏
            fd, tmp = tempfile.mkstemp(dir=BASE_DIR, prefix='.data-', suffix='.tmp')
            with os.fdopen(fd, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            os.replace(tmp, DATA_FILE)
            # 自动留档：距上次快照超过 5 分钟且内容有变化才备份
            try:
                make_backup()
            except Exception as e:
                print(f'[备份] 自动备份失败: {e}')
            self._send_json({'ok': True, 'updatedAt': data.get('updatedAt')})
        except Exception as e:
            self._send_json({'error': str(e)}, 500)


def main():
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

    print('=' * 46)
    print('   🚀 周大航任务系统 正在启动')
    print('=' * 46)
    print(f'   电脑访问:   http://{LAN_IP}:{PORT}')
    print(f'   手机/平板:  http://{LAN_IP}:{PORT}   (需同一 WiFi)')
    print(f'   数据文件:   {DATA_FILE}')
    print(f'   自动备份:   {BACKUP_DIR}')
    print('=' * 46)

    # 启动时也留一份档（距上次不足 5 分钟会跳过，不会重复写）
    try:
        saved = make_backup()
        if saved:
            print(f'   [备份] 已生成 {os.path.basename(saved)}')
    except Exception as e:
        print(f'   [备份] 启动备份失败: {e}')

    print('   按 Ctrl+C 停止服务')
    print('')

    try:
        server = ThreadingHTTPServer(('0.0.0.0', PORT), Handler)
    except OSError as e:
        # 端口被占用：说明已经有一个实例在跑，不要静默失败
        print(f'[错误] 端口 {PORT} 已被占用（{e}）。')
        print('       如果服务已经在运行，直接打开浏览器访问即可；')
        print('       要重启请先运行「停止服务器.bat」再启动。')
        try:
            input('按回车退出...')
        except EOFError:
            pass
        return

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n服务已停止')
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
