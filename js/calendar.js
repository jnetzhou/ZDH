/*!
 * 周大航任务系统 - 月历组件
 * Copyright (c) 2026 jnetzhou <742408364@qq.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later（详见根目录 LICENSE）
 */

// 月历组件：渲染指定月份日历，标注打卡情况 + 选中日期高亮

const Calendar = {
  render(container, opts = {}) {
    const {
      year = new Date().getFullYear(),
      month = new Date().getMonth(),  // 0-11
      childId = null,
      selectedDate = null,              // 新增：选中的日期
      onDateClick = null,
      onMonthChange = null              // 新增：月份变化回调
    } = opts;

    const logs = childId ? Storage.getScoreLogs(childId) : [];

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay(); // 0=Sun
    const daysInMonth = lastDay.getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    // 构建日历网格（6 行 x 7 列）
    const cells = [];
    // 第一行开头补上月
    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevM = month === 0 ? 11 : month - 1;
      const prevY = month === 0 ? year - 1 : year;
      cells.push({ day: d, year: prevY, month: prevM, current: false });
    }
    // 当月
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, year, month, current: true });
    }
    // 补齐下月
    while (cells.length % 7 !== 0 || cells.length < 42) {
      const nextM = month === 11 ? 0 : month + 1;
      const nextY = month === 11 ? year + 1 : year;
      const d = cells.length - (startWeekday + daysInMonth) + 1;
      cells.push({ day: d, year: nextY, month: nextM, current: false });
      if (cells.length >= 42) break;
    }

    // 统计每天的打卡
    const dayStats = {};
    logs.forEach(l => {
      const dt = new Date(l.timestamp);
      const key = `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
      if (!dayStats[key]) dayStats[key] = { count: 0, totalPoints: 0 };
      dayStats[key].count++;
      dayStats[key].totalPoints += l.points;
    });

    const today = new Date();
    const todayKeyStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    const selKeyStr = selectedDate
      ? `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`
      : null;

    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

    let html = `
      <div class="cal-header">
        <button class="cal-nav" data-dir="prev" title="上个月">‹</button>
        <span class="cal-title">${year} 年 ${month + 1} 月</span>
        <button class="cal-nav" data-dir="next" title="下个月">›</button>
        <button class="cal-today-btn" title="回到今天">今天</button>
      </div>
      <div class="cal-weekdays">
        ${weekdays.map((w, i) => `<div class="cal-wd ${i === 0 || i === 6 ? 'cal-wd-weekend' : ''}">${w}</div>`).join('')}
      </div>
      <div class="cal-grid">
        ${cells.map(c => {
          const key = `${c.year}-${c.month}-${c.day}`;
          const stat = dayStats[key];
          const isToday = key === todayKeyStr && c.current;
          const isSelected = key === selKeyStr;

          const cls = [
            'cal-cell',
            c.current ? 'cal-current' : 'cal-muted',
            isToday ? 'cal-today' : '',
            isSelected ? 'cal-selected' : '',
            stat ? 'cal-has-log' : '',
            stat && stat.totalPoints >= 0 ? 'cal-day-pos' : '',
            stat && stat.totalPoints < 0 ? 'cal-day-neg' : ''
          ].filter(Boolean).join(' ');

          let sub = '';
          if (stat) {
            const pts = stat.totalPoints;
            const cls2 = pts >= 0 ? 'cal-badge-pos' : 'cal-badge-neg';
            sub = `<div class="cal-badge ${cls2}">${pts >= 0 ? '+' : ''}${pts}</div>`;
          } else {
            sub = '<div class="cal-badge cal-badge-empty"></div>';
          }

          return `
            <div class="${cls}" data-y="${c.year}" data-m="${c.month}" data-d="${c.day}">
              <span class="cal-day-num">${c.day}</span>
              ${sub}
            </div>
          `;
        }).join('')}
      </div>
    `;

    container.innerHTML = html;

    // 导航
    container.querySelectorAll('.cal-nav').forEach(btn => {
      btn.addEventListener('click', () => {
        const dir = btn.dataset.dir;
        let ym = { year, month };
        if (dir === 'prev') {
          ym.month--;
          if (ym.month < 0) { ym.month = 11; ym.year--; }
        } else {
          ym.month++;
          if (ym.month > 11) { ym.month = 0; ym.year++; }
        }
        if (onMonthChange) onMonthChange(ym.year, ym.month);
        this.render(container, { ...opts, year: ym.year, month: ym.month });
      });
    });

    // 回到今天
    const todayBtn = container.querySelector('.cal-today-btn');
    if (todayBtn) {
      todayBtn.addEventListener('click', () => {
        const now = new Date();
        if (onMonthChange) onMonthChange(now.getFullYear(), now.getMonth());
        this.render(container, { ...opts, year: now.getFullYear(), month: now.getMonth() });
      });
    }

    // 日期点击
    container.querySelectorAll('.cal-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const d = new Date(
          parseInt(cell.dataset.y),
          parseInt(cell.dataset.m),
          parseInt(cell.dataset.d)
        );
        if (onDateClick) onDateClick(d);
      });
    });
  }
};
