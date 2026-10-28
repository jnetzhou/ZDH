// 漫画风 Q 版图标库：全部内联 SVG（粗描边 + 糖果色），不依赖网络图片
// 任务图标 key 会存到任务数据里，新增图标只要在这里加一项即可

const ICONS = {
  // ---- 底部 Tab ----
  home: `<svg viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M7 22 24 8l17 14" fill="#FFD84D"/><path d="M11 20v19h26V20" fill="#FFF8E6"/><rect x="20" y="28" width="8" height="11" rx="2" fill="#7FD3F7"/><circle cx="26" cy="34" r="1" fill="#3B2E2A"/></g></svg>`,
  calendar: `<svg viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="11" width="34" height="30" rx="5" fill="#FFF8E6"/><path d="M7 19h34"/><rect x="13" y="5" width="5" height="9" rx="2.5" fill="#FF6B6B"/><rect x="30" y="5" width="5" height="9" rx="2.5" fill="#FF6B6B"/><rect x="13" y="24" width="7" height="6" rx="2" fill="#7FD3F7"/><rect x="24" y="24" width="7" height="6" rx="2" fill="#FFD84D"/><rect x="13" y="33" width="7" height="5" rx="2" fill="#FFB9C6"/></g></svg>`,
  tasks: `<svg viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="30" height="34" rx="4" fill="#FFF8E6"/><path d="M18 6h12v7H18z" fill="#7FD3F7"/><path d="M15 21l3 3 5-6" stroke="#58C97E"/><path d="M26 23h7"/><path d="M15 31l3 3 5-6" stroke="#58C97E"/><path d="M26 33h7"/></g></svg>`,
  rewards: `<svg viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="18" width="36" height="24" rx="3" fill="#FFC93C"/><rect x="6" y="18" width="36" height="8" fill="#FF6B6B"/><path d="M24 18v24"/><path d="M24 18c-8 0-11-3-11-7a5 5 0 0 1 9-3c2 2 2 6 2 10z" fill="#FFD84D"/><path d="M24 18c8 0 11-3 11-7a5 5 0 0 0-9-3c-2 2-2 6-2 10z" fill="#FFD84D"/></g></svg>`,

  // ---- 日常任务图标 ----
  default: `<svg viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M24 7l4.8 10 11 1.6-8 7.6 1.9 11L24 32l-9.7 5.2 1.9-11-8-7.6 11-1.6z" fill="#FFD84D"/></g></svg>`,
  brush: `<svg viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="24" width="22" height="8" rx="4" fill="#7FD3F7"/><rect x="28" y="21" width="15" height="11" rx="3" fill="#FFFFFF"/><path d="M32 21v-4M37 21v-5M42 21v-4" stroke-width="2.5"/><path d="M9 20c2-4 5-4 7-1" stroke="#FF6B6B"/></g></svg>`,
  eat: `<svg viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M7 26h34c0 9-7 14-17 14S7 35 7 26z" fill="#FFC93C"/><path d="M12 26c1.5-6 6-10 12-10s10.5 4 12 10z" fill="#FFFFFF"/><path d="M29 5l6 19M36 4l4 20" stroke="#FF6B6B"/><path d="M18 12c2-2 2-4 0-6M24 10c2-2 2-4 0-6" stroke="#B0BEC5" stroke-width="2.5"/></g></svg>`,
  sport: `<svg viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="17" y="21" width="14" height="6" rx="3" fill="#FFFFFF"/><rect x="8" y="14" width="9" height="20" rx="3" fill="#7FD3F7"/><rect x="31" y="14" width="9" height="20" rx="3" fill="#7FD3F7"/><path d="M4 11l3 3M44 11l-3 3" stroke-width="2.5"/></g></svg>`,
  class: `<svg viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="8" width="36" height="25" rx="4" fill="#7CC7A4"/><path d="M14 26l4-9 4 9M15.6 22.5h4.8" stroke="#FFFFFF" stroke-width="2.5"/><path d="M27 17h4a2.5 2.5 0 0 1 0 5h-4v4h4a2.5 2.5 0 0 0 0-4M27 17v9" stroke="#FFFFFF" stroke-width="2.5"/><path d="M17 33l-4 9M31 33l4 9M11 42h26"/></g></svg>`,
  homework: `<svg viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="7" width="25" height="34" rx="3" fill="#FFFFFF"/><path d="M12 15h14M12 21h14M12 27h8" stroke="#B0BEC5" stroke-width="2.5"/><path d="M31 33l8-8 4 4-8 8-5 1z" fill="#FFD84D"/><path d="M33 31l4 4" stroke-width="2"/></g></svg>`,
  read: `<svg viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M24 13c-4-2.5-9-3-15-2.5V36c6-.5 11 1 15 3.5 4-2.5 9-4 15-3.5V10.5C33 10 28 10.5 24 13z" fill="#FFF8E6"/><path d="M24 13v26"/><path d="M12 17h7M12 23h7M29 17h7M29 23h7" stroke="#B0BEC5" stroke-width="2.5"/><path d="M33 11.5v10l-2.5-1.8-2.5 1.8v-10" fill="#FF6B6B" stroke-width="2"/></g></svg>`,
  bath: `<svg viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 26h36v5a9 9 0 0 1-9 9H15a9 9 0 0 1-9-9z" fill="#7FD3F7"/><path d="M38 26V16a4 4 0 0 0-8 0"/><circle cx="15" cy="14" r="4.5" fill="#FFFFFF"/><circle cx="24" cy="9" r="3.5" fill="#FFFFFF"/><circle cx="31" cy="14" r="3" fill="#FFFFFF"/><path d="M12 40v3M36 40v3"/></g></svg>`,
  tidy: `<svg viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M8 22h32v15a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3z" fill="#FFC93C"/><rect x="5" y="14" width="38" height="9" rx="3" fill="#7FD3F7"/><circle cx="18" cy="31" r="4" fill="#FFB9C6"/><rect x="26" y="27" width="8" height="8" rx="2" fill="#B7E4A0"/></g></svg>`,
  chores: `<svg viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M31 6L22 24" stroke-width="4"/><path d="M15 25h16l4 16H11z" fill="#FFC93C"/><path d="M18 31l-2 7M24 31v7M30 31l2 7" stroke-width="2"/></g></svg>`,
  therapy: `<svg viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M24 41S6 30 6 18a7 7 0 0 1 12-5l6 5 6-5a7 7 0 0 1 12 5c0 12-18 23-18 23z" fill="#FF6B6B"/><path d="M11 22h5l2-4 3 8 2-4h6" stroke="#FFFFFF" stroke-width="2.5"/></g></svg>`,
  sleep: `<svg viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="30" width="40" height="12" rx="6" fill="#D9F2FF"/><circle cx="19" cy="22" r="11" fill="#FFE0C2"/><path d="M13 21q2.2 2.4 4.4 0M20.5 21q2.2 2.4 4.4 0" stroke-width="2.2"/><path d="M16.5 26q2.2 1.8 4.4 0" stroke-width="2.2"/><circle cx="12" cy="26" r="2" fill="#FFB9C6" stroke="none"/><circle cx="26" cy="26" r="2" fill="#FFB9C6" stroke="none"/><path d="M32 9h6l-6 7h6" stroke="#FF8FA6" stroke-width="2.5"/><path d="M39 19h4.5l-4.5 5.5h4.5" stroke="#FF8FA6" stroke-width="2"/></g></svg>`
};

// ---- 漫画风 Q 版头像：火影忍者 12 位角色（手绘 SVG，粗描边） ----
// 头像值统一存成 'av:xxx'
const AVATARS = {
  naruto: `<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M10 40C7 22 18 10 32 10s25 12 22 30" fill="#FFD84D"/><path d="M14 24l3-11 4 8 4-10 5 9 5-9 4 10 4-8 3 11" fill="#FFD84D"/><circle cx="32" cy="38" r="19" fill="#FFE0C2"/><circle cx="13" cy="38" r="4" fill="#FFE0C2"/><circle cx="51" cy="38" r="4" fill="#FFE0C2"/><path d="M12 24h40" stroke-width="4.5"/><rect x="21" y="17" width="22" height="8" rx="1.5" fill="#CFD6DC"/><path d="M30 18.5c2.8 0 4.5 1.8 4.5 3.6s-1.7 3.6-4.5 3.6-4.5-1.8-4.5-3.6 1.7-3.6 4.5-3.6z" fill="#3B2E2A"/><circle cx="25.5" cy="37" r="3" fill="#4A90D9"/><circle cx="38.5" cy="37" r="3" fill="#4A90D9"/><circle cx="25.5" cy="37" r="1.2" fill="#3B2E2A" stroke="none"/><circle cx="38.5" cy="37" r="1.2" fill="#3B2E2A" stroke="none"/><path d="M14 38h5M14 43h6M14 33h4M45 38h5M44 43h6M46 33h4" stroke-width="1.8"/><path d="M29 47q3 2.6 6 0"/></g></svg>`,
  sasuke: `<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 38C10 20 20 10 32 10s22 10 20 28" fill="#3B2E2A"/><path d="M14 18l4 14 4-16 6 18 6-18 4 16 4-14 2 14" fill="#3B2E2A"/><circle cx="32" cy="38" r="19" fill="#FFE0C2"/><circle cx="13" cy="38" r="4" fill="#FFE0C2"/><circle cx="51" cy="38" r="4" fill="#FFE0C2"/><circle cx="25.5" cy="37" r="2.6" fill="#6B2E2E"/><circle cx="38.5" cy="37" r="2.6" fill="#6B2E2E"/><circle cx="25.5" cy="37" r="1.1" fill="#3B2E2A" stroke="none"/><circle cx="38.5" cy="37" r="1.1" fill="#3B2E2A" stroke="none"/><path d="M27 47q5 3 10 0"/></g></svg>`,
  kakashi: `<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M10 38C7 20 18 9 32 9s25 11 22 29" fill="#C9CCD0"/><path d="M13 22l3-10 5 8 6-14 6 14 5-8 3 10" fill="#C9CCD0"/><circle cx="32" cy="38" r="19" fill="#FFE0C2"/><circle cx="13" cy="38" r="4" fill="#FFE0C2"/><circle cx="51" cy="38" r="4" fill="#FFE0C2"/><path d="M12 23h40" stroke-width="5"/><rect x="21" y="16" width="22" height="8" rx="1.5" fill="#CFD6DC"/><path d="M30 17.5c2.8 0 4.5 1.8 4.5 3.6s-1.7 3.6-4.5 3.6-4.5-1.8-4.5-3.6 1.7-3.6 4.5-3.6z" fill="#3B2E2A"/><path d="M18 28c3 4 8 5 14 5s11-1 14-5" fill="none"/><path d="M17 30q15 14 30 0" fill="#7A8B9E" stroke="#7A8B9E"/><path d="M15 32c4 10 11 18 17 18s13-8 17-18" fill="#7A8B9E"/><circle cx="25.5" cy="37" r="2.6" fill="#3B2E2A" stroke="none"/><path d="M29 49q3 2 6 0"/></g></svg>`,
  shikamaru: `<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M14 36C12 22 20 12 32 12s20 10 18 24" fill="#3B2E2A"/><path d="M16 16l3 12 4-10 6 14 6-14 4 10 3-12 2 12" fill="#3B2E2A"/><path d="M44 22c6 4 8 14 6 26" fill="#3B2E2A"/><circle cx="32" cy="38" r="19" fill="#FFE0C2"/><circle cx="13" cy="38" r="4" fill="#FFE0C2"/><circle cx="51" cy="38" r="4" fill="#FFE0C2"/><path d="M22 36c2-2 5-2 7 0M35 36c2-2 5-2 7 0" fill="none" stroke-width="2.6"/><path d="M29 47q3 2.4 6 0"/></g></svg>`,
  gai: `<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M11 34C9 18 19 9 32 9s23 9 21 25" fill="#3B2E2A"/><path d="M14 16c0-6 6-8 10-5M50 16c0-6-6-8-10-5" fill="#3B2E2A"/><circle cx="32" cy="38" r="19" fill="#FFE0C2"/><circle cx="13" cy="38" r="4" fill="#FFE0C2"/><circle cx="51" cy="38" r="4" fill="#FFE0C2"/><path d="M17 31c3-4 7-5 15-5s12 1 15 5" fill="none" stroke-width="3.6"/><circle cx="25" cy="37" r="4.2" fill="#FFFFFF" stroke="#3B2E2A"/><circle cx="39" cy="37" r="4.2" fill="#FFFFFF" stroke="#3B2E2A"/><circle cx="25" cy="37" r="1.8" fill="#3B2E2A" stroke="none"/><circle cx="39" cy="37" r="1.8" fill="#3B2E2A" stroke="none"/><path d="M27 47q5 3 10 0"/></g></svg>`,
  nagato: `<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 36C10 20 19 11 32 11s22 9 20 25" fill="#C0392B"/><path d="M15 16l3 12 5-10 6 12 6-12 5 10 3-12 2 12" fill="#C0392B"/><circle cx="32" cy="38" r="19" fill="#F5E1CC"/><circle cx="13" cy="38" r="4" fill="#F5E1CC"/><circle cx="51" cy="38" r="4" fill="#F5E1CC"/><circle cx="25" cy="36" r="4.4" fill="#FFFFFF"/><circle cx="39" cy="36" r="4.4" fill="#FFFFFF"/><circle cx="25" cy="36" r="3" fill="none" stroke="#3B2E2A" stroke-width="1.6"/><circle cx="25" cy="36" r="1.5" fill="#3B2E2A" stroke="none"/><circle cx="39" cy="36" r="3" fill="none" stroke="#3B2E2A" stroke-width="1.6"/><circle cx="39" cy="36" r="1.5" fill="#3B2E2A" stroke="none"/><path d="M28 48q4 2 8 0"/></g></svg>`,
  jiraiya: `<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M10 38C7 20 18 9 32 9s25 11 22 29" fill="#F0F0EA"/><path d="M13 22l4-10 5 8 5-12 5 12 5-8 4 10" fill="#F0F0EA"/><circle cx="32" cy="38" r="19" fill="#FFE0C2"/><circle cx="13" cy="38" r="4" fill="#FFE0C2"/><circle cx="51" cy="38" r="4" fill="#FFE0C2"/><path d="M12 23h40" stroke-width="4.5"/><rect x="21" y="16" width="22" height="8" rx="1.5" fill="#CFD6DC"/><path d="M30 17.5c2.8 0 4.5 1.8 4.5 3.6s-1.7 3.6-4.5 3.6-4.5-1.8-4.5-3.6 1.7-3.6 4.5-3.6z" fill="#3B2E2A"/><path d="M16 42l-4 6M48 42l4 6" stroke="#C0392B" stroke-width="3"/><circle cx="25.5" cy="37" r="2.5" fill="#3B2E2A" stroke="none"/><circle cx="38.5" cy="37" r="2.5" fill="#3B2E2A" stroke="none"/><path d="M28 47q4 3 8 0"/></g></svg>`,
  gaara: `<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 36C10 20 19 11 32 11s22 9 20 25" fill="#C0392B"/><path d="M15 16l3 12 5-10 6 12 6-12 5 10 3-12 2 12" fill="#C0392B"/><circle cx="32" cy="38" r="19" fill="#FFE0C2"/><circle cx="13" cy="38" r="4" fill="#FFE0C2"/><circle cx="51" cy="38" r="4" fill="#FFE0C2"/><path d="M32 19l-1.6 3h3.2z" fill="#C0392B"/><ellipse cx="25" cy="40" rx="3.6" ry="5" fill="none" stroke="#3B2E2A" stroke-width="1.6"/><ellipse cx="39" cy="40" rx="3.6" ry="5" fill="none" stroke="#3B2E2A" stroke-width="1.6"/><circle cx="25" cy="37" r="1.8" fill="#3B2E2A" stroke="none"/><circle cx="39" cy="37" r="1.8" fill="#3B2E2A" stroke="none"/><path d="M29 48q3 2 6 0"/></g></svg>`,
  kabuto: `<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 36C10 20 19 11 32 11s22 9 20 25" fill="#3B2E2A"/><path d="M16 17l3 12 4-10 5 12 5-12 4 10 3-12 2 12" fill="#3B2E2A"/><circle cx="32" cy="38" r="19" fill="#F5E1CC"/><circle cx="13" cy="38" r="4" fill="#F5E1CC"/><circle cx="51" cy="38" r="4" fill="#F5E1CC"/><circle cx="25" cy="36" r="4.8" fill="#FFFFFF"/><circle cx="39" cy="36" r="4.8" fill="#FFFFFF"/><path d="M29.8 36h8.4" stroke-width="2.2"/><circle cx="25" cy="36" r="1.6" fill="#3B2E2A" stroke="none"/><circle cx="39" cy="36" r="1.6" fill="#3B2E2A" stroke="none"/><path d="M28 48q4 2 8 0"/></g></svg>`,
  hashirama: `<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 42C6 22 17 9 32 9s26 13 23 33" fill="#3B2E2A"/><path d="M12 16l4 22 5-18 6 24 6-24 5 18 4-22 2 22" fill="#3B2E2A"/><circle cx="32" cy="38" r="19" fill="#FFE0C2"/><circle cx="13" cy="38" r="4" fill="#FFE0C2"/><circle cx="51" cy="38" r="4" fill="#FFE0C2"/><path d="M12 23h40" stroke-width="4.5"/><rect x="21" y="16" width="22" height="8" rx="1.5" fill="#CFD6DC"/><path d="M30 17.5c2.8 0 4.5 1.8 4.5 3.6s-1.7 3.6-4.5 3.6-4.5-1.8-4.5-3.6 1.7-3.6 4.5-3.6z" fill="#3B2E2A"/><circle cx="25.5" cy="37" r="2.4" fill="#3B2E2A" stroke="none"/><circle cx="38.5" cy="37" r="2.4" fill="#3B2E2A" stroke="none"/><path d="M28 47q4 2.6 8 0"/></g></svg>`,
  tobirama: `<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M10 38C7 20 18 9 32 9s25 11 22 29" fill="#F0F0EA"/><path d="M13 22l4-10 5 8 5-12 5 12 5-8 4 10" fill="#F0F0EA"/><circle cx="32" cy="38" r="19" fill="#FFE0C2"/><circle cx="13" cy="38" r="4" fill="#FFE0C2"/><circle cx="51" cy="38" r="4" fill="#FFE0C2"/><path d="M18 31l-3 5M46 31l3 5" stroke="#C0392B" stroke-width="3"/><circle cx="25.5" cy="37" r="2.6" fill="#4A90D9"/><circle cx="38.5" cy="37" r="2.6" fill="#4A90D9"/><circle cx="25.5" cy="37" r="1.1" fill="#3B2E2A" stroke="none"/><circle cx="38.5" cy="37" r="1.1" fill="#3B2E2A" stroke="none"/><path d="M28 47q4 2.6 8 0"/></g></svg>`,
  minato: `<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M10 38C7 20 18 9 32 9s25 11 22 29" fill="#FFD84D"/><path d="M13 22l4-10 5 8 6-12 5 12 5-8 4 10" fill="#FFD84D"/><circle cx="32" cy="38" r="19" fill="#FFE0C2"/><circle cx="13" cy="38" r="4" fill="#FFE0C2"/><circle cx="51" cy="38" r="4" fill="#FFE0C2"/><path d="M12 23h40" stroke-width="4.5"/><rect x="21" y="16" width="22" height="8" rx="1.5" fill="#CFD6DC"/><path d="M30 17.5c2.8 0 4.5 1.8 4.5 3.6s-1.7 3.6-4.5 3.6-4.5-1.8-4.5-3.6 1.7-3.6 4.5-3.6z" fill="#3B2E2A"/><circle cx="25.5" cy="37" r="2.6" fill="#4A90D9"/><circle cx="38.5" cy="37" r="2.6" fill="#4A90D9"/><circle cx="25.5" cy="37" r="1.1" fill="#3B2E2A" stroke="none"/><circle cx="38.5" cy="37" r="1.1" fill="#3B2E2A" stroke="none"/><path d="M29 47q3 2.6 6 0"/></g></svg>`
};

// 头像选择器顺序：火影忍者 12 位
const AVATAR_LIST = [
  { key: 'naruto', label: '鸣人' },
  { key: 'sasuke', label: '佐助' },
  { key: 'kakashi', label: '卡卡西' },
  { key: 'shikamaru', label: '鹿丸' },
  { key: 'gai', label: '凯' },
  { key: 'nagato', label: '长门' },
  { key: 'jiraiya', label: '自来也' },
  { key: 'gaara', label: '我爱罗' },
  { key: 'kabuto', label: '兜' },
  { key: 'hashirama', label: '初代' },
  { key: 'tobirama', label: '二代' },
  { key: 'minato', label: '四代' }
];

// 旧 emoji / 旧动物头像 → 默认落回鸣人（新数据一律用 av:xxx）
const AVATAR_EMOJI_MAP = {};

// ---- 奖赏图标（漫画风 SVG，值存成 'rv:xxx'） ----
const REWARD_ICONS = {
  travel: `<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="18" y="22" width="28" height="30" rx="4" fill="#FFB3C7"/><rect x="18" y="22" width="28" height="9" fill="#FF8FA6"/><rect x="28" y="12" width="8" height="14" rx="3" fill="#C9CCD0"/><circle cx="25" cy="56" r="3.5" fill="#3B2E2A"/><circle cx="39" cy="56" r="3.5" fill="#3B2E2A"/><path d="M32 27v5" stroke-width="2"/><path d="M24 38h16" stroke-width="2"/></g></svg>`,
  fishing: `<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M52 6 26 38" stroke-width="2.5"/><path d="M26 38l-12 4 14 8 6-14-8 2z" fill="#7FD3F7"/><circle cx="26" cy="38" r="2" fill="#3B2E2A" stroke="none"/><path d="M40 50c4 4 12 4 14 0" fill="#8FD45A"/><path d="M52 50v6" stroke-width="2"/><path d="M44 44l-4-3M52 44l4-3" stroke-width="2"/></g></svg>`,
  crab: `<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 32 15 38M26 35 20 42M42 32 49 38M38 35 44 42" stroke-width="2.5"/><path d="M19 26 14.5 23M45 26 49.5 23" stroke-width="3"/><g transform="translate(4 13) scale(1.35)"><path d="M2.4 12.9C1 10.3 2 7.2 4.6 6.4c1.6-.5 3 .4 3.2 1.7.2 1.5-1 2.4-2.3 2.2 1.3.8 1.7 1.6 1.1 2.6-.8 1.4-3 1.6-4.2 0z" fill="#FF7A4D" stroke-width="2.2"/></g><g transform="translate(60 13) scale(-1.35 1.35)"><path d="M2.4 12.9C1 10.3 2 7.2 4.6 6.4c1.6-.5 3 .4 3.2 1.7.2 1.5-1 2.4-2.3 2.2 1.3.8 1.7 1.6 1.1 2.6-.8 1.4-3 1.6-4.2 0z" fill="#FF7A4D" stroke-width="2.2"/></g><ellipse cx="32" cy="25" rx="12" ry="9" fill="#FF7A4D"/><circle cx="27" cy="20" r="2.8" fill="#FFFCF2"/><circle cx="37" cy="20" r="2.8" fill="#FFFCF2"/><circle cx="27.3" cy="20.3" r="1.1" fill="#3B2E2A" stroke="none"/><circle cx="37.3" cy="20.3" r="1.1" fill="#3B2E2A" stroke="none"/><rect x="13" y="36" width="38" height="7" rx="2.5" fill="#5FB8E0"/><path d="M16 43h32l-3 14.5a4 4 0 0 1-4 3.5H23a4 4 0 0 1-4-3.5z" fill="#7FD3F7"/></g></svg>`,
  cake: `<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="10" y="30" width="44" height="22" rx="3" fill="#FFE0C2"/><rect x="10" y="30" width="44" height="7" fill="#FFB3C7"/><path d="M14 37c2-3 4-3 6 0s4 3 6 0 4-3 6 0 4 3 6 0 4-3 6 0" fill="#FFF"/><rect x="30" y="12" width="4" height="12" fill="#F5A03C"/><path d="M32 8c0 3-2 4-4 4 4 0 4 1 4 4 0-3 2-4 4-4-2 0-4-1-4-4z" fill="#FF6B6B"/><path d="M14 52h36" stroke-width="2"/></g></svg>`,
  milktea: `<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 14h28l-3 40a6 6 0 0 1-6 5H27a6 6 0 0 1-6-5z" fill="#FFF3E4"/><rect x="19" y="30" width="26" height="22" rx="2" fill="#C8975F" stroke="none"/><rect x="20" y="24" width="24" height="8" fill="#E8C39E" stroke="none"/><rect x="22" y="34" width="6" height="16" rx="2" fill="#3B2E2A" stroke="none"/><rect x="34" y="40" width="6" height="10" rx="2" fill="#3B2E2A" stroke="none"/><rect x="34" y="6" width="4" height="22" rx="2" fill="#FF6B6B"/></g></svg>`,
  bbq: `<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><g transform="rotate(-10 32 17)"><path d="M6 17h52" stroke="#C8975F" stroke-width="2.5"/><rect x="12" y="10" width="13" height="14" rx="4" fill="#E08B4F"/><rect x="26" y="10" width="13" height="14" rx="4" fill="#C96B3B"/><rect x="40" y="10" width="12" height="14" rx="4" fill="#E08B4F"/></g><path d="M8 38h48l-5 12a5 5 0 0 1-5 4H18a5 5 0 0 1-5-4z" fill="#6A7278"/><rect x="6" y="30" width="52" height="8" rx="4" fill="#9AA3AB"/><path d="M15 53l-4 6M49 53l4 6"/></g></svg>`,
  swimming: `<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M14 40c4 4 10 4 14 0s10-4 14 0 8 4 8 4" fill="none" stroke-width="2.5"/><path d="M14 48c4 4 10 4 14 0s10-4 14 0 8 4 8 4" fill="none" stroke-width="2.5"/><circle cx="32" cy="24" r="11" fill="#FFE0C2"/><path d="M22 22h20" stroke-width="3"/><rect x="21" y="18" width="22" height="7" rx="2" fill="#3B2E2A"/><circle cx="27" cy="22" r="2.4" fill="#7FD3F7" stroke="#3B2E2A" stroke-width="1.2"/><circle cx="37" cy="22" r="2.4" fill="#7FD3F7" stroke="#3B2E2A" stroke-width="1.2"/><path d="M26 33l-4 3M38 33l4 3" stroke-width="2"/></g></svg>`,
  gamepad: `<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 26c0-8 8-12 20-12s20 4 20 12c0 8-4 12-8 16-3 3-4 6-2 9l2 3H16l2-3c2-3 1-6-2-9-4-4-8-8-8-16z" fill="#B79CFF"/><rect x="20" y="26" width="10" height="6" rx="3" fill="#3B2E2A"/><rect x="22" y="22" width="6" height="10" rx="3" fill="#3B2E2A"/><circle cx="42" cy="26" r="3" fill="#FF6B6B"/><circle cx="42" cy="36" r="3" fill="#8FD45A"/><circle cx="37" cy="31" r="3" fill="#FFD84D"/><circle cx="47" cy="31" r="3" fill="#7FD3F7"/></g></svg>`,
  lizard: `<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M8 36c4-6 12-8 20-6 8 2 14 0 18-6 2 6-2 12-2 18 0 8-8 12-16 10-6-2-10-6-16-8-4-1-8 0-12 2-4-4-2-8-2-10z" fill="#8FD45A"/><circle cx="50" cy="28" r="2" fill="#3B2E2A" stroke="none"/><path d="M20 30l3-2M30 26l3-2M40 26l3-2" stroke-width="2"/><path d="M14 46c-4 2-6 6-4 10" stroke-width="2.5"/></g></svg>`,
  fish: `<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M8 32c8-14 36-14 40 0-4 14-32 14-40 0z" fill="#7FD3F7"/><path d="M48 32l10-10v20z" fill="#FFB3C7"/><circle cx="20" cy="30" r="3" fill="#3B2E2A" stroke="none"/><circle cx="19" cy="29" r="1" fill="#FFF" stroke="none"/><path d="M26 34c3 3 8 3 11 0" stroke-width="2"/></g></svg>`,
  parrot: `<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="32" cy="36" rx="15" ry="17" fill="#FF6B6B"/><path d="M32 19c-6-4-14-2-16 4 4-2 10 0 16 4z" fill="#FFD84D"/><path d="M32 19c6-4 14-2 16 4-4-2-10 0-16 4z" fill="#7FD3F7"/><path d="M32 53v8" stroke-width="2.5"/><path d="M22 61h20" stroke-width="2.5"/><circle cx="27" cy="32" r="2.6" fill="#3B2E2A" stroke="none"/><circle cx="37" cy="32" r="2.6" fill="#3B2E2A" stroke="none"/><path d="M28 40l-3 3M36 40l3 3" stroke-width="2"/></g></svg>`,
  toycar: `<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M10 38c0-8 6-12 14-12h16c8 0 14 4 14 12v8H10z" fill="#FF6B6B"/><path d="M20 26l4-8h16l4 8" fill="#7FD3F7"/><rect x="14" y="46" width="36" height="6" rx="2" fill="#3B2E2A" stroke="none"/><circle cx="20" cy="52" r="5" fill="#3B2E2A"/><circle cx="44" cy="52" r="5" fill="#3B2E2A"/><circle cx="20" cy="52" r="2" fill="#CFD6DC" stroke="none"/><circle cx="44" cy="52" r="2" fill="#CFD6DC" stroke="none"/><rect x="22" y="20" width="8" height="7" rx="1" fill="#FFFFFF" stroke-width="2"/><rect x="34" y="20" width="8" height="7" rx="1" fill="#FFFFFF" stroke-width="2"/></g></svg>`,
  rcplane: `<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 32l42-14-4 6 8 2-4 6 4 6-8 2 4 6z" fill="#FFFFFF"/><path d="M40 30v8" stroke-width="2"/><path d="M48 26l10-2-6 8z" fill="#7FD3F7"/><path d="M48 38l10 2-6-8z" fill="#7FD3F7"/><rect x="48" y="40" width="12" height="16" rx="3" fill="#3B2E2A"/><circle cx="52" cy="46" r="1.4" fill="#FF6B6B" stroke="none"/><circle cx="56" cy="46" r="1.4" fill="#8FD45A" stroke="none"/><circle cx="52" cy="51" r="1.4" fill="#FFD84D" stroke="none"/><circle cx="56" cy="51" r="1.4" fill="#7FD3F7" stroke="none"/></g></svg>`,
  sweetpotato: `<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M14 54c2 4 10 6 18 6s16-2 18-6" fill="#C18A55"/><path d="M14 54c-2-10 6-18 18-18s20 8 18 18" fill="#C8975F"/><path d="M32 36c0-8-4-14-4-14M32 36c0-8 4-14 4-14" stroke="#8FD45A" stroke-width="3.5"/><path d="M32 22c4-4 0-8 0-8M32 22c-4-4 0-8 0-8" stroke="#8FD45A" stroke-width="3"/><path d="M50 14l10 4-4 8" stroke-width="2.5"/><path d="M56 10l4 6-6 2z" fill="#A9724A"/></g></svg>`,
  garden: `<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 14c0-4 6-6 10-2 4-4 10-2 10 2 0 6-10 10-10 10s-10-4-10-10z" fill="#8FD45A"/><path d="M32 24v12" stroke-width="2.5"/><path d="M20 40h24l-2 16H22z" fill="#C8975F"/><path d="M46 46l10-10 4 4-6 10z" fill="#7FD3F7"/><path d="M46 46c4 0 8 2 8 6s-6 4-8 4" fill="#7FD3F7"/></g></svg>`,
  movie: `<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="12" y="22" width="32" height="34" rx="4" fill="#FF8FA6"/><rect x="12" y="22" width="32" height="6" fill="#FF6B6B"/><path d="M20 30h16M20 36h16M20 42h16M20 48h16" stroke="#FFE0C2" stroke-width="2"/><path d="M44 18l8-6 4 6-8 6z" fill="#FFFFFF"/><path d="M20 56h16" stroke-width="2"/></g></svg>`,
  tv: `<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#3B2E2A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="16" width="48" height="36" rx="5" fill="#3B2E2A"/><rect x="13" y="21" width="38" height="26" rx="2" fill="#7FD3F7"/><rect x="26" y="54" width="12" height="6" rx="1" fill="#3B2E2A" stroke="none"/><circle cx="50" cy="48" r="1.4" fill="#8FD45A" stroke="none"/><circle cx="54" cy="48" r="1.4" fill="#FF6B6B" stroke="none"/><path d="M18 28l8 6-8 6z" fill="#3B2E2A"/></g></svg>`
};

// 奖赏图标选择器顺序（17 个）
const REWARD_LIST = [
  { key: 'travel', label: '旅游' },
  { key: 'fishing', label: '钓鱼' },
  { key: 'crab', label: '抓螃蟹' },
  { key: 'cake', label: '蛋糕' },
  { key: 'milktea', label: '奶茶' },
  { key: 'bbq', label: '吃烧烤' },
  { key: 'swimming', label: '游泳' },
  { key: 'gamepad', label: '游戏机' },
  { key: 'lizard', label: '蜥蜴' },
  { key: 'fish', label: '鱼' },
  { key: 'parrot', label: '鹦鹉' },
  { key: 'toycar', label: '玩具汽车' },
  { key: 'rcplane', label: '遥控飞机' },
  { key: 'sweetpotato', label: '挖番薯' },
  { key: 'garden', label: '种菜' },
  { key: 'movie', label: '看电影' },
  { key: 'tv', label: '看电视' }
];

// 旧 emoji 奖赏 → 新的奖赏 key（老数据自动升级）
const REWARD_EMOJI_MAP = {
  '🎁': 'travel', '🏆': 'rcplane', '🍰': 'cake', '🍦': 'milktea', '🍭': 'milktea',
  '🎈': 'travel', '🦄': 'parrot', '🌈': 'travel', '⭐': 'gamepad', '💎': 'cake',
  '🚗': 'toycar', '🧸': 'lizard', '📚': 'tv', '🎨': 'movie', '🎮': 'gamepad'
};

// 把头像 / 奖赏值（av:key / rv:key / 图片 / 旧 emoji）转成可直接插入的 HTML
function avatarHtml(value) {
  if (!value) return AVATARS.naruto;
  if (value.startsWith('data:') || value.startsWith('http')) {
    return `<img src="${value}" alt="avatar">`;
  }
  if (value.startsWith('av:')) return AVATARS[value.slice(3)] || AVATARS.naruto;
  if (value.startsWith('rv:')) return REWARD_ICONS[value.slice(3)] || REWARD_ICONS.cake;
  const rk = REWARD_EMOJI_MAP[value];
  if (rk) return REWARD_ICONS[rk];
  const key = AVATAR_EMOJI_MAP[value];
  if (key) return AVATARS[key];
  return value;
}

// 新增/编辑任务时的图标选项（bg 是任务卡贴纸底色）
const TASK_ICON_OPTIONS = [
  { key: 'default', label: '默认', bg: '#FFEBA7' },
  { key: 'brush', label: '刷牙', bg: '#D9F2FF' },
  { key: 'eat', label: '吃饭', bg: '#FFE7B8' },
  { key: 'sport', label: '运动', bg: '#D9F2FF' },
  { key: 'class', label: '上课', bg: '#D8F3E2' },
  { key: 'homework', label: '写作业', bg: '#EDE4FF' },
  { key: 'read', label: '读书', bg: '#FFE7B8' },
  { key: 'bath', label: '洗澡', bg: '#D9F2FF' },
  { key: 'tidy', label: '收拾', bg: '#FFE7B8' },
  { key: 'chores', label: '做家务', bg: '#D8F3E2' },
  { key: 'therapy', label: '理疗', bg: '#FFDCDC' },
  { key: 'sleep', label: '睡觉', bg: '#E6E3FF' }
];

// 老任务没有 icon 字段时，按任务名猜一个图标，避免全是默认星星
function guessTaskIcon(title) {
  const t = String(title || '');
  const rules = [
    [/刷牙|漱口/, 'brush'],
    [/吃饭|早餐|午餐|晚餐|喝水|水果/, 'eat'],
    [/运动|跑步|跳绳|打球|锻炼|游泳/, 'sport'],
    [/上课|网课|听课|学习/, 'class'],
    [/读书|阅读|看书|朗读|亲子读/, 'read'],
    [/作业|写字|背书/, 'homework'],
    [/洗澡|洗头|洗漱|洗脸/, 'bath'],
    [/收拾|整理|收纳|玩具/, 'tidy'],
    [/家务|扫地|拖地|洗碗|擦桌|倒垃圾/, 'chores'],
    [/理疗|按摩|康复|复健/, 'therapy'],
    [/睡觉|午睡|入睡|睡着|晚安|赖床|睡眠/, 'sleep']
  ];
  for (const [re, key] of rules) {
    if (re.test(t)) return key;
  }
  return 'default';
}
