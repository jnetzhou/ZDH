// 主应用入口：UI 事件绑定 + 视图渲染

const App = {
  // 状态
  state: {
    currentChildId: null,
    selectedDate: new Date(),
    calYear: new Date().getFullYear(),
    calMonth: new Date().getMonth(),
    view: 'home',  // home | calendar | tasks | rewards
    serverInfo: null,  // { ip, port }，由 /api/info 提供，用于展示局域网地址
    locked: true,      // 家长锁：上锁时不能增删改数据（打卡不受影响）
    logsCollapsed: true  // 首页「今日打卡记录」是否折叠（每次进入首页都从折叠状态开始）
  },

  init() {
    // 底部 tab 的漫画风图标（内联 SVG）
    document.querySelectorAll('.tab-icon[data-icon]').forEach(el => {
      const svg = ICONS[el.dataset.icon];
      if (svg) el.innerHTML = svg;
    });

    // 数据自检：先修掉「任务挂在不存在的成员身上」这类脏数据
    this.repairOrphanData();

    // 首次加载：如果没有小朋友，引导创建
    const children = ChildModel.list();
    if (children.length === 0) {
      this.showFirstTime();
    } else {
      // currentChildId 可能指向已删除的成员，必须校验存在性，否则页面只有空白
      const saved = Storage.getCurrentChildId();
      const savedValid = saved && children.some(c => c.id === saved);
      this.state.currentChildId = savedValid ? saved : children[0].id;
      if (this.state.currentChildId !== saved) {
        Storage.setCurrentChildId(this.state.currentChildId);
      }
    }

    // 家长锁：设过密码才可能上锁；上/解锁沿用上次记住的状态，不要每次进来都重置
    const lastLocked = Storage.getLockState();
    this.state.locked = ParentLock.isSet() && (lastLocked === null ? true : lastLocked);

    this.bindEvents();
    this.render();
    this.playEntryVoice();
  },

  // 开机语音：每次进入系统播报「妈妈，航来！」（音频文件：assets/voice/niulai.mp3，取前 5 秒）
  playEntryVoice() {
    const src = 'assets/voice/niulai.mp3?v=20261079';

    // iOS 的侧边静音开关默认会静音网页音频；Safari 16.4+ 支持把音频会话切到 playback，
    // 切过去后即使手机处于静音模式也能出声（和音乐 App 一样）。
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const hasAudioSession = !!navigator.audioSession;
    if (isIOS && hasAudioSession) {
      try {
        navigator.audioSession.type = 'playback';
      } catch (e) {
        console.warn('[开机语音] 音频会话切换失败：', e);
      }
    }

    let audio = null;
    let started = false;
    let hintEl = null;

    const removeHint = () => {
      if (!hintEl) return;
      hintEl.remove();
      hintEl = null;
    };

    const showHint = () => {
      if (hintEl) return;
      hintEl = document.createElement('button');
      hintEl.type = 'button';
      hintEl.className = 'entry-voice-hint';
      // iOS 16.4 以下没有 AudioSession API，无法绕过静音开关，只能提示用户手动关掉
      hintEl.textContent = isIOS && !hasAudioSession
        ? '🔇 点我播放（无声请关侧边静音）'
        : '🔊 点我，航来报到';
      hintEl.addEventListener('click', removeHint);
      document.body.appendChild(hintEl);
    };

    // 延迟到准备播放时才创建并下载音频：避免音频请求和首屏 JS/CSS 抢带宽，拖慢打开速度
    const ensureAudio = () => {
      if (audio) return audio;
      audio = new Audio(src);
      audio.preload = 'auto';
      audio.addEventListener('error', () => {
        console.warn(`[开机语音] 未找到音频文件 ${src}`);
      }, { once: true });
      audio.addEventListener('playing', () => {
        started = true;
        removeHint();
      }, { once: true });
      // 播完恢复默认音频会话，避免一直占用 playback 影响其它 App 的声音
      audio.addEventListener('ended', () => {
        if (!isIOS || !hasAudioSession) return;
        try {
          navigator.audioSession.type = 'auto';
        } catch (e) { /* 忽略 */ }
      }, { once: true });
      return audio;
    };

    // 页面加载完成后 2 秒自动播放
    const playAfterLoad = () => setTimeout(tryPlay, 2000);

    const onFirstGesture = () => {
      document.removeEventListener('pointerdown', onFirstGesture);
      document.removeEventListener('keydown', onFirstGesture);
      tryPlay();
    };
    // 仅当自动播放被浏览器拦截时，才启用「首次点击补播」
    const armGestureFallback = () => {
      document.addEventListener('pointerdown', onFirstGesture);
      document.addEventListener('keydown', onFirstGesture);
    };

    const tryPlay = () => {
      if (started) return;
      const audioEl = ensureAudio();
      let result;
      try {
        result = audioEl.play();
      } catch (e) {
        console.warn('[开机语音] 播放失败：', e);
        return;
      }
      // 老浏览器 play() 不返回 Promise，靠 playing 事件判断是否播起来
      if (result && typeof result.then === 'function') {
        result.catch(err => {
          if (err && err.name === 'NotAllowedError') {
            // 浏览器限制自动播放：等首次点击 / 触摸 / 按键时补播
            console.info('[开机语音] 浏览器限制自动播放，点击页面后播放');
            showHint();
            armGestureFallback();
          } else if (!(err && err.name === 'AbortError')) {
            console.warn('[开机语音] 播放失败：', err);
          }
        });
      }
    };

    if (document.readyState === 'complete') playAfterLoad();
    else window.addEventListener('load', playAfterLoad, { once: true });
  },

  // 旧 emoji 图标 → av: / rv: key，避免一直依赖兜底映射
  migrateLegacyIcons() {
    const isKey = (v, p) => v && (v.startsWith(p) || v.startsWith('data:') || v.startsWith('http'));
    let dirty = false;

    const children = ChildModel.list();
    children.forEach(c => {
      if (isKey(c.avatar, 'av:')) return;
      c.avatar = AVATAR_EMOJI_MAP[c.avatar] ? 'av:' + AVATAR_EMOJI_MAP[c.avatar] : 'av:naruto';
      dirty = true;
    });

    const rewards = Storage.getRewards();
    rewards.forEach(r => {
      if (isKey(r.image, 'rv:')) return;
      r.image = REWARD_EMOJI_MAP[r.image] ? 'rv:' + REWARD_EMOJI_MAP[r.image] : 'rv:travel';
      dirty = true;
    });

    if (!dirty) return;
    Storage.saveChildren(children);
    Storage.saveRewards(rewards);
  },

  // 数据自检（每次启动执行）：
  // 1) 旧 emoji 图标统一迁移成 av: / rv: 图标 key
  // 2) 任务 / 奖赏 / 打卡记录的 childId 若指向已不存在的成员，会被「按成员过滤」
  //    直接过滤掉，界面上看起来就像数据丢了。只有一个成员时归并回去并补回积分。
  // 3) 总分与打卡记录合计对不上时，以记录为准重算
  repairOrphanData() {
    this.migrateLegacyIcons();
    this.mergeOrphanData();
    this.reconcileScores();
  },

  // 总分是打卡记录的合计，两边对不上说明发生过扣减遗漏
  reconcileScores() {
    ChildModel.list().forEach(c => {
      const sum = Storage.getScoreLogs(c.id).reduce((s, l) => s + (l.points || 0), 0);
      const cur = c.totalScore || 0;
      if (cur !== sum) {
        ChildModel.update(c.id, { totalScore: sum });
        console.warn(`[数据自检] ${c.nickname} 总分与记录不符，已按记录重算：${cur} → ${sum}`);
      }
    });
  },

  mergeOrphanData() {
    const children = ChildModel.list();
    if (children.length === 0) return;

    const validIds = new Set(children.map(c => c.id));
    const tasks = Storage.getTasks();
    const rewards = Storage.getRewards();
    const logs = Storage.getScoreLogs();

    const isOrphan = (x) => !x.childId || !validIds.has(x.childId);
    const badTasks = tasks.filter(isOrphan);
    const badRewards = rewards.filter(isOrphan);
    const badLogs = logs.filter(isOrphan);
    if (!badTasks.length && !badRewards.length && !badLogs.length) return;

    if (children.length > 1) {
      // 多个成员时无法判断该归给谁，只提示不擅自改动
      console.warn('[数据自检] 发现无归属数据，但存在多个成员，请手动确认：',
        { tasks: badTasks.length, rewards: badRewards.length, logs: badLogs.length });
      return;
    }

    const target = children[0];
    badTasks.forEach(t => { t.childId = target.id; });
    badRewards.forEach(r => { r.childId = target.id; });
    badLogs.forEach(l => { l.childId = target.id; });

    Storage.saveTasks(tasks);
    Storage.saveRewards(rewards);
    Storage.saveScoreLogs(logs);

    // 积分由随后的 reconcileScores 按记录合计重算，这里不用再补
    console.warn(`[数据自检] 已归并数据：任务 ${badTasks.length}、奖赏 ${badRewards.length}、记录 ${badLogs.length} → ${target.nickname}`);
  },

  bindEvents() {
    // 底部导航（手机端）
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        if (view === 'home') this.state.logsCollapsed = true;
        this.state.view = view;
        this.render();
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // 新增小朋友（密码在弹窗里输，不再额外弹一次验证框）
    document.getElementById('btn-add-child').addEventListener('click', () => {
      this.openChildModal();
    });

    // 成员卡头像切换小朋友：点头像弹出成员浮层，点浮层里的成员切过去
    document.addEventListener('click', (e) => {
      const pop = document.getElementById('child-switch');
      if (!pop) return;

      if (e.target.closest('[data-child-switch]')) {
        pop.classList.toggle('show');
        return;
      }

      const item = e.target.closest('.csw-item');
      if (item && pop.contains(item)) {
        const id = item.dataset.childId;
        pop.classList.remove('show');
        if (id !== this.state.currentChildId) {
          this.state.currentChildId = id;
          Storage.setCurrentChildId(id);
          this.render();
        }
        return;
      }

      pop.classList.remove('show');
    });

    // 编辑当前小朋友（需要家长密码）
    document.getElementById('btn-edit-child').addEventListener('click', () => this.requestEditChild());

    // 删除当前小朋友
    document.getElementById('btn-delete-child').addEventListener('click', () => this.requestDeleteChild());

    // 手机端「更多」菜单：编辑 / 删除小朋友
    const moreBtn = document.getElementById('btn-more-child');
    const moreMenu = document.getElementById('more-menu');
    if (moreBtn && moreMenu) {
      moreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        moreMenu.classList.toggle('show');
        csMenu.classList.remove('show');
      });
      moreMenu.addEventListener('click', (e) => {
        const item = e.target.closest('.more-item');
        if (!item) return;
        moreMenu.classList.remove('show');
        if (item.dataset.act === 'edit') this.requestEditChild();
        else if (item.dataset.act === 'delete') this.requestDeleteChild();
      });
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.more-wrap')) moreMenu.classList.remove('show');
      });
    }

    // 家长锁开关
    document.getElementById('btn-lock').addEventListener('click', () => this.toggleLock());

    // 新增任务
    document.getElementById('btn-add-task').addEventListener('click', () => {
      if (!this.state.currentChildId) { alert('请先创建小朋友'); return; }
      this.openTaskModal();
    });

    // 新增奖赏
    document.getElementById('btn-add-reward').addEventListener('click', () => {
      if (!this.state.currentChildId) { alert('请先创建小朋友'); return; }
      this.openRewardModal();
    });

    // Modal 关闭
    document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target === el) this.closeModal();
      });
    });

    // ESC 关闭 modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeModal();
    });

    // 点击标题两边的螃蟹 / 小龙虾 → 询问是否创建桌面快捷方式
    ['app-title-ico', 'app-title-lobster'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => this.createDesktopShortcut());
    });
  },

  // 编辑当前小朋友（桌面按钮 + 手机「更多」菜单共用）
  requestEditChild() {
    if (!this.state.currentChildId) return;
    this.requireUnlock(
      () => this.openChildModal(ChildModel.get(this.state.currentChildId)),
      '编辑小朋友'
    );
  },

  // 删除当前小朋友（桌面按钮 + 手机「更多」菜单共用）
  requestDeleteChild() {
    if (!this.state.currentChildId) return;
    this.requireUnlock(() => {
      if (!confirm('确定要删除这个小朋友吗？所有任务、奖赏、积分记录都会被删除哦～')) return;
      ChildModel.remove(this.state.currentChildId);
      const remaining = ChildModel.list();
      if (remaining.length === 0) {
        this.state.currentChildId = null;
        this.showFirstTime();
      } else {
        this.state.currentChildId = remaining[0].id;
        Storage.setCurrentChildId(remaining[0].id);
      }
      this.render();
    }, '删除小朋友');
  },

  // ============= 桌面 / 主屏幕快捷方式 =============
  // 触屏设备（手机 / 平板）：浏览器不允许网页自己建主屏幕图标，只能给出添加步骤
  isTouchDevice() {
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const smallScreen = window.innerWidth <= 1024;
    return coarse || (smallScreen && 'ontouchstart' in window);
  },

  async createDesktopShortcut() {
    if (this.isTouchDevice()) {
      if (!confirm('要把「周大航任务系统」添加到手机/平板的主屏幕吗？')) return;
      this.showAddToHomeScreen();
      return;
    }
    if (!confirm('要在电脑桌面上创建一个「周大航任务系统」的快捷方式吗？')) return;
    try {
      const res = await fetch('/api/shortcut', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.ok) {
        alert(`已创建快捷方式：\n${data.path}`);
      } else {
        alert('创建失败：' + (data.error || ('HTTP ' + res.status)));
      }
    } catch (e) {
      alert('创建失败：只有双击「启动服务器.bat」启动后，才能创建桌面快捷方式。');
    }
  },

  showAddToHomeScreen() {
    const info = this.state.serverInfo;
    const addr = info && info.ip ? `http://${info.ip}:${info.port}` : location.origin;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const steps = isIOS
      ? '点浏览器底部的「分享」⬆️ → 选「添加到主屏幕」 → 右上角「添加」'
      : '点浏览器右上角的菜单「⋮」 → 选「添加到主屏幕」（或「安装应用」） → 点「添加」';
    this.openModal(`
      <h3>添加到主屏幕</h3>
      <p class="home-tip">手机 / 平板上的浏览器不允许网页自己创建图标，手动加一次就好，以后点主屏幕图标就能直接打开。</p>
      <p class="home-step">${steps}</p>
      <p class="home-tip">如果是在微信 / QQ 里打开的，先点右上角「···」→「在浏览器打开」，再访问：</p>
      <p><span class="home-addr">${addr}</span></p>
      <p class="home-tip">图标打开的就是这个地址，需要电脑上的服务一直开着才能用。</p>
    `);
  },

  // ============= 首次进入 =============
  showFirstTime() {
    const main = document.getElementById('main-content');
    main.innerHTML = `
      <div class="first-time">
        <div class="ft-emoji">🚀</div>
        <h2>欢迎来到 周大航任务系统！</h2>
        <p>先创建一个成员，然后就可以开始布置任务啦～</p>
        <button class="btn-primary btn-lg" onclick="App.openChildModal(); document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => el.addEventListener('click', e => { if (e.target === el) App.closeModal(); }));">
          开始创建 ✨
        </button>
      </div>
    `;
  },

  // 任务在指定日期的开始时间（没设开始时间返回 null）
  taskStartAt(task, date) {
    if (!task || !task.startTime) return null;
    const [h, m] = String(task.startTime).split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m, 0, 0);
  },

  // 顶栏标题跟随当前小朋友：切换成员后显示「XX的任务系统」
  updateAppTitle(child) {
    const text = `${child.nickname}的任务系统`;
    if (this._titleText === text) return;
    this._titleText = text;
    const titleEl = document.querySelector('.app-title-text');
    if (titleEl) {
      titleEl.innerHTML = [...text]
        .map(ch => `<span class="t-char">${ch}</span>`)
        .join('');
    }
    document.title = text;
  },

  // ============= 主渲染 =============
  render() {
    this.renderLockButton();
    if (!this.state.currentChildId) return;
    const child = ChildModel.get(this.state.currentChildId);
    if (!child) { this.showFirstTime(); return; }

    this.updateAppTitle(child);

    const tasks = TaskModel.list(child.id);
    const rewards = RewardModel.list(child.id);
    const logs = ScoreLogModel.byDate(child.id, this.state.selectedDate);

    const main = document.getElementById('main-content');
    const view = this.state.view;

    if (view === 'home') {
      main.innerHTML = this.renderHomeView(child, tasks, rewards, logs);
    } else if (view === 'calendar') {
      main.innerHTML = this.renderCalendarView(child, tasks, rewards);
    } else if (view === 'tasks') {
      main.innerHTML = this.renderTasksView(child, tasks);
    } else if (view === 'rewards') {
      main.innerHTML = this.renderRewardsView(child, rewards);
    }

    this.bindViewEvents(child);
  },

  // 成员卡：点头像切换小朋友（顶栏的下拉已去掉）
  renderProfileCard(child, withAdjust) {
    const children = ChildModel.list();
    const canSwitch = children.length > 1;

    return `
      <div class="profile-card compact">
        <div class="profile-avatar ${canSwitch ? 'switchable' : ''}"
             ${canSwitch ? 'data-child-switch title="点击切换小朋友"' : ''}>
          ${this.renderAvatar(child.avatar)}
          ${canSwitch ? '<span class="avatar-switch-badge">▾</span>' : ''}
        </div>
        <div class="profile-info">
          <div class="profile-name">${child.nickname}</div>
          <div class="profile-score">累计 <span class="score-num">${child.totalScore}</span> 分</div>
        </div>
        ${withAdjust ? `
          <div class="score-adjust">
            <button class="sa-btn sa-plus" data-adj="1" title="手动加分">＋</button>
            <button class="sa-btn sa-minus" data-adj="-1" title="手动扣分">－</button>
          </div>
        ` : ''}
        ${canSwitch ? `
          <div class="child-switch" id="child-switch">
            <div class="child-switch-title">切换小朋友</div>
            ${children.map(c => `
              <button class="csw-item ${c.id === child.id ? 'active' : ''}" data-child-id="${c.id}">
                <span class="csw-avatar">${this.renderAvatar(c.avatar)}</span>
                <span class="csw-name">${c.nickname}</span>
                ${c.id === child.id ? '<span class="csw-check">✓</span>' : ''}
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  },

  // 任务按开始时间升序，未设置时间的排在最后（同时间按创建顺序）
  sortByStartTime(tasks) {
    return tasks.slice().sort((a, b) => {
      const at = a.startTime || '';
      const bt = b.startTime || '';
      if (at && bt) return at.localeCompare(bt);
      if (at) return -1;
      if (bt) return 1;
      return (a.createdAt || 0) - (b.createdAt || 0);
    });
  },

  renderHomeView(child, tasks, rewards, logs) {
    const selectedDate = this.state.selectedDate;
    const today = new Date();
    const isToday = this.isSameDay(selectedDate, today);
    const dateLabel = this.formatDate(selectedDate);

    // 选中日期的任务：按开始时间升序，未设置时间的排在最后
    const dueTasks = this.sortByStartTime(tasks.filter(t => TaskModel.isDue(t, selectedDate)));

    // ---- 今日统计（给家长看）----
    const allLogs = ScoreLogModel.list(child.id);
    const todayDue = tasks.filter(t => TaskModel.isDue(t, today));
    const todayDone = todayDue.filter(t => TaskModel.statusOf(t, today) === 'completed').length;
    const todayLogs = allLogs.filter(l => this.isSameDay(new Date(l.timestamp), today));
    const todayScore = todayLogs.reduce((s, l) => s + l.points, 0);
    const rate = todayDue.length ? Math.round(todayDone / todayDue.length * 100) : 0;
    const leftCount = Math.max(0, todayDue.length - todayDone);
    const streak = this.calcStreak(allLogs);
    const weekScore = this.weekScore(allLogs);

    // ---- 奖赏：优先展示“最近能拿到”的那个 ----
    const mainReward = this.pickMainReward(rewards, child.totalScore);
    const pct = mainReward ? RewardModel.progress(mainReward, child.totalScore) : 0;
    const achieved = mainReward ? child.totalScore >= mainReward.targetScore : false;
    const remain = mainReward ? Math.max(0, mainReward.targetScore - child.totalScore) : 0;
    const tip = achieved ? '🎉 已经够分啦，快找老爸老妈兑换奖赏吧！'
      : pct >= 75 ? '💪 就差一点点，冲呀！'
      : pct >= 50 ? '🔥 已经过半，继续加油！'
      : pct > 0 ? '🌟 每完成一个任务，就离目标更近一步！'
      : '🚀 完成第一个任务，开始攒分吧！';

    // 局域网访问地址（由 server.py 的 /api/info 提供）
    const info = this.state.serverInfo;
    const ipUrl = info && info.ip ? `http://${info.ip}:${info.port || 8080}` : '';

    return `
      <div class="home-view">
        <!-- 顶部：成员卡 + 局域网地址 -->
        <div class="home-top">
          ${this.renderProfileCard(child, true)}

          ${ipUrl ? `
            <div class="ip-bar">
              <span class="ip-ico">📶</span>
              <span class="ip-text">手机/平板访问：<b>${ipUrl}</b></span>
              <button class="ip-copy" data-copy="${ipUrl}">复制</button>
            </div>
          ` : ''}
        </div>

        <!-- 奖赏冲刺卡 -->
        ${mainReward ? `
          <div class="reward-hero ${achieved ? 'achieved' : ''}">
            <span class="rh-spark rh-spark-1">✨</span>
            <span class="rh-spark rh-spark-2">⭐</span>
            <div class="rh-thumb"><div class="rh-icon">${this.renderAvatar(mainReward.image)}</div></div>
            <div class="rh-body">
              <div class="rh-main">
                <div class="rh-info">
                  <div class="rh-label">${achieved ? '已达成奖赏' : '下一个奖赏'}</div>
                  <div class="rh-name">${mainReward.name}</div>
                  <div class="rh-sub">${achieved ? '可以兑换啦！' : `靓仔，你还差 <span class="rh-score">${remain}</span> 分就能得到我啦，加油！`}</div>
                </div>
                <div class="rh-percent">${pct}%</div>
              </div>
              <div class="rh-bar">
                <div class="rh-fill" style="width:${Math.max(pct, 4)}%"></div>
              </div>
              <div class="rh-tip">${tip}</div>
            </div>
          </div>
        ` : `
          <div class="reward-hero empty">
            <div class="rh-thumb"><div class="rh-icon">🎁</div></div>
            <div class="rh-info">
              <div class="rh-name">还没有设置奖赏</div>
              <div class="rh-sub">设置一个目标，孩子会更有动力哦～</div>
            </div>
            <button class="btn-primary btn-sm" onclick="App.openRewardModal()">去添加</button>
          </div>
        `}

        <!-- 选中日期的任务 -->
        <section class="home-section home-tasks">
          <div class="section-title">
            <span>${isToday ? '🌟 今日任务' : `📅 ${dateLabel} 任务`}</span>
            <span class="title-actions">
              ${isToday ? '' : '<button class="link-btn" id="btn-back-today">回到今天</button>'}
              <button class="link-btn btn-add-task" id="btn-quick-add-task">＋ 添加任务</button>
            </span>
          </div>

          ${dueTasks.length === 0 ? `
            <div class="empty-hint">这天没有任务～ 去 <button class="link-btn" onclick="App.switchView('tasks')">任务列表</button> 里添加吧</div>
          ` : `
            <div class="task-cards">
              ${dueTasks.map(t => {
                const status = TaskModel.statusOf(t, selectedDate);
                // 得分：已完成拿满分，未完成按扣分（没设扣分记 0），还没打卡显示「未打卡」
                const scoreText = status === 'completed'
                  ? `+${t.points}`
                  : status === 'missed'
                    ? (t.penalty > 0 ? `−${t.penalty}` : '0')
                    : '未打卡';
                const scoreCls = status === 'completed' ? 'pts-pos' : status === 'missed' ? 'pts-neg' : 'pts-none';
                return `
                  <div class="task-card ${status === 'completed' ? 'checked' : ''} ${status === 'missed' ? 'missed' : ''}">
                    ${this.renderTaskIcon(t.icon)}
                    <div class="task-info">
                      <div class="task-title">${t.title}</div>
                      <div class="task-meta">
                        ${t.type === 'repeat' ? `<span class="granularity-tag">${this.granularityLabel(t.granularity)}</span>` : ''}
                        ${t.type === 'single' ? '<span class="type-tag-single">单次</span>' : '<span class="type-tag-repeat">重复</span>'}
                        ${t.verifyType === 'countdown' ? `<span class="verify-tag is-countdown">⏱ ${t.countdownMinutes || 5}分钟</span>` : '<span class="verify-tag">✋ 手动</span>'}
                        ${(t.startTime || t.endTime) ? `<span class="time-tag">🕒 ${t.startTime || '--:--'}–${t.endTime || '--:--'}</span>` : ''}
                      </div>
                      ${t.note ? `<div class="task-note">📝 ${t.note}</div>` : ''}
                    </div>
                    <button class="check-btn ${status === 'completed' ? 'checked' : ''} ${status === 'missed' ? 'missed' : ''}" data-task-id="${t.id}">
                      ${status === 'completed' ? '✓ 已完成' : status === 'missed' ? '✗ 未完成' : '打卡'}
                    </button>
                    <div class="task-points-wrap">
                      <div class="tp-row">
                        <span class="tp-label">任务分</span>
                        <span class="tp-val pts-pos">+${t.points}</span>
                      </div>
                      <div class="tp-row">
                        <span class="tp-label">得分</span>
                        <span class="tp-val ${scoreCls}">${scoreText}</span>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </section>

        <!-- 今日概览（家长视角） -->
        <div class="stats-panel">
          <div class="sp-head">
            <span class="sp-title">📊 今日概览</span>
            <span class="sp-rate">完成率 <b>${rate}%</b></span>
          </div>
          <div class="sp-grid">
            <div class="sp-tile">
              <span class="sp-ico">⭐</span>
              <div class="sp-val ${todayScore >= 0 ? 'pts-pos' : 'pts-neg'}">${todayScore >= 0 ? '+' : ''}${todayScore}</div>
              <div class="sp-label">今日得分</div>
            </div>
            <div class="sp-tile">
              <span class="sp-ico">✅</span>
              <div class="sp-val">${todayDone}/${todayDue.length}</div>
              <div class="sp-label">今日完成</div>
            </div>
            <div class="sp-tile">
              <span class="sp-ico">🔥</span>
              <div class="sp-val">${streak}</div>
              <div class="sp-label">连续打卡(天)</div>
            </div>
            <div class="sp-tile">
              <span class="sp-ico">📈</span>
              <div class="sp-val ${weekScore >= 0 ? 'pts-pos' : 'pts-neg'}">${weekScore >= 0 ? '+' : ''}${weekScore}</div>
              <div class="sp-label">本周得分</div>
            </div>
          </div>
          <div class="sp-progress">
            <div class="sp-progress-fill" style="width:${rate}%"></div>
          </div>
          <div class="sp-foot">${todayDue.length === 0
            ? '今天没有安排任务，休息一下吧'
            : leftCount > 0 ? `还有 ${leftCount} 个任务待完成` : '今天的任务全部完成啦 🎉'}</div>
        </div>

        <!-- 今日打卡记录：今日概览下面，可折叠 -->
        <section class="home-section home-logs ${this.state.logsCollapsed ? 'collapsed' : ''}" id="today-logs">
          <button type="button" class="logs-head" id="logs-toggle" aria-expanded="${this.state.logsCollapsed ? 'false' : 'true'}">
            <span>📝 今日操作记录 <b>${todayLogs.length}</b> 条</span>
            <span class="logs-arrow">▾</span>
          </button>
          <div class="logs-body">
            ${todayLogs.length === 0 ? `
              <div class="logs-empty">今天还没有打卡记录，完成任务后就会记在这里～</div>
            ` : `
              <div class="log-list">
                ${todayLogs.map(l => {
                  const ptsCls = l.points >= 0 ? 'pts-pos' : 'pts-neg';
                  const time = new Date(l.timestamp);
                  const timeStr = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;
                  return `
                    <div class="log-item">
                      <div class="log-time">${timeStr}</div>
                      <div class="log-title">${l.taskTitle}${l.completed === false ? ' <span class="log-missed-tag">未完成</span>' : ''}${l.note ? `<div class="log-note">备注：${l.note}</div>` : ''}</div>
                      <div class="log-points ${ptsCls}">${l.points >= 0 ? '+' : ''}${l.points}</div>
                      <button class="log-revoke" data-log-id="${l.id}" title="撤销">↩</button>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>
        </section>
      </div>
    `;
  },

  // 优先展示“最近能拿到”的奖赏；全部达成则展示目标最高的
  pickMainReward(rewards, score) {
    if (!rewards.length) return null;
    const upcoming = rewards.filter(r => r.targetScore > score)
      .sort((a, b) => a.targetScore - b.targetScore);
    if (upcoming.length) return upcoming[0];
    return rewards.slice().sort((a, b) => b.targetScore - a.targetScore)[0];
  },

  // 连续打卡天数：今天没打卡则从昨天往前算
  calcStreak(logs) {
    const key = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const days = new Set();
    logs.forEach(l => {
      if (l.completed === false || l.manual) return;   // 手动加减分不算打卡
      days.add(key(new Date(l.timestamp)));
    });
    const d = new Date();
    if (!days.has(key(d))) d.setDate(d.getDate() - 1);
    let n = 0;
    while (days.has(key(d)) && n < 3650) {
      n++;
      d.setDate(d.getDate() - 1);
    }
    return n;
  },

  // 本周（周一起）净得分
  weekScore(logs) {
    const now = new Date();
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    monday.setDate(monday.getDate() - ((now.getDay() + 6) % 7));
    const from = monday.getTime();
    return logs.filter(l => l.timestamp >= from).reduce((s, l) => s + l.points, 0);
  },

  // 日历里点某天 → 查看这天的打卡记录（只读，不能撤销）
  openDayLogsModal(date, logs) {
    const total = logs.reduce((s, l) => s + (l.points || 0), 0);
    const label = `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日`;
    this.openModal(`
      <h3>${label} 打卡记录</h3>
      <p class="day-log-sum">共 <b>${logs.length}</b> 条，合计 <b class="${total >= 0 ? 'pts-pos' : 'pts-neg'}">${total >= 0 ? '+' : ''}${total}</b> 分</p>
      <div class="log-list">
        ${logs.map(l => {
          const ptsCls = l.points >= 0 ? 'pts-pos' : 'pts-neg';
          const t = new Date(l.timestamp);
          const hhmm = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
          return `
            <div class="log-item">
              <div class="log-time">${hhmm}</div>
              <div class="log-title">${l.taskTitle}${l.completed === false ? ' <span class="log-missed-tag">未完成</span>' : ''}${l.note ? `<div class="log-note">备注：${l.note}</div>` : ''}</div>
              <div class="log-points ${ptsCls}">${l.points >= 0 ? '+' : ''}${l.points}</div>
            </div>
          `;
        }).join('')}
      </div>
    `);
  },

  renderCalendarView(child, tasks, rewards) {
    const mainReward = rewards.length > 0
      ? rewards.reduce((a, b) => a.targetScore > b.targetScore ? a : b)
      : null;

    return `
      <div class="cal-view">
        ${this.renderProfileCard(child, false)}
        <div class="cal-container" id="cal-container"></div>
        <div class="cal-legend">
          <span class="cal-badge cal-badge-pos">+5</span> 加分
          <span class="cal-badge cal-badge-neg" style="margin-left: 12px;">-2</span> 减分
        </div>
      </div>
    `;
  },

  renderTasksView(child, tasks) {
    // 每个任务累计得分 = 这个任务所有打卡记录合计
    const allLogs = ScoreLogModel.list(child.id);
    const earnedOf = (taskId) => allLogs
      .filter(l => l.taskId === taskId)
      .reduce((s, l) => s + (l.points || 0), 0);

    // 全部任务：同样按开始时间排序
    const ordered = this.sortByStartTime(tasks);

    return `
      <div class="tasks-view">
        <div class="section-title">
          <span>📋 全部任务 (${ordered.length})</span>
          <button class="btn-primary btn-sm btn-add-task" id="btn-add-task-2">＋ 新增任务</button>
        </div>
        ${ordered.length === 0 ? `
          <div class="empty-hint">还没有任务～ 快去添加吧！</div>
        ` : `
          <div class="task-list-all">
            ${ordered.map(t => {
              const earned = earnedOf(t.id);
              return `
                <div class="task-all-card">
                  <div class="ta-left">
                    <div class="ta-title">${t.title}</div>
                    <div class="ta-meta">
                      ${t.type === 'repeat' ? `<span class="granularity-tag">${this.granularityLabel(t.granularity)}</span>` : ''}
                      ${t.type === 'single' ? '<span class="type-tag-single">单次</span>' : '<span class="type-tag-repeat">重复</span>'}
                      ${t.verifyType === 'countdown' ? `<span class="verify-tag is-countdown">⏱ ${t.countdownMinutes || 5}分钟</span>` : '<span class="verify-tag">✋ 手动</span>'}
                      ${(t.startTime || t.endTime) ? `<span class="time-tag">🕒 ${t.startTime || '--:--'}–${t.endTime || '--:--'}</span>` : ''}
                      ${t.note ? `<span class="ta-note">${t.note}</span>` : ''}
                    </div>
                  </div>
                  <div class="ta-right">
                    <div class="task-points-wrap">
                      <div class="tp-row">
                        <span class="tp-label">任务分</span>
                        <span class="tp-val pts-pos">+${t.points}</span>
                      </div>
                      <div class="tp-row">
                        <span class="tp-label">累计得分</span>
                        <span class="tp-val ${earned >= 0 ? 'pts-pos' : 'pts-neg'}">${earned >= 0 ? '+' : '−'}${Math.abs(earned)}</span>
                      </div>
                      ${t.penalty > 0 ? `<div class="task-points-sub pts-neg">未完成 −${t.penalty}</div>` : ''}
                    </div>
                    <div class="ta-actions">
                      <button class="btn-mini" data-edit-task="${t.id}">编辑</button>
                      <button class="btn-mini btn-danger" data-del-task="${t.id}">删除</button>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  },

  renderRewardsView(child, rewards) {
    const mainReward = rewards.length > 0
      ? rewards.reduce((a, b) => a.targetScore > b.targetScore ? a : b)
      : null;

    return `
      <div class="rewards-view">
        <div class="section-title">
          <span>🎁 奖赏墙 (${rewards.length})</span>
          <button class="btn-primary btn-sm" id="btn-add-reward-2">+ 新增</button>
        </div>
        ${rewards.length === 0 ? `
          <div class="empty-hint">还没有奖赏～ 设置一个目标让小朋友努力吧！</div>
        ` : `
          <div class="reward-list">
            ${rewards.map(r => {
              const pct = RewardModel.progress(r, child.totalScore);
              const achieved = child.totalScore >= r.targetScore;
              return `
                <div class="reward-card ${achieved ? 'achieved' : ''}">
                  <div class="reward-image">${this.renderAvatar(r.image)}</div>
                  <div class="reward-body">
                    <div class="reward-name">${r.name} ${achieved ? '<span class="achieved-badge">✨ 已达成</span>' : ''}</div>
                    <div class="reward-target">目标 ${r.targetScore} 分</div>
                    <div class="progress-bar small">
                      <div class="progress-fill" style="width: ${pct}%"></div>
                    </div>
                    <div class="progress-label small-label">${child.totalScore} / ${r.targetScore} 分 (${pct}%)</div>
                  </div>
                  <div class="reward-actions">
                    <button class="btn-mini" data-edit-reward="${r.id}">编辑</button>
                    <button class="btn-mini btn-danger" data-del-reward="${r.id}">删除</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  },

  // ============= 视图内事件绑定 =============
  bindViewEvents(child) {
    // 日历（home view + calendar view 共用同一个 cal-container id）
    const calEl = document.getElementById('cal-container');
    if (calEl) {
      Calendar.render(calEl, {
        year: this.state.calYear,
        month: this.state.calMonth,
        childId: child.id,
        selectedDate: this.state.selectedDate,
        onMonthChange: (y, m) => {
          this.state.calYear = y;
          this.state.calMonth = m;
        },
        onDateClick: (d) => {
          this.state.selectedDate = d;
          this.state.calYear = d.getFullYear();
          this.state.calMonth = d.getMonth();
          // 这天有打卡记录就弹出当天的记录列表
          const dayLogs = ScoreLogModel.list(child.id)
            .filter(l => this.isSameDay(new Date(l.timestamp), d));
          this.render();
          if (dayLogs.length > 0) this.openDayLogsModal(d, dayLogs);
        }
      });
    }

    // 局域网地址复制
    const copyBtn = document.querySelector('.ip-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const text = copyBtn.dataset.copy || '';
        const done = () => {
          copyBtn.textContent = '已复制 ✓';
          copyBtn.classList.add('copied');
          setTimeout(() => {
            if (copyBtn.isConnected) {
              copyBtn.textContent = '复制';
              copyBtn.classList.remove('copied');
            }
          }, 1500);
        };
        try {
          let ok = false;
          if (navigator.clipboard && window.isSecureContext) {
            try {
              await navigator.clipboard.writeText(text);
              ok = true;
            } catch (e) {
              ok = false;
            }
          }
          if (!ok) {
            // 局域网 http 或剪贴板无权限时，用 textarea 兜底
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            ok = document.execCommand('copy');
            document.body.removeChild(ta);
          }
          if (ok) {
            done();
          } else {
            alert('复制失败，请手动输入：' + text);
          }
        } catch (e) {
          alert('复制失败，请手动输入：' + text);
        }
      });
    }

    // 回到今天
    const backToday = document.getElementById('btn-back-today');
    if (backToday) {
      backToday.addEventListener('click', () => {
        const now = new Date();
        this.state.selectedDate = now;
        this.state.calYear = now.getFullYear();
        this.state.calMonth = now.getMonth();
        this.render();
      });
    }

    // 成员卡右侧：手动加分 / 减分（会改动积分，属于数据修改，锁上时先验证密码）
    document.querySelectorAll('.sa-btn').forEach(btn => {
      btn.addEventListener('click', () => this.openScoreAdjustModal(Number(btn.dataset.adj)));
    });

    // 点奖赏卡片左侧的图 → 放大预览
    const rewardImg = document.querySelector('.reward-hero:not(.empty) .rh-icon');
    if (rewardImg) rewardImg.addEventListener('click', () => this.openRewardImagePreview());

    // 打卡按钮（打卡会产生积分，属于数据修改，锁上时先验证密码）
    document.querySelectorAll('.check-btn[data-task-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tid = btn.dataset.taskId;
        const task = TaskModel.get(tid);
        if (!task) return;

        // 早于开始时间打卡需确认，选「否」则直接取消
        const startAt = this.taskStartAt(task, this.state.selectedDate);
        if (startAt && Date.now() < startAt.getTime()) {
          if (!confirm(`还没到开始时间（${task.startTime}），是否仍要打卡？`)) return;
        }

        this.requireUnlock(() => {
          // 先做可用性校验，避免倒计时白跑
          if (!TaskModel.isDue(task, this.state.selectedDate)) {
            alert('当前时间不可打卡');
            return;
          }
          const status = TaskModel.statusOf(task, this.state.selectedDate);
          if (status) {
            alert(status === 'missed' ? '本周期已记录为未完成' : '本周期已打卡');
            return;
          }

          const onConfirmResult = (completed) => {
            const res = ScoreLogModel.checkIn(tid, this.state.selectedDate, completed);
            if (!res.ok) {
              alert(res.msg);
              return;
            }
            this.render();
          };

          if (task.verifyType === 'countdown') {
            this.startCountdown(task, onConfirmResult);
          } else {
            this.confirmComplete(task, onConfirmResult);
          }
        }, '打卡');
      });
    });

    // 撤销打卡（会改动积分，属于数据修改，需要解锁）
    document.querySelectorAll('.log-revoke').forEach(btn => {
      btn.addEventListener('click', () => {
        this.requireUnlock(() => {
          if (confirm('撤销这次打卡？积分会回去哦～')) {
            ScoreLogModel.revoke(btn.dataset.logId);
            this.render();
          }
        }, '撤销打卡');
      });
    });

    // 今日打卡记录的折叠开关（不重新渲染，保持滚动位置）
    const logsToggle = document.getElementById('logs-toggle');
    if (logsToggle) {
      logsToggle.addEventListener('click', () => {
        const sec = document.getElementById('today-logs');
        this.state.logsCollapsed = sec.classList.toggle('collapsed');
        logsToggle.setAttribute('aria-expanded', this.state.logsCollapsed ? 'false' : 'true');
      });
    }

    // 任务 CRUD
    document.getElementById('btn-quick-add-task')?.addEventListener('click', () => this.openTaskModal());
    document.getElementById('btn-add-task-2')?.addEventListener('click', () => this.openTaskModal());
    document.getElementById('btn-add-reward-2')?.addEventListener('click', () => this.openRewardModal());

    document.querySelectorAll('[data-edit-task]').forEach(btn => {
      btn.addEventListener('click', () => this.openTaskModal(TaskModel.get(btn.dataset.editTask)));
    });
    document.querySelectorAll('[data-del-task]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.requireUnlock(() => {
          if (confirm('确定删除这个任务？相关打卡记录也会删除')) {
            TaskModel.remove(btn.dataset.delTask);
            this.render();
          }
        }, '删除任务');
      });
    });

    document.querySelectorAll('[data-edit-reward]').forEach(btn => {
      btn.addEventListener('click', () => this.openRewardModal(RewardModel.get(btn.dataset.editReward)));
    });
    document.querySelectorAll('[data-del-reward]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.requireUnlock(() => {
          if (confirm('确定删除这个奖赏？')) {
            RewardModel.remove(btn.dataset.delReward);
            this.render();
          }
        }, '删除奖赏');
      });
    });
  },

  switchView(view) {
    if (view === 'home') this.state.logsCollapsed = true;
    this.state.view = view;
    this.render();
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  },

  // ============= 家长锁 =============
  // 锁上 = 只读：成员 / 任务 / 奖赏的增删改、打卡、撤销打卡都要先输密码
  renderLockButton() {
    const btn = document.getElementById('btn-lock');
    if (!btn) return;
    btn.textContent = this.state.locked ? '🔒' : '🔓';
    btn.title = this.state.locked ? '已上锁（点击解锁）' : '已解锁（点击上锁）';
    btn.classList.toggle('locked', this.state.locked);
    btn.classList.toggle('unlocked', !this.state.locked);
  },

  // 上锁 / 解锁：改状态的同时记到本机，下次打开沿用上次的状态
  setLocked(locked) {
    this.state.locked = !!locked;
    Storage.saveLockState(this.state.locked);
  },

  toggleLock() {
    // 还没设密码：先设密码，否则「锁」是假的
    if (!ParentLock.isSet()) {
      this.openSetPasswordModal();
      return;
    }
    if (!this.state.locked) {
      this.setLocked(true);
      this.render();
      return;
    }
    this.promptPassword('解锁家长模式', () => {
      this.setLocked(false);
      this.render();
    });
  },

  // 已解锁直接执行；上锁则先验证密码
  requireUnlock(action, title) {
    if (!this.state.locked) { action(); return; }
    if (!ParentLock.isSet()) { action(); return; }   // 没设密码等于没有锁
    this.promptPassword(title, () => {
      this.setLocked(false);
      this.renderLockButton();
      action();
    });
  },

  // 密码输入框（含明文/隐藏切换）
  passwordFieldHtml(inputId, placeholder) {
    return `
      <div class="pw-field">
        <input type="password" id="${inputId}" placeholder="${placeholder}" autocomplete="off" maxlength="20">
        <button type="button" class="pw-eye" data-eye="${inputId}" title="显示 / 隐藏密码">👁</button>
      </div>`;
  },

  bindEyeToggles() {
    document.querySelectorAll('.pw-eye').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const input = document.getElementById(btn.dataset.eye);
        if (!input) return;
        const toText = input.type === 'password';
        input.type = toText ? 'text' : 'password';
        btn.textContent = toText ? '🙈' : '👁';
        input.focus();
      });
    });
  },

  // 解锁弹窗
  promptPassword(title, onOk) {
    this.openModal(`
      <h3>${title || '家长验证'}</h3>
      <div class="form-row">
        <label>家长密码</label>
        ${this.passwordFieldHtml('m-pw', '请输入家长密码')}
        <div class="file-hint">数据被锁住了，输对密码才能修改；忘记密码可用万能密码</div>
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" id="m-pw-cancel">取消</button>
        <button class="btn-primary" id="m-pw-ok">解锁</button>
      </div>
    `);
    const input = document.getElementById('m-pw');
    this.bindEyeToggles();
    input.focus();

    const submit = () => {
      if (!ParentLock.verify(input.value)) {
        input.value = '';
        input.focus();
        alert('密码不对哦，再试试～');
        return;
      }
      this.closeModal();
      onOk();
    };
    document.getElementById('m-pw-ok').addEventListener('click', submit);
    document.getElementById('m-pw-cancel').addEventListener('click', () => this.closeModal());
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  },

  // 首次设置密码（还没密码时点上锁）
  openSetPasswordModal() {
    this.openModal(`
      <h3>设置家长密码</h3>
      <div class="form-row">
        <label>新密码</label>
        ${this.passwordFieldHtml('m-pw1', '至少 4 位')}
        <div class="file-hint">用来防止小朋友修改任务和积分，请自己记住</div>
      </div>
      <div class="form-row">
        <label>再输一次</label>
        ${this.passwordFieldHtml('m-pw2', '确认密码')}
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" id="m-pw-set-cancel">取消</button>
        <button class="btn-primary" id="m-pw-set-ok">保存并上锁</button>
      </div>
    `);
    this.bindEyeToggles();
    document.getElementById('m-pw1').focus();

    document.getElementById('m-pw-set-ok').addEventListener('click', () => {
      const p1 = document.getElementById('m-pw1').value.trim();
      const p2 = document.getElementById('m-pw2').value.trim();
      if (p1.length < 4) { alert('密码至少 4 位哦～'); return; }
      if (p1 !== p2) { alert('两次输入不一样，再确认一下～'); return; }
      ParentLock.set(p1);
      // 设完立即上锁，锁图标变成红色 🔒
      this.setLocked(true);
      this.closeModal();
      this.render();
      alert('家长密码已设置，编辑数据时需要先解锁');
    });
    document.getElementById('m-pw-set-cancel').addEventListener('click', () => this.closeModal());
  },

  // 点奖赏图放大预览：图标（SVG）和上传的图片都能放大，还能再放大/缩小
  openRewardImagePreview() {
    const icon = document.querySelector('.reward-hero .rh-icon');
    if (!icon) return;

    const box = document.createElement('div');
    box.className = 'img-preview';
    box.innerHTML = `
      <div class="img-preview-box">${icon.innerHTML}</div>
      <div class="img-preview-tools">
        <button class="ip-btn" data-zoom="-1" aria-label="缩小">－</button>
        <button class="ip-btn" data-zoom="1" aria-label="放大">＋</button>
      </div>
      <button class="img-preview-close" aria-label="关闭预览">✕</button>
    `;

    // 放大 / 缩小：直接改白色相框的宽度（正方形，高度跟着走），最大不超过屏幕
    const frame = box.querySelector('.img-preview-box');
    const maxSize = () => Math.min(window.innerWidth * 0.88, window.innerHeight * 0.78);
    box.querySelectorAll('.ip-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cur = frame.getBoundingClientRect().width;
        const next = Number(btn.dataset.zoom) > 0 ? cur * 1.3 : cur / 1.3;
        frame.style.width = `${Math.round(Math.max(140, Math.min(next, maxSize())))}px`;
      });
    });

    const onKey = (e) => { if (e.key === 'Escape') close(); };
    function close() {
      box.remove();
      document.removeEventListener('keydown', onKey);
    }

    box.addEventListener('click', close);
    box.querySelector('.img-preview-box').addEventListener('click', (e) => e.stopPropagation());
    box.querySelector('.img-preview-tools').addEventListener('click', (e) => e.stopPropagation());
    document.addEventListener('keydown', onKey);
    document.body.appendChild(box);
  },

  // 成员卡右侧的 ＋ / －：手动加分 / 扣分，落一条记录，可在「打卡记录」里撤销
  openScoreAdjustModal(sign) {
    const child = ChildModel.get(this.state.currentChildId);
    if (!child) return;
    const isPlus = sign > 0;
    const title = isPlus ? '手动加分' : '手动扣分';

    this.requireUnlock(() => {
      this.openModal(`
        <h3>${title}</h3>
        <div class="form-row">
          <label>${isPlus ? '加' : '扣'}多少分</label>
          <input type="number" id="m-adj-points" value="1" min="1" max="999" step="1" inputmode="numeric">
          <div class="file-hint">给「${child.nickname}」${isPlus ? '加' : '扣'}的分数直接算进累计分，会记在打卡记录里，可以撤销。</div>
        </div>
        <div class="form-row">
          <label>备注（选填）</label>
          <input type="text" id="m-adj-note" maxlength="30" placeholder="例如：主动帮忙做家务">
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" id="m-adj-cancel">取消</button>
          <button class="btn-primary" id="m-adj-ok">${isPlus ? '确认加分' : '确认扣分'}</button>
        </div>
      `);

      const input = document.getElementById('m-adj-points');
      const noteInput = document.getElementById('m-adj-note');
      input.focus();
      input.select();

      const submit = () => {
        const n = Math.floor(Number(input.value));
        if (!n || n < 1) { alert('请输入大于 0 的整数分数'); return; }
        ScoreLogModel.adjust(child.id, isPlus ? n : -n, title, noteInput.value);
        this.closeModal();
        this.render();
      };

      document.getElementById('m-adj-ok').addEventListener('click', submit);
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
      noteInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
      document.getElementById('m-adj-cancel').addEventListener('click', () => this.closeModal());
    }, title);
  },

  // ============= Modal =============
  openModal(contentHtml) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
      <div class="modal">
        <button class="modal-close">×</button>
        <div class="modal-body">${contentHtml}</div>
      </div>
    `;
    document.body.appendChild(backdrop);

    backdrop.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target === el) this.closeModal();
      });
    });
  },

  closeModal() {
    if (this._countdownTimer) {
      clearInterval(this._countdownTimer);
      this._countdownTimer = null;
    }
    document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
  },

  // ---- 验收：手动确认 ----
  // afterCountdown=true 表示倒计时结束后的确认
  confirmComplete(task, onConfirm, afterCountdown = false) {
    this.closeModal();
    const penalty = task.penalty || 0;
    const scoreHtml = penalty > 0
      ? `完成 <b class="pts-pos">+${task.points}</b> 分，未完成 <b class="pts-neg">−${penalty}</b> 分`
      : `完成 <b class="pts-pos">+${task.points}</b> 分，未完成不扣分`;
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
      <div class="modal modal-confirm">
        <button class="modal-close">×</button>
        <div class="confirm-icon">${afterCountdown ? '🎉' : '🤔'}</div>
        <h3 class="confirm-title">${afterCountdown ? '时间到！完成了吗？' : '完成了吗？'}</h3>
        <p class="confirm-task">「${task.title}」</p>
        <p class="confirm-desc">${scoreHtml}</p>
        <div class="modal-actions">
          <button class="btn-secondary" data-act="no">还没完成</button>
          <button class="btn-primary" data-act="yes">✅ 完成了</button>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) this.closeModal();
    });
    backdrop.querySelector('.modal-close').addEventListener('click', () => this.closeModal());
    backdrop.querySelector('[data-act="no"]').addEventListener('click', () => {
      this.closeModal();
      // 「还没完成」也要落记录：扣不扣分看任务配置，但状态必须变成「未完成」
      onConfirm(false);
    });
    backdrop.querySelector('[data-act="yes"]').addEventListener('click', () => {
      this.closeModal();
      onConfirm(true);
    });
  },

  // ---- 验收：倒计时 ----
  startCountdown(task, onConfirm) {
    this.closeModal();
    const totalSec = Math.max(1, task.countdownMinutes || 5) * 60;
    // 用结束时间戳计算剩余，避免页面切到后台时 setInterval 被节流导致计时变慢
    const endTime = Date.now() + totalSec * 1000;
    let remain = totalSec;

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
      <div class="modal modal-countdown">
        <button class="modal-close">×</button>
        <div class="cd-task">「${task.title}」</div>
        <div class="cd-ring" id="cd-ring">
          <div class="cd-ring-inner">
            <div class="cd-time" id="cd-time">${this.formatCountdown(remain)}</div>
            <div class="cd-label">专心进行中</div>
          </div>
        </div>
        <div class="cd-tip">完成后会再确认一次，倒计时中请不要离开哦～</div>
        <div class="modal-actions">
          <button class="btn-secondary" id="cd-cancel">取消倒计时</button>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);

    const timeEl = backdrop.querySelector('#cd-time');
    const ringEl = backdrop.querySelector('#cd-ring');

    const paint = () => {
      timeEl.textContent = this.formatCountdown(remain);
      // 环形进度：开始时是满圈，随时间逐渐减少
      const pct = Math.max(0, Math.min(100, (remain / totalSec) * 100));
      ringEl.style.background = `conic-gradient(var(--blue-dark) ${pct}%, var(--cloud-deep) ${pct}% 100%)`;
    };
    paint();

    this._countdownTimer = setInterval(() => {
      remain = Math.max(0, Math.round((endTime - Date.now()) / 1000));
      if (remain <= 0) {
        clearInterval(this._countdownTimer);
        this._countdownTimer = null;
        this.closeModal();
        // 倒计时结束 → 弹出确认框
        this.confirmComplete(task, onConfirm, true);
        return;
      }
      paint();
    }, 1000);

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) this.closeModal();
    });
    backdrop.querySelector('.modal-close').addEventListener('click', () => this.closeModal());
    backdrop.querySelector('#cd-cancel').addEventListener('click', () => this.closeModal());
  },

  formatCountdown(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  },

  // ---- 成员 Modal ----
  openChildModal(existing) {
    const isEdit = !!existing;
    const data = existing || { nickname: '', avatar: 'av:naruto' };
    const currentIsImage = data.avatar && data.avatar.startsWith('data:');
    // 老 emoji 头像先升级成漫画头像 key，保证选择器能高亮
    const initialAvatar = (!currentIsImage && AVATAR_EMOJI_MAP[data.avatar])
      ? 'av:' + AVATAR_EMOJI_MAP[data.avatar]
      : data.avatar;

    const html = `
      <h3>${isEdit ? '编辑成员' : '新增成员'}</h3>
      <div class="form-row">
        <label>昵称</label>
        <input type="text" id="m-child-nickname" value="${data.nickname}" placeholder="起个名字" maxlength="10">
      </div>
      ${isEdit ? `
      <div class="form-row">
        <label>${ParentLock.isSet() ? '修改家长密码' : '设置家长密码'}
          <span class="hint">${ParentLock.isSet() ? '留空则不改' : '可留空'}</span></label>
        <div class="pw-stack">
          ${this.passwordFieldHtml('m-new-pw', '新密码（至少 4 位）')}
          ${this.passwordFieldHtml('m-new-pw2', '再输一次新密码')}
        </div>
        <div class="file-hint">${ParentLock.isSet()
          ? '修改后立即上锁，下次编辑数据要用新密码'
          : '设置后编辑数据要输密码，请自己记住'}</div>
      </div>` : `
      <div class="form-row">
        <label>${ParentLock.isSet() ? '家长密码' : '设置家长密码'}</label>
        ${this.passwordFieldHtml('m-child-pw', ParentLock.isSet() ? '请输入家长密码' : '至少 4 位')}
        <div class="file-hint">${ParentLock.isSet()
          ? '输对了才能新增成员'
          : '用来防止小朋友乱改数据，请自己记住'}</div>
      </div>`}
      <div class="form-row">
        <label>头像预览</label>
        <div class="avatar-preview-row">
          <div class="avatar-preview" id="avatar-preview">${this.renderAvatar(initialAvatar)}</div>
        </div>
      </div>
      <div class="form-row">
        <label>选择漫画头像 <span class="hint">Q 版贴纸，点一下换脸</span></label>
        <div class="avatar-picker" id="avatar-picker">
          ${AVATAR_LIST.map(o =>
            `<button class="avatar-opt ${!currentIsImage && `av:${o.key}` === initialAvatar ? 'selected' : ''}" data-avatar="av:${o.key}" title="${o.label}">${AVATARS[o.key]}</button>`
          ).join('')}
        </div>
      </div>
      <div class="form-row">
        <label>或上传自定义头像</label>
        <label class="file-pick" for="m-child-file">
          <span class="file-pick-btn">选择文件</span>
          <span class="file-pick-name" id="m-child-file-name">未选择文件</span>
        </label>
        <input type="file" id="m-child-file" accept="image/*" hidden>
        <div class="file-hint">支持 JPG / PNG，会自动压缩</div>
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" id="m-child-cancel">取消</button>
        <button class="btn-primary" id="m-child-save">保存</button>
      </div>
    `;

    this.openModal(html);
    this.bindEyeToggles();

    let selectedAvatar = initialAvatar;
    let selectedType = currentIsImage ? 'image' : 'emoji';

    const updatePreview = () => {
      document.getElementById('avatar-preview').innerHTML = this.renderAvatar(selectedAvatar);
    };

    document.querySelectorAll('#avatar-picker .avatar-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedAvatar = btn.dataset.avatar;
        selectedType = 'emoji';
        document.querySelectorAll('#avatar-picker .avatar-opt').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        updatePreview();
      });
    });

    document.getElementById('m-child-file').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      document.getElementById('m-child-file-name').textContent = file.name;
      const reader = new FileReader();
      reader.onload = (ev) => {
        // 图片压缩：canvas resize
        const img = new Image();
        img.onload = () => {
          const maxSize = 200;
          let w = img.width, h = img.height;
          if (w > h && w > maxSize) { h = h * maxSize / w; w = maxSize; }
          else if (h > maxSize) { w = w * maxSize / h; h = maxSize; }
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          selectedAvatar = canvas.toDataURL('image/jpeg', 0.85);
          selectedType = 'image';
          document.querySelectorAll('#avatar-picker .avatar-opt').forEach(b => b.classList.remove('selected'));
          updatePreview();
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });

    document.getElementById('m-child-cancel').addEventListener('click', () => this.closeModal());
    document.getElementById('m-child-save').addEventListener('click', () => {
      const nickname = document.getElementById('m-child-nickname').value.trim();
      if (!nickname) { alert('请填写昵称'); return; }

      if (isEdit) {
        // 家长密码：留空 = 不修改；填了就校验长度与一致性并更新
        const np1 = document.getElementById('m-new-pw').value.trim();
        const np2 = document.getElementById('m-new-pw2').value.trim();
        if (np1 || np2) {
          if (np1.length < 4) { alert('新密码至少 4 位哦～'); return; }
          if (np1 !== np2) { alert('两次输入的新密码不一样，再确认一下～'); return; }
          ParentLock.set(np1);
          this.setLocked(true);
          alert('家长密码已更新，记得记住新密码～');
        }
        ChildModel.update(existing.id, { nickname, avatar: selectedAvatar });
      } else {
        // 新增成员要过密码这一关：没设过就现在设，设过就验证
        const pw = (document.getElementById('m-child-pw').value || '').trim();
        if (!ParentLock.isSet()) {
          if (pw.length < 4) { alert('家长密码至少 4 位哦～'); return; }
          ParentLock.set(pw);
          this.setLocked(false);
        } else if (!ParentLock.verify(pw)) {
          alert('家长密码不对哦～');
          return;
        } else {
          // 密码验证通过，等同于家长已解锁
          this.setLocked(false);
        }
        const c = ChildModel.create({ nickname, avatar: selectedAvatar });
        this.state.currentChildId = c.id;
        Storage.setCurrentChildId(c.id);
      }
      this.closeModal();
      this.render();
    });
  },

  // ---- 任务 Modal ----
  // 增删改任务属于数据修改，上锁时先验证家长密码
  openTaskModal(existing) {
    this.requireUnlock(
      () => this.buildTaskModal(existing),
      existing ? '编辑任务' : '新增任务'
    );
  },

  buildTaskModal(existing) {
    const isEdit = !!existing;
    const childId = this.state.currentChildId;
    const data = existing || {
      title: '', granularity: 'day', type: 'repeat', scheduledDate: '', weekday: null, note: '',
      startTime: '', endTime: '',
      verifyType: 'manual', countdownMinutes: 5, points: 1, penalty: 0, icon: 'default'
    };

    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekdayHtml = data.granularity === 'week'
      ? `<div class="form-row" id="m-weekday-row">
           <label>每周几</label>
           <select id="m-weekday">
             <option value="">不限</option>
             ${weekdays.map((w, i) => `<option value="${i}" ${data.weekday === i ? 'selected' : ''}>${w}</option>`).join('')}
           </select>
         </div>`
      : '';

    const dateHtml = (data.type === 'single')
      ? `<div class="form-row">
           <label>在哪天</label>
           <input type="date" id="m-scheduled-date" value="${data.scheduledDate || todayKey()}">
         </div>`
      : '';

    const html = `
      <h3>${isEdit ? '编辑任务' : '新增任务'}</h3>
      <div class="form-row">
        <label>任务名称</label>
        <input type="text" id="m-task-title" value="${data.title}" placeholder="比如：刷牙、写作业、遛狗" maxlength="20">
      </div>
      <div class="form-row">
        <label>任务图标 <span class="hint">不选就用默认星星</span></label>
        <div class="task-icon-picker" id="task-icon-picker">
          ${TASK_ICON_OPTIONS.map(o => `
            <button type="button" class="task-icon-opt ${(data.icon || 'default') === o.key ? 'selected' : ''}" data-icon="${o.key}">
              ${ICONS[o.key]}<span>${o.label}</span>
            </button>`).join('')}
        </div>
      </div>
      <div class="form-row">
        <label>时间粒度</label>
        <select id="m-granularity">
          <option value="hour" ${data.granularity === 'hour' ? 'selected' : ''}>每小时</option>
          <option value="day" ${data.granularity === 'day' ? 'selected' : ''}>每天</option>
          <option value="week" ${data.granularity === 'week' ? 'selected' : ''}>每周</option>
          <option value="month" ${data.granularity === 'month' ? 'selected' : ''}>每月</option>
        </select>
      </div>
      <div class="form-row">
        <label>时间段 <span class="hint">只是提醒，不做限制</span></label>
        <div class="time-range">
          <input type="time" id="m-start-time" value="${data.startTime || ''}" aria-label="开始时间">
          <span class="time-range-sep">至</span>
          <input type="time" id="m-end-time" value="${data.endTime || ''}" aria-label="结束时间">
        </div>
      </div>
      <div class="form-row">
        <label>任务类型</label>
        <div class="radio-group">
          <label><input type="radio" name="m-type" value="repeat" ${data.type === 'repeat' ? 'checked' : ''}> 重复任务</label>
          <label><input type="radio" name="m-type" value="single" ${data.type === 'single' ? 'checked' : ''}> 单次任务</label>
        </div>
      </div>
      ${weekdayHtml}
      ${dateHtml}
      <div class="form-row">
        <label>得分规则</label>
        <div class="score-input-row">
          <label class="score-label-pos">完成时 +</label>
          <input type="number" id="m-points-value" value="${data.points ?? 1}" min="0" step="1">
          <span class="unit-text">分</span>
        </div>
        <div class="score-input-row">
          <label class="score-label-neg">未完成 −</label>
          <input type="number" id="m-penalty-value" value="${data.penalty ?? 0}" min="0" step="1">
          <span class="unit-text">分</span>
        </div>
        <div class="verify-hint">未完成填 0 表示不扣分</div>
      </div>
      <div class="form-row">
        <label>验收方式</label>
        <div class="score-toggle">
          <button type="button" class="verify-btn verify-manual ${data.verifyType !== 'countdown' ? 'active' : ''}" data-verify-type="manual">✋ 手动确认</button>
          <button type="button" class="verify-btn verify-countdown ${data.verifyType === 'countdown' ? 'active' : ''}" data-verify-type="countdown">⏱ 倒计时</button>
        </div>
        <div class="verify-hint" id="m-verify-hint">${data.verifyType === 'countdown' ? '点击打卡后开始倒计时，结束后再确认是否完成' : '点击打卡后直接确认是否完成'}</div>
        <div class="score-input-row" id="m-countdown-row" style="display:${data.verifyType === 'countdown' ? 'flex' : 'none'}">
          <label>倒计时</label>
          <input type="number" id="m-countdown-min" value="${data.countdownMinutes ?? 5}" min="1" max="180" step="1">
          <span class="unit-text">分钟</span>
        </div>
      </div>
      <div class="form-row">
        <label>备注 (可选)</label>
        <input type="text" id="m-note" value="${data.note || ''}" placeholder="补充说明">
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" id="m-task-cancel">取消</button>
        <button class="btn-primary" id="m-task-save">保存</button>
      </div>
    `;

    this.openModal(html);

    // 任务图标选择
    let selectedIcon = data.icon || 'default';
    // 选图标时把任务名称默认填成图标名（默认星星不填）；自己改过名称就不覆盖
    const titleInput = document.getElementById('m-task-title');
    let titleTouched = false;
    titleInput.addEventListener('input', () => { titleTouched = true; });

    document.querySelectorAll('#task-icon-picker .task-icon-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedIcon = btn.dataset.icon;
        document.querySelectorAll('#task-icon-picker .task-icon-opt').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');

        const opt = TASK_ICON_OPTIONS.find(o => o.key === btn.dataset.icon);
        if (opt && opt.key !== 'default' && (!titleTouched || !titleInput.value.trim())) {
          titleInput.value = opt.label;
        }
      });
    });

    // 粒度变化时更新 weekday 选项显示
    const granSel = document.getElementById('m-granularity');
    const typeRadios = document.querySelectorAll('input[name="m-type"]');

    const refreshConditionalFields = () => {
      const type = document.querySelector('input[name="m-type"]:checked').value;
      const gran = granSel.value;
      // 重建前先保留已有值
      const curWeekday = document.getElementById('m-weekday')?.value;
      const curDate = document.getElementById('m-scheduled-date')?.value;

      const oldRow = document.getElementById('m-weekday-row');
      const oldDateRow = document.getElementById('m-scheduled-date')?.closest('.form-row');
      if (oldRow) oldRow.remove();
      if (oldDateRow) oldDateRow.remove();

      const insertAfter = typeRadios[typeRadios.length - 1].closest('.form-row');
      if (gran === 'week' && type === 'repeat') {
        const row = document.createElement('div');
        row.className = 'form-row';
        row.id = 'm-weekday-row';
        row.innerHTML = `<label>每周几</label>
          <select id="m-weekday">
            <option value="">不限</option>
            ${weekdays.map((w, i) => `<option value="${i}" ${curWeekday !== undefined && curWeekday !== '' && parseInt(curWeekday) === i ? 'selected' : ''}>${w}</option>`).join('')}
          </select>`;
        insertAfter.parentNode.insertBefore(row, insertAfter.nextSibling);
      }
      if (type === 'single') {
        const row = document.createElement('div');
        row.className = 'form-row';
        row.innerHTML = `<label>在哪天</label>
          <input type="date" id="m-scheduled-date" value="${curDate || todayKey()}">`;
        const anchor = document.getElementById('m-weekday-row') || insertAfter;
        anchor.parentNode.insertBefore(row, anchor.nextSibling);
      }
    };

    granSel.addEventListener('change', refreshConditionalFields);
    typeRadios.forEach(r => r.addEventListener('change', refreshConditionalFields));

    // 验收方式切换
    let currentVerifyType = data.verifyType || 'manual';
    document.querySelectorAll('.verify-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentVerifyType = btn.dataset.verifyType;
        document.querySelectorAll('.verify-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const isCountdown = currentVerifyType === 'countdown';
        document.getElementById('m-countdown-row').style.display = isCountdown ? 'flex' : 'none';
        document.getElementById('m-verify-hint').textContent = isCountdown
          ? '点击打卡后开始倒计时，结束后再确认是否完成'
          : '点击打卡后直接确认是否完成';
      });
    });

    document.getElementById('m-task-cancel').addEventListener('click', () => this.closeModal());
    document.getElementById('m-task-save').addEventListener('click', () => {
      const title = document.getElementById('m-task-title').value.trim();
      const granularity = granSel.value;
      const type = document.querySelector('input[name="m-type"]:checked').value;
      const points = parseInt(document.getElementById('m-points-value').value) || 0;
      const penalty = parseInt(document.getElementById('m-penalty-value').value) || 0;
      const note = document.getElementById('m-note').value.trim();
      // 时间段只是给孩子看的提醒，不参与任何判断
      const startTime = document.getElementById('m-start-time').value || null;
      const endTime = document.getElementById('m-end-time').value || null;
      const weekdaySel = document.getElementById('m-weekday');
      const weekday = weekdaySel && weekdaySel.value !== '' ? parseInt(weekdaySel.value) : null;
      const scheduledDate = document.getElementById('m-scheduled-date')?.value || null;
      const countdownMinutes = parseInt(document.getElementById('m-countdown-min')?.value) || 5;

      if (!title) { alert('请填写任务名称'); return; }
      if (points < 0 || penalty < 0) { alert('分值不能为负数'); return; }
      if (points === 0 && penalty === 0) { alert('完成加分和未完成扣分不能都为 0'); return; }
      if (currentVerifyType === 'countdown' && countdownMinutes < 1) { alert('倒计时至少 1 分钟'); return; }

      const payload = {
        title, granularity, type, points, penalty, note, weekday, scheduledDate, childId,
        startTime, endTime,
        icon: selectedIcon,
        verifyType: currentVerifyType,
        countdownMinutes: currentVerifyType === 'countdown' ? countdownMinutes : null
      };

      if (isEdit) {
        TaskModel.update(existing.id, payload);
      } else {
        TaskModel.create(payload);
      }
      this.closeModal();
      this.render();
    });
  },

  // ---- 奖赏 Modal ----
  openRewardModal(existing) {
    this.requireUnlock(
      () => this.buildRewardModal(existing),
      existing ? '编辑奖赏' : '新增奖赏'
    );
  },

  buildRewardModal(existing) {
    const isEdit = !!existing;
    const childId = this.state.currentChildId;
    const data = existing || { name: '', image: 'rv:cake', targetScore: 100 };

    // 旧 emoji 奖赏图标自动升级成 rv:key，保证选择器高亮且保存时不再写回 emoji
    const currentIsImage = data.image && (data.image.startsWith('data:') || data.image.startsWith('http'));
    const initialImage = (!currentIsImage && REWARD_EMOJI_MAP[data.image])
      ? 'rv:' + REWARD_EMOJI_MAP[data.image]
      : data.image;

    const html = `
      <h3>${isEdit ? '编辑奖赏' : '新增奖赏'}</h3>
      <div class="form-row">
        <label>奖赏名称</label>
        <input type="text" id="m-reward-name" value="${data.name}" placeholder="比如：去游乐园、吃一次冰淇淋" maxlength="20">
      </div>
      <div class="form-row">
        <label>目标分数</label>
        <input type="number" id="m-reward-score" value="${data.targetScore}" min="1" step="1">
      </div>
      <div class="form-row">
        <label>选择图标</label>
        <div class="task-icon-picker" id="reward-picker">
          ${REWARD_LIST.map(o =>
            `<button type="button" class="task-icon-opt ${`rv:${o.key}` === initialImage ? 'selected' : ''}" data-avatar="rv:${o.key}">${REWARD_ICONS[o.key]}<span>${o.label}</span></button>`
          ).join('')}
        </div>
      </div>
      <div class="form-row">
        <label>或上传图片 (可选)</label>
        <label class="file-pick" for="m-reward-file">
          <span class="file-pick-btn">选择文件</span>
          <span class="file-pick-name" id="m-reward-file-name">未选择文件</span>
        </label>
        <input type="file" id="m-reward-file" accept="image/*" hidden>
        <input type="hidden" id="m-reward-custom-img" value="${currentIsImage ? data.image : ''}">
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" id="m-reward-cancel">取消</button>
        <button class="btn-primary" id="m-reward-save">保存</button>
      </div>
    `;

    this.openModal(html);

    let selectedImage = initialImage;

    // 选图标时把奖赏名称默认填成图标名；用户自己改过名称就不覆盖
    const nameInput = document.getElementById('m-reward-name');
    let nameTouched = false;
    nameInput.addEventListener('input', () => { nameTouched = true; });

    document.querySelectorAll('#reward-picker .task-icon-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedImage = btn.dataset.avatar;
        document.querySelectorAll('#reward-picker .task-icon-opt').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        document.getElementById('m-reward-custom-img').value = '';

        if (!nameTouched || !nameInput.value.trim()) {
          const opt = REWARD_LIST.find(o => `rv:${o.key}` === btn.dataset.avatar);
          if (opt) nameInput.value = opt.label;
        }
      });
    });

    document.getElementById('m-reward-file').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      document.getElementById('m-reward-file-name').textContent = file.name;
      const reader = new FileReader();
      reader.onload = (ev) => {
        selectedImage = ev.target.result;
        document.getElementById('m-reward-custom-img').value = selectedImage;
        document.querySelectorAll('#reward-picker .task-icon-opt').forEach(b => b.classList.remove('selected'));
      };
      reader.readAsDataURL(file);
    });

    document.getElementById('m-reward-cancel').addEventListener('click', () => this.closeModal());
    document.getElementById('m-reward-save').addEventListener('click', () => {
      const name = document.getElementById('m-reward-name').value.trim();
      const targetScore = parseInt(document.getElementById('m-reward-score').value);
      const customImg = document.getElementById('m-reward-custom-img').value;

      if (!name) { alert('请填写奖赏名称'); return; }
      if (isNaN(targetScore) || targetScore < 1) { alert('请填写有效的目标分数'); return; }

      const payload = {
        childId,
        name,
        targetScore,
        image: customImg || selectedImage
      };

      if (isEdit) {
        RewardModel.update(existing.id, payload);
      } else {
        RewardModel.create(payload);
      }
      this.closeModal();
      this.render();
    });
  },

  // ============= 辅助 =============
  // 任务卡贴纸：漫画风 SVG 图标 + 对应底色
  renderTaskIcon(iconKey) {
    const opt = TASK_ICON_OPTIONS.find(o => o.key === iconKey) || TASK_ICON_OPTIONS[0];
    const svg = ICONS[opt.key] || ICONS.default;
    return `<span class="task-sticker" style="--sticker-bg:${opt.bg}">${svg}</span>`;
  },

  // 渲染头像：av:key → 漫画 SVG；data:/http → 图片；老的 emoji 自动升级
  renderAvatar(avatar) {
    return avatarHtml(avatar);
  },

  granularityLabel(g) {
    return { hour: '每小时', day: '每天', week: '每周', month: '每月' }[g] || g;
  },

  formatDate(d) {
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  },

  isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
  },

  isYesterday(d) {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return this.isSameDay(d, y);
  }
};

// 页面加载：先把 data.json 同步到本地，再取局域网地址，最后渲染
document.addEventListener('DOMContentLoaded', async () => {
  await Storage.init();
  try {
    const res = await fetch('/api/info', { cache: 'no-store' });
    if (res.ok) App.state.serverInfo = await res.json();
  } catch (e) {
    // 静态托管 / file:// 打开时没有该接口，首页就不显示局域网地址
  }
  App.init();
});
