# -*- coding: utf-8 -*-
# 周大航任务系统 - 数据备份 / 恢复工具
# Copyright (c) 2026 jnetzhou <742408364@qq.com>
# SPDX-License-Identifier: AGPL-3.0-or-later（详见根目录 LICENSE）
"""
周大航任务系统 - 数据备份 / 恢复工具（管理员用）

服务端每次写入 data.json 都会自动留档到 backups/（最快 5 分钟一份），
这个工具用来手动备份、查看历史、以及数据丢失后恢复。

用法：
  python backup_tool.py                 交互菜单（推荐，双击「备份与恢复.bat」）
  python backup_tool.py --list          列出所有备份
  python backup_tool.py --backup        立即备份一份
  python backup_tool.py --restore 1     恢复最新的一份（数字 = 列表里的序号）
  python backup_tool.py --restore data-20261027-153000.json
只依赖 Python 标准库。
"""
import json
import os
import re
import shutil
import sys
import time

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, 'data.json')
BACKUP_DIR = os.path.join(BASE_DIR, 'backups')
NAME_RE = re.compile(r'^data-\d{8}-\d{6}(-\d+)?\.json$')

# 恢复后把 updatedAt 往后推 5 分钟：浏览器的同步逻辑是「服务端更新才用服务端数据」，
# 这样所有设备下次打开页面时都会自动改用恢复后的数据，而不是把本地旧数据推回来。
RESTORE_BUMP_MS = 5 * 60 * 1000


def list_backups():
    if not os.path.isdir(BACKUP_DIR):
        return []
    return sorted(n for n in os.listdir(BACKUP_DIR) if NAME_RE.match(n))


def human_size(n):
    for unit in ('B', 'KB', 'MB', 'GB'):
        if n < 1024 or unit == 'GB':
            return f'{n:.1f}{unit}' if unit != 'B' else f'{int(n)}B'
        n /= 1024


def show_list():
    names = list_backups()
    if not names:
        print('还没有任何备份。先运行一次服务、或在菜单里选「立即备份」。')
        return
    print(f'共 {len(names)} 份备份（从新到旧，序号 1 = 最新）：')
    for i, name in enumerate(reversed(names), 1):
        path = os.path.join(BACKUP_DIR, name)
        st = os.stat(path)
        t = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(st.st_mtime))
        print(f'  {i:>3}. {name}   {t}   {human_size(st.st_size)}')
    print(f'\n备份目录：{BACKUP_DIR}')


def backup_now():
    if not os.path.exists(DATA_FILE):
        print(f'[错误] 找不到 {DATA_FILE}，没有可备份的数据。')
        return None
    os.makedirs(BACKUP_DIR, exist_ok=True)
    stamp = time.strftime('%Y%m%d-%H%M%S')
    dest = os.path.join(BACKUP_DIR, f'data-{stamp}.json')
    if os.path.exists(dest):
        dest = os.path.join(BACKUP_DIR, f'data-{stamp}-{int(time.time() * 1000) % 1000:03d}.json')
    # 用 copyfile：文件时间就是备份时间，列表里显示更直观
    shutil.copyfile(DATA_FILE, dest)
    print(f'[OK] 已备份：{os.path.basename(dest)}')
    return dest


def restore(target):
    names = list_backups()
    if not names:
        print('[错误] 没有可用的备份。')
        return False

    target = (target or '').strip()
    if target.isdigit():
        idx = int(target)
        if not 1 <= idx <= len(names):
            print(f'[错误] 序号要在 1～{len(names)} 之间。')
            return False
        name = names[-idx]
    else:
        name = os.path.basename(target)
        if name not in names:
            print(f'[错误] 备份目录里没有 {name}')
            return False

    src = os.path.join(BACKUP_DIR, name)
    try:
        with open(src, 'r', encoding='utf-8') as f:
            data = json.load(f)
        if not isinstance(data, dict):
            raise ValueError('内容不是 JSON 对象')
    except Exception as e:
        print(f'[错误] 这个备份文件读不出来：{e}')
        return False

    # 恢复前先把当前数据另存一份，万一恢复错了还能再回来
    if os.path.exists(DATA_FILE):
        safety = os.path.join(BACKUP_DIR, 'before-restore-' + time.strftime('%Y%m%d-%H%M%S') + '.json')
        shutil.copyfile(DATA_FILE, safety)
        print(f'[提示] 当前 data.json 已另存为 {os.path.basename(safety)}')

    # 推后 updatedAt，让所有浏览器下次打开时以恢复的数据为准
    data['updatedAt'] = int(time.time() * 1000) + RESTORE_BUMP_MS

    tmp = DATA_FILE + '.restore.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp, DATA_FILE)

    print(f'[OK] 已恢复：{name}')
    print('     请把所有设备上的页面刷新（或重新打开），浏览器会自动改用恢复后的数据。')
    return True


def menu():
    while True:
        print()
        print('=' * 46)
        print('   周大航任务系统 · 数据备份 / 恢复')
        print('=' * 46)
        print('   1. 查看备份列表')
        print('   2. 立即备份一份')
        print('   3. 从备份恢复数据')
        print('   0. 退出')
        print('=' * 46)
        choice = input('请输入序号：').strip()

        if choice == '1':
            show_list()
        elif choice == '2':
            backup_now()
        elif choice == '3':
            show_list()
            idx = input('\n要恢复哪一份？输入序号（1 = 最新，直接回车取消）：').strip()
            if not idx:
                print('已取消。')
                continue
            if input(f'确认恢复到第 {idx} 份？会覆盖当前数据（y/N）：').strip().lower() != 'y':
                print('已取消。')
                continue
            restore(idx)
        elif choice == '0':
            print('再见～')
            return
        else:
            print('没有这个选项，重新输入吧。')


def main():
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

    args = sys.argv[1:]
    if not args:
        menu()
    elif args[0] == '--list':
        show_list()
    elif args[0] == '--backup':
        backup_now()
    elif args[0] == '--restore':
        if len(args) < 2:
            print('用法：python backup_tool.py --restore 序号或文件名')
            sys.exit(1)
        sys.exit(0 if restore(args[1]) else 1)
    else:
        print(__doc__)


if __name__ == '__main__':
    main()
