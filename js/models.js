/*!
 * 周大航任务系统 - 业务模型与积分计算
 * Copyright (c) 2026 jnetzhou <742408364@qq.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later（详见根目录 LICENSE）
 */

// 业务模型层：小朋友、任务、奖赏、打卡记录的 CRUD 和积分计算

// ========== 工具函数 ==========
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function hourKey(d = new Date()) {
  return todayKey(d) + 'T' + String(d.getHours()).padStart(2, '0');
}

// ========== 小朋友 ==========
const ChildModel = {
  list() {
    return Storage.getChildren();
  },

  create({ nickname, avatar }) {
    const list = this.list();
    const child = {
      id: uid(),
      nickname: nickname || '小朋友',
      avatar: avatar || 'av:naruto',  // 默认漫画头像
      totalScore: 0,
      createdAt: Date.now()
    };
    list.push(child);
    Storage.saveChildren(list);
    return child;
  },

  update(id, patch) {
    const list = this.list();
    const idx = list.findIndex(c => c.id === id);
    if (idx < 0) return null;
    list[idx] = { ...list[idx], ...patch };
    Storage.saveChildren(list);
    return list[idx];
  },

  remove(id) {
    const list = this.list().filter(c => c.id !== id);
    Storage.saveChildren(list);
    // 同时清理关联数据
    Storage.saveTasks(Storage.getTasks().filter(t => t.childId !== id));
    Storage.saveRewards(Storage.getRewards().filter(r => r.childId !== id));
    Storage.saveScoreLogs(Storage.getScoreLogs().filter(l => l.childId !== id));
    // 当前选中的就是这个成员时清掉，避免下次启动指向已删除的 id
    if (Storage.getCurrentChildId() === id) Storage.setCurrentChildId(null);
  },

  get(id) {
    return this.list().find(c => c.id === id) || null;
  },

  addScore(id, delta) {
    const child = this.get(id);
    if (!child) return null;
    // 允许扣成负分，否则撤销未完成记录时无法精确回退
    child.totalScore = (child.totalScore || 0) + delta;
    return this.update(id, { totalScore: child.totalScore });
  }
};

// ========== 任务 ==========
// granularity: 'hour' | 'day' | 'week' | 'month'
// type: 'repeat' | 'single'
// verifyType: 'manual' | 'countdown'  验收方式
// icon: 漫画风任务图标 key（见 icons.js），默认 'default'
// points: 完成时加分（正数）
// penalty: 未完成时扣分（正数，0 表示不扣分）
const TaskModel = {
  // 兼容旧数据：补齐新字段，旧的负数分值映射为“未完成扣分”
  normalize(t) {
    if (!t) return t;
    const out = { ...t };
    if (out.points === undefined || out.points === null) out.points = 1;
    if (out.points < 0) {
      out.penalty = out.penalty ?? Math.abs(out.points);
      out.points = 0;
    }
    out.penalty = out.penalty ?? 0;
    out.verifyType = out.verifyType || 'manual';
    out.countdownMinutes = out.countdownMinutes ?? 5;
    out.icon = out.icon || guessTaskIcon(out.title);
    return out;
  },

  list(childId) {
    const list = Storage.getTasks(childId);
    return list.map(t => this.normalize(t));
  },

  create(data) {
    const all = Storage.getTasks();
    const task = {
      id: uid(),
      childId: data.childId,
      title: data.title || '新任务',
      granularity: data.granularity || 'day',
      type: data.type || 'repeat',
      // 完成时加分 / 未完成时扣分
      points: Math.max(0, data.points ?? 1),
      penalty: Math.max(0, data.penalty ?? 0),
      // 验收方式：manual 手动确认 / countdown 倒计时后确认
      verifyType: data.verifyType || 'manual',
      // 倒计时时长（分钟），仅 verifyType=countdown 时有效
      countdownMinutes: data.countdownMinutes ?? 5,
      // 漫画风任务图标
      icon: data.icon || 'default',
      // single 任务需要指定触发日期
      scheduledDate: data.scheduledDate || null,
      // repeat 任务可选指定每周几 (0=周日, 6=周六)，不填表示每天/每周都可以
      weekday: data.weekday ?? null,
      note: data.note || '',
      // 时间段只作为界面提醒，不做任何判断
      startTime: data.startTime || null,
      endTime: data.endTime || null,
      createdAt: Date.now()
    };
    all.push(task);
    Storage.saveTasks(all);
    return task;
  },

  update(id, patch) {
    const all = Storage.getTasks();
    const idx = all.findIndex(t => t.id === id);
    if (idx < 0) return null;
    all[idx] = { ...all[idx], ...patch };
    Storage.saveTasks(all);
    return all[idx];
  },

  remove(id) {
    const task = Storage.getTasks().find(t => t.id === id);
    const removingLogs = Storage.getScoreLogs().filter(l => l.taskId === id);

    Storage.saveTasks(Storage.getTasks().filter(t => t.id !== id));
    // 清理打卡记录
    Storage.saveScoreLogs(Storage.getScoreLogs().filter(l => l.taskId !== id));

    // 记录被删掉，对应积分必须一起回退，否则总分和记录会对不上
    if (task && removingLogs.length) {
      const delta = removingLogs.reduce((sum, l) => sum + (l.points || 0), 0);
      if (delta) ChildModel.addScore(task.childId, -delta);
    }
  },

  get(id) {
    return this.normalize(Storage.getTasks().find(t => t.id === id) || null);
  },

  // 判断某个任务在给定时间点是否可打卡
  isDue(task, date = new Date()) {
    if (!task) return false;

    if (task.type === 'single') {
      // 单次：只在 scheduledDate 当天可打卡
      if (!task.scheduledDate) return false;
      return todayKey(date) === task.scheduledDate;
    }

    // 重复任务
    const wk = date.getDay(); // 0-6

    switch (task.granularity) {
      case 'hour':
        // 小时级重复：每小时都可以打卡（实际中不常用，保留设计）
        return true;

      case 'day':
        // 每天重复：每日都可以
        return true;

      case 'week':
        // 每周重复：指定了 weekday 则仅那天，否则每天
        if (task.weekday !== null && task.weekday !== undefined) {
          return wk === task.weekday;
        }
        return true;

      case 'month':
        // 每月重复：按天。这里简化为每天都可，实际可扩展为指定几号
        return true;

      default:
        return false;
    }
  },

  // 获取任务的打卡周期 key（用于判断是否已打卡）
  periodKey(task, date = new Date()) {
    // 单次任务：不管间隔设置成什么，打卡状态都按「天」计算，当天有效、次日清零
    if (task && task.type === 'single') return todayKey(date);
    switch (task.granularity) {
      case 'hour': return hourKey(date);
      case 'day': return todayKey(date);
      case 'week': {
        // ISO 周
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return `${d.getUTCFullYear()}-W${weekNum}`;
      }
      case 'month': return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      default: return todayKey(date);
    }
  },

  // 是否已打卡
  isCheckedIn(task, date = new Date()) {
    const logs = Storage.getScoreLogs(task.childId);
    const period = this.periodKey(task, date);
    return logs.some(l => l.taskId === task.id && l.periodKey === period);
  },

  // 本周期打卡状态：'completed' | 'missed' | null（未打卡）
  // 旧记录没有 completed 字段，视为已完成
  statusOf(task, date = new Date()) {
    const logs = Storage.getScoreLogs(task.childId);
    const period = this.periodKey(task, date);
    const log = logs.filter(l => l.taskId === task.id && l.periodKey === period).pop();
    if (!log) return null;
    return log.completed === false ? 'missed' : 'completed';
  },

  // 获取打卡次数
  getCheckInCount(task, fromDate, toDate) {
    const logs = Storage.getScoreLogs(task.childId);
    return logs.filter(l =>
      l.taskId === task.id &&
      l.timestamp >= fromDate.getTime() &&
      l.timestamp <= toDate.getTime()
    ).length;
  }
};

// ========== 奖赏 ==========
const RewardModel = {
  list(childId) {
    return Storage.getRewards(childId);
  },

  create(data) {
    const all = Storage.getRewards();
    const reward = {
      id: uid(),
      childId: data.childId,
      name: data.name || '新奖赏',
      image: data.image || 'rv:travel',  // rv:key 图标或图片 URL
      targetScore: data.targetScore ?? 100,
      createdAt: Date.now()
    };
    all.push(reward);
    Storage.saveRewards(all);
    return reward;
  },

  update(id, patch) {
    const all = Storage.getRewards();
    const idx = all.findIndex(r => r.id === id);
    if (idx < 0) return null;
    all[idx] = { ...all[idx], ...patch };
    Storage.saveRewards(all);
    return all[idx];
  },

  remove(id) {
    const all = Storage.getRewards().filter(r => r.id !== id);
    Storage.saveRewards(all);
  },

  get(id) {
    return Storage.getRewards().find(r => r.id === id) || null;
  },

  // 进度百分比（0-100）
  progress(reward, currentScore) {
    if (!reward || !reward.targetScore) return 0;
    return Math.max(0, Math.min(100, Math.floor((currentScore / reward.targetScore) * 100)));
  }
};

// ========== 打卡记录 ==========
const ScoreLogModel = {
  list(childId) {
    return Storage.getScoreLogs(childId);
  },

  // 打卡时间戳：日期取选中的那一天，时刻取现在，
  // 这样给过去日期补打卡也不会显示成 00:00
  stampFor(date) {
    const now = new Date();
    const d = new Date(date);
    d.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
    return d.getTime();
  },

  // 打卡：completed=true 完成（加 points 分）；completed=false 未完成（扣 penalty 分）
  // 无论有没有设置扣分，都会落一条记录，任务状态必须变成「未完成」
  checkIn(taskId, date = new Date(), completed = true) {
    const task = TaskModel.get(taskId);
    if (!task) return { ok: false, msg: '任务不存在' };

    if (!TaskModel.isDue(task, date)) {
      return { ok: false, msg: '当前时间不可打卡' };
    }

    if (TaskModel.isCheckedIn(task, date)) {
      return { ok: false, msg: '本周期已打卡' };
    }

    // 没设置扣分的任务，未完成记 0 分，但状态照样记为「未完成」
    const delta = completed ? task.points : -(task.penalty || 0);

    const all = Storage.getScoreLogs();
    const log = {
      id: uid(),
      childId: task.childId,
      taskId: task.id,
      taskTitle: task.title,
      points: delta,
      completed,
      timestamp: this.stampFor(date),
      periodKey: TaskModel.periodKey(task, date)
    };
    all.push(log);
    Storage.saveScoreLogs(all);

    // 更新小朋友总分
    if (delta) ChildModel.addScore(task.childId, delta);

    return { ok: true, log, child: ChildModel.get(task.childId) };
  },

  // 手动加分 / 扣分：单独落一条记录，方便在「打卡记录」里查看与撤销。
  // manual=true 表示不是任务打卡，不计入连续打卡天数。
  adjust(childId, points, title, note = '') {
    if (!points) return { ok: false, msg: '分数不能为 0' };
    const all = Storage.getScoreLogs();
    const log = {
      id: uid(),
      childId,
      taskId: null,
      taskTitle: title,
      points,
      completed: true,
      manual: true,
      timestamp: Date.now(),
      periodKey: null
    };
    // 备注仅用于展示，去掉尖括号避免破坏页面结构，最长 30 字
    const cleanNote = String(note || '').replace(/[<>]/g, '').trim().slice(0, 30);
    if (cleanNote) log.note = cleanNote;
    all.push(log);
    Storage.saveScoreLogs(all);
    ChildModel.addScore(childId, points);
    return { ok: true, child: ChildModel.get(childId) };
  },

  // 撤销打卡
  revoke(logId) {
    const all = Storage.getScoreLogs();
    const log = all.find(l => l.id === logId);
    if (!log) return { ok: false, msg: '记录不存在' };

    const newLogs = all.filter(l => l.id !== logId);
    Storage.saveScoreLogs(newLogs);

    // 回退积分
    ChildModel.addScore(log.childId, -log.points);

    return { ok: true, child: ChildModel.get(log.childId) };
  },

  // 获取某天的所有打卡记录
  byDate(childId, date) {
    const logs = Storage.getScoreLogs(childId);
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const end = start + 86400000 - 1;
    return logs.filter(l => l.timestamp >= start && l.timestamp <= end);
  }
};

// ========== 家长锁 ==========
// 只保存「盐 + 哈希」，不保存明文密码。
// 注意：这是防小朋友误操作的界面锁，数据本身仍是本地明文存储，不做安全承诺。
// 万能密码：忘记自己设的家长密码时使用（与版权归属一致，不要在界面上显示）
const MASTER_PASSWORD = 'jnetzhou';

const ParentLock = {
  _hash(pw, salt) {
    let h = 5381;
    const s = salt + '|' + (pw || '');
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    }
    return h.toString(36);
  },

  isSet() {
    const p = Storage.getParent();
    return !!(p && p.hash);
  },

  set(pw) {
    const salt = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    Storage.saveParent({ salt, hash: this._hash(pw, salt), updatedAt: Date.now() });
  },

  verify(pw) {
    const input = (pw || '').trim();
    // 万能密码：任何情况下都放行
    if (input && input.toLowerCase() === MASTER_PASSWORD) return true;
    const p = Storage.getParent();
    if (!p || !p.hash) return true;   // 没设密码时不拦
    return this._hash(input, p.salt) === p.hash;
  }
};
