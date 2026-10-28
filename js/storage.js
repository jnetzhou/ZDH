// 数据层：localStorage + 本地 data.json 双向同步
// - 所有读写仍走 localStorage（同步 API，页面逻辑无需改）
// - 每次保存后防抖推送一份完整快照到 /api/data，由 server.py 落盘到 data.json
// - 启动时拉取 data.json，按 updatedAt 判断用服务端数据还是把本地推上去
// - 没有服务端（如直接用 file:// 打开）时自动降级为纯 localStorage

const STORAGE_PREFIX = 'kid_task_';
const API_URL = '/api/data';
const DATA_KEYS = ['children', 'tasks', 'rewards', 'scoreLogs', 'currentChildId', 'parent', 'lockState'];

const Storage = {
  _updatedAt: 0,
  _syncTimer: null,
  _syncing: false,
  _remote: null,   // 启动时拉到的服务端快照，本地缺失的 key 用它兜底

  _get(key) {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('Storage get error:', e);
      return null;
    }
  },

  // 只写 localStorage，不触发同步（内部使用）
  _write(key, value) {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage set error:', e);
      return false;
    }
  },

  _set(key, value) {
    const ok = this._write(key, value);
    if (ok) {
      // 时间戳只增不减：从备份恢复后服务端 updatedAt 会略超前于本机时间，
      // 用纯 Date.now() 会退回过去，其他设备就会误判「本地更新」用旧数据把恢复结果冲掉
      this._updatedAt = Math.max(Date.now(), this._updatedAt + 1);
      localStorage.setItem(STORAGE_PREFIX + '__updatedAt', String(this._updatedAt));
      this._scheduleSync();
    }
    return ok;
  },

  // ---- 与服务端 data.json 同步 ----
  snapshot() {
    const data = { updatedAt: this._updatedAt };
    DATA_KEYS.forEach(k => {
      let v = this._get(k);
      // 本地被清空 / 配额写失败时为 null，用服务端快照兜底，避免把 data.json 写成 null
      if ((v === null || v === undefined) && this._remote && this._remote[k] != null) {
        v = this._remote[k];
      }
      data[k] = v;
    });
    return data;
  },

  _scheduleSync() {
    clearTimeout(this._syncTimer);
    this._syncTimer = setTimeout(() => this.syncToServer(), 300);
  },

  async syncToServer() {
    clearTimeout(this._syncTimer);
    this._syncTimer = null;
    if (this._syncing) {
      this._scheduleSync();
      return;
    }
    this._syncing = true;
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.snapshot())
      });
    } catch (e) {
      // 静态托管 / file:// 打开时没有接口，保持 localStorage 可用
    } finally {
      this._syncing = false;
    }
  },

  // 启动时调用：决定用 data.json 的数据还是把本地数据推上去
  async init() {
    const localUpdatedAt = parseInt(localStorage.getItem(STORAGE_PREFIX + '__updatedAt') || '0', 10);
    this._updatedAt = localUpdatedAt;

    const hasLocalData = DATA_KEYS.some(k => {
      const v = this._get(k);
      return Array.isArray(v) ? v.length > 0 : !!v;
    });

    let remote = null;
    try {
      const res = await fetch(API_URL, { cache: 'no-store' });
      if (res.ok) remote = await res.json();
    } catch (e) {
      remote = null;
    }

    if (remote && typeof remote === 'object') {
      this._remote = remote;
      const remoteUpdatedAt = remote.updatedAt || 0;
      const hasRemoteData = DATA_KEYS.some(k => {
        const v = remote[k];
        return Array.isArray(v) ? v.length > 0 : !!v;
      });

      // 只有「本地没数据」或「服务端明确更新」才用 data.json 覆盖本地，
      // 避免把用户在浏览器里已有的数据冲掉
      const localEmpty = !hasLocalData;
      const remoteNewer = hasRemoteData && localUpdatedAt > 0 && remoteUpdatedAt > localUpdatedAt;

      if (hasRemoteData && (localEmpty || remoteNewer)) {
        let needRepair = false;
        DATA_KEYS.forEach(k => {
          const v = remote[k];
          if (v === null || v === undefined) {
            // data.json 里某块数据丢了：保留本地现值，稍后补写回去
            if (this._get(k) != null) needRepair = true;
            return;
          }
          this._write(k, v);
        });
        this._updatedAt = remoteUpdatedAt || Date.now();
        localStorage.setItem(STORAGE_PREFIX + '__updatedAt', String(this._updatedAt));
        if (needRepair) await this.syncToServer();
      } else if (hasLocalData) {
        // 本地有数据 → 以本地为准，写进 data.json（首次运行会把旧数据带上）
        if (!this._updatedAt) {
          this._updatedAt = Date.now();
          localStorage.setItem(STORAGE_PREFIX + '__updatedAt', String(this._updatedAt));
        }
        await this.syncToServer();
      }
    }

    // 关页面前把未推送的改动补发一次
    window.addEventListener('pagehide', () => {
      if (!this._syncTimer) return;
      const body = JSON.stringify(this.snapshot());
      clearTimeout(this._syncTimer);
      this._syncTimer = null;
      if (navigator.sendBeacon) {
        navigator.sendBeacon(API_URL, new Blob([body], { type: 'application/json' }));
      }
    });
  },

  // ---- Children ----
  getChildren() {
    return this._get('children') || [];
  },

  saveChildren(list) {
    return this._set('children', list);
  },

  // ---- Tasks ----
  getTasks(childId) {
    const all = this._get('tasks') || [];
    return childId ? all.filter(t => t.childId === childId) : all;
  },

  saveTasks(list) {
    return this._set('tasks', list);
  },

  // ---- Rewards ----
  getRewards(childId) {
    const all = this._get('rewards') || [];
    return childId ? all.filter(r => r.childId === childId) : all;
  },

  saveRewards(list) {
    return this._set('rewards', list);
  },

  // ---- ScoreLogs (打卡记录) ----
  getScoreLogs(childId) {
    const all = this._get('scoreLogs') || [];
    return childId ? all.filter(l => l.childId === childId) : all;
  },

  saveScoreLogs(list) {
    return this._set('scoreLogs', list);
  },

  // ---- Current selected child ----
  getCurrentChildId() {
    return this._get('currentChildId');
  },

  setCurrentChildId(id) {
    return this._set('currentChildId', id);
  },

  // ---- 家长锁开关状态（写进 data.json，所有设备共用同一份） ----
  // 返回 true=上次是上锁，false=上次已解锁，null=还没记录过
  getLockState() {
    const v = this._get('lockState');
    if (v === null || v === undefined) return null;
    // 兼容旧版本：那时只在本机存了 '1' / '0' 两个裸字符串
    return v === true || v === 1 || v === '1';
  },

  saveLockState(locked) {
    return this._set('lockState', !!locked);
  },

  // ---- 家长密码（只存盐 + 哈希，不存明文） ----
  getParent() {
    return this._get('parent');
  },

  saveParent(value) {
    return this._set('parent', value);
  },

  // ---- 清空所有数据 (调试用) ----
  clearAll() {
    Object.keys(localStorage)
      .filter(k => k.startsWith(STORAGE_PREFIX))
      .forEach(k => localStorage.removeItem(k));
    this._updatedAt = Date.now();
    localStorage.setItem(STORAGE_PREFIX + '__updatedAt', String(this._updatedAt));
    this.syncToServer();
  }
};
