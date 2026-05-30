// ===== 用户名字管理 =====

function getUserName() {
  try {
    return localStorage.getItem('emergency_rescue_name') || '';
  } catch(e) {
    return '';
  }
}

function setUserName(name) {
  localStorage.setItem('emergency_rescue_name', name);
  if (!localStorage.getItem('emergency_rescue_startTime')) {
    localStorage.setItem('emergency_rescue_startTime', new Date().toISOString());
  }
}

function getStartTime() {
  try {
    return localStorage.getItem('emergency_rescue_startTime') || null;
  } catch(e) {
    return null;
  }
}

// ===== 名字输入弹窗 =====

function initNameModal() {
  const modal = document.getElementById('nameModal');
  const input = document.getElementById('nameInput');
  const btn = document.getElementById('nameConfirmBtn');
  if (!modal || !input || !btn) return;

  if (getUserName()) {
    modal.style.display = 'none';
    return;
  }

  // 隐藏浮动小助手，显示弹窗（弹窗内有自己的小助手形象）
  Assistant.hide();
  modal.style.display = 'flex';

  setTimeout(function() {
    input.focus();
  }, 500);

  function confirmName() {
    const name = input.value.trim();
    if (!name) {
      input.style.borderColor = '#d32f2f';
      input.placeholder = '请输入你的名字再开始哦～';
      input.focus();
      return;
    }
    setUserName(name);
    modal.style.display = 'none';
    updateProgressSummary();
    // 显示浮动小助手，说欢迎语
    Assistant.show();
    setTimeout(function() {
      Assistant.say('欢迎来到紧急救援模拟训练营！🏠 选一个场景开始训练吧～', 'guide');
    }, 300);
  }

  btn.addEventListener('click', confirmName);
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') confirmName();
  });
  input.addEventListener('input', function() {
    input.style.borderColor = '#e0e0e0';
  });
}

// ===== 场景卡片 SVG 图标 =====

const sceneIcons = {
  fire: `<svg width="70" height="70" viewBox="0 0 64 64"><defs><linearGradient id="fg" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#f4a261"/><stop offset="50%" stop-color="#e76f51"/><stop offset="100%" stop-color="#ffd166"/></linearGradient></defs><path d="M32 56C14 56 8 40 10 30 12 20 20 20 24 22 26 14 30 6 32 2 34 6 38 14 40 22 44 20 52 20 54 30 56 40 50 56 32 56Z" fill="url(#fg)" opacity=".9"/><path d="M24 36C22 44 28 50 32 50 36 50 42 44 40 36 38 30 34 28 32 26 30 28 26 30 24 36Z" fill="#ffd166" opacity=".7"/></svg>`,
  earthquake: `<svg width="70" height="70" viewBox="0 0 64 64"><rect x="18" y="10" width="28" height="44" rx="2" fill="#a1887f" opacity=".25"/><rect x="20" y="12" width="24" height="40" rx="1" fill="#8d6e63"/><rect x="24" y="18" width="7" height="7" rx="1.5" fill="#efebe9" opacity=".6"/><rect x="33" y="18" width="7" height="7" rx="1.5" fill="#efebe9" opacity=".6"/><rect x="24" y="30" width="7" height="7" rx="1.5" fill="#efebe9" opacity=".6"/><rect x="33" y="30" width="7" height="7" rx="1.5" fill="#efebe9" opacity=".6"/><rect x="24" y="42" width="7" height="7" rx="1.5" fill="#efebe9" opacity=".6"/><path d="M12 28L16 25v6Z" fill="#8d6e63" opacity=".4"/><path d="M48 28L52 25v6Z" fill="#8d6e63" opacity=".4"/><line x1="10" y1="36" x2="14" y2="36" stroke="#8d6e63" stroke-width="1.5" opacity=".35"/><line x1="50" y1="36" x2="54" y2="36" stroke="#8d6e63" stroke-width="1.5" opacity=".35"/></svg>`,
  drowning: `<svg width="70" height="70" viewBox="0 0 64 64"><path d="M8 38Q16 32 24 38 32 44 40 38 48 32 56 38v8Q48 50 40 46 32 42 24 46 16 50 8 46Z" fill="#64b5f6" opacity=".45"/><path d="M10 42Q18 36 26 42 34 48 42 42 50 36 58 42" fill="none" stroke="#42a5f5" stroke-width="2.5" stroke-linecap="round"/><circle cx="32" cy="24" r="12" fill="none" stroke="#e76f51" stroke-width="3" stroke-dasharray="4 2"/><circle cx="32" cy="24" r="4" fill="#e76f51"/><line x1="22" y1="20" x2="18" y2="16" stroke="#e76f51" stroke-width="2" stroke-linecap="round"/></svg>`,
  burn: `<svg width="70" height="70" viewBox="0 0 64 64"><rect x="22" y="12" width="20" height="42" rx="6" fill="#81c784" opacity=".35"/><rect x="24" y="14" width="16" height="38" rx="4" fill="#66bb6a"/><rect x="28" y="18" width="8" height="14" rx="3" fill="white" opacity=".75"/><rect x="30" y="20" width="4" height="10" rx="1.5" fill="white"/><line x1="31" y1="24" x2="33" y2="24" stroke="#66bb6a" stroke-width="1.5" stroke-linecap="round"/><line x1="31" y1="27" x2="33" y2="27" stroke="#66bb6a" stroke-width="1.5" stroke-linecap="round"/><circle cx="52" cy="40" r="5" fill="none" stroke="#ffd54f" stroke-width="2"/><path d="M48 38l2 2 4-4" stroke="#ffd54f" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`
};

// ===== 首页大厅初始化 =====

function renderSceneCards() {
  const grid = document.getElementById('sceneGrid');
  if (!grid) return;

  const saved = getProgress();
  const cardClasses = { fire: 'card-fire', earthquake: 'card-earthquake', drowning: 'card-drowning', burn: 'card-burn' };

  grid.innerHTML = sceneList.map(s => {
    const completed = saved[s.id] && saved[s.id].completed;
    return `
      <a href="scenes/${s.id}.html" class="scene-card ${cardClasses[s.id] || ''}">
        <span class="card-icon-svg">${sceneIcons[s.id] || s.icon}</span>
        <h3 class="scene-name">
          ${s.name}
          ${completed ? '<span class="badge-tag">⭐ 已通关</span>' : ''}
        </h3>
        <p class="scene-desc">${s.desc}</p>
      </a>
    `;
  }).join('');
}

// ===== 进度存储 =====

function saveProgress(sceneId, result) {
  const saved = getProgress();
  saved[sceneId] = {
    completed: true,
    score: result.score,
    total: result.total,
    date: new Date().toISOString()
  };
  localStorage.setItem('emergency_rescue_progress', JSON.stringify(saved));
}

function getProgress() {
  try {
    return JSON.parse(localStorage.getItem('emergency_rescue_progress')) || {};
  } catch (e) {
    return {};
  }
}

function updateProgressSummary() {
  const saved = getProgress();
  const completedScenes = sceneList.filter(s => saved[s.id] && saved[s.id].completed);
  const count = completedScenes.length;
  const total = sceneList.length;

  const countEl = document.getElementById('completedCount');
  const starsEl = document.getElementById('totalStars');
  const summaryEl = document.getElementById('progressSummary');
  if (!summaryEl) return;

  summaryEl.style.display = 'flex';
  if (countEl) countEl.textContent = count;
  if (starsEl) starsEl.textContent = '⭐'.repeat(count) + '☆'.repeat(total - count);

  // 证书按钮：始终显示，全部通关前灰色不可点
  let certBtn = document.getElementById('certBtn');
  if (!certBtn) {
    certBtn = document.createElement('button');
    certBtn.id = 'certBtn';
    certBtn.className = 'cert-btn';
    certBtn.innerHTML = '🎓 下载我的证书';
    certBtn.onclick = function() {
      const saved = getProgress();
      const done = sceneList.filter(s => saved[s.id] && saved[s.id].completed).length;
      if (done === sceneList.length) generateCertificate();
    };
    summaryEl.appendChild(certBtn);
  }
  if (count === total) {
    certBtn.classList.remove('disabled');
    certBtn.title = '';
  } else {
    certBtn.classList.add('disabled');
    certBtn.title = '完成全部' + total + '个场景即可下载证书';
  }

  // 重置按钮：始终显示
  let resetBtn = document.getElementById('resetBtn');
  if (!resetBtn) {
    resetBtn = document.createElement('button');
    resetBtn.id = 'resetBtn';
    resetBtn.className = 'reset-btn';
    resetBtn.innerHTML = '🔄 重新开始';
    resetBtn.title = '清除所有进度和名字，回到初始状态';
    resetBtn.onclick = function() {
      showConfirm('确定要全部重来吗？这会清除所有通关进度和你的名字，就像第一次打开一样。', function() {
        localStorage.removeItem('emergency_rescue_progress');
        localStorage.removeItem('emergency_rescue_name');
        localStorage.removeItem('emergency_rescue_startTime');
        localStorage.removeItem('assistant_position');
        location.reload();
      });
    };
    summaryEl.appendChild(resetBtn);
  }
}

// ===== 证书生成 =====

function formatTimeSpent(startISO) {
  const start = new Date(startISO);
  const now = new Date();
  const diffMs = now - start;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  let parts = [];
  if (days > 0) parts.push(days + '天');
  if (hours > 0) parts.push(hours + '小时');
  if (mins > 0 || parts.length === 0) parts.push(mins + '分钟');
  return parts.join('');
}

function generateCertificate() {
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 700;
  const ctx = canvas.getContext('2d');

  // 背景
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 700);
  bgGrad.addColorStop(0, '#fffef5');
  bgGrad.addColorStop(1, '#fff8e1');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1000, 700);

  // 外边框
  ctx.strokeStyle = '#ff6b35';
  ctx.lineWidth = 6;
  ctx.strokeRect(20, 20, 960, 660);

  // 内边框
  ctx.strokeStyle = '#ffab00';
  ctx.lineWidth = 2;
  ctx.strokeRect(32, 32, 936, 636);

  // 装饰角花
  const corners = [[50, 50], [950, 50], [50, 650], [950, 650]];
  corners.forEach(([x, y]) => {
    ctx.fillStyle = '#ff6b35';
    ctx.font = '36px sans-serif';
    ctx.fillText('★', x - 18, y + 18);
  });

  // 顶部小星星装饰
  for (let i = 0; i < 8; i++) {
    const sx = 200 + i * 80;
    ctx.fillStyle = '#ffd700';
    ctx.font = '16px sans-serif';
    ctx.fillText('⭐', sx, 62);
  }

  // 标题
  ctx.fillStyle = '#ff6b35';
  ctx.font = 'bold 28px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('紧急救援模拟训练营', 500, 100);

  // 证书名称
  ctx.fillStyle = '#d84315';
  ctx.font = 'bold 48px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillText('安 全 小 达 人 证 书', 500, 170);

  // 分隔线
  ctx.strokeStyle = '#ffab00';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(200, 190);
  ctx.lineTo(800, 190);
  ctx.stroke();

  // 正文
  const name = getUserName() || '同学';
  const saved = getProgress();
  const completedScenes = sceneList.filter(s => saved[s.id] && saved[s.id].completed);
  const totalLevels = completedScenes.reduce((sum, s) => sum + (saved[s.id]?.total || 3), 0);
  const sceneNames = completedScenes.map(s => s.name).join('、');
  const startTime = getStartTime();
  const timeStr = startTime ? formatTimeSpent(startTime) : '未知';
  const now = new Date();
  const dateStr = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日';

  ctx.fillStyle = '#333';
  ctx.font = '20px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.textAlign = 'center';

  const lines = [
    '',
    name + '同学：',
    '',
    '在"紧急救援模拟训练营"中，',
    '完成了全部 ' + completedScenes.length + ' 个场景、' + totalLevels + ' 个关卡的挑战，',
    '掌握了 ' + sceneNames + ' 四项安全自救互救技能。',
    '',
    '特授予"安全小达人"称号，以资鼓励！',
    '',
    '希望你继续传播安全知识，保护自己和他人！'
  ];

  let y = 240;
  lines.forEach(line => {
    if (line === '') {
      y += 12;
      return;
    }
    if (line.startsWith(name)) {
      ctx.fillStyle = '#d84315';
      ctx.font = 'bold 24px "PingFang SC","Microsoft YaHei",sans-serif';
    } else if (line.includes('安全小达人')) {
      ctx.fillStyle = '#ff6b35';
      ctx.font = 'bold 26px "PingFang SC","Microsoft YaHei",sans-serif';
    } else {
      ctx.fillStyle = '#333';
      ctx.font = '20px "PingFang SC","Microsoft YaHei",sans-serif';
    }
    ctx.fillText(line, 500, y);
    y += 36;
  });

  // 底部信息
  y += 10;
  ctx.fillStyle = '#666';
  ctx.font = '16px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillText('完成日期：' + dateStr + '    累计学习：' + timeStr, 500, y);

  // 底部星星徽章
  y += 40;
  ctx.fillText('⭐'.repeat(completedScenes.length) + '☆'.repeat(4 - completedScenes.length), 500, y);

  // 底部装饰
  for (let i = 0; i < 8; i++) {
    const sx = 200 + i * 80;
    ctx.fillStyle = '#ffd700';
    ctx.font = '16px sans-serif';
    ctx.fillText('⭐', sx, 640);
  }

  // 下载
  canvas.toBlob(function(blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '安全小达人证书_' + name + '.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}

// ===== 自定义确认弹窗 =====
function showConfirm(message, onConfirm) {
  var modal = document.getElementById('confirmModal');
  var msgEl = document.getElementById('confirmMsg');
  var okBtn = document.getElementById('confirmOkBtn');
  var cancelBtn = document.getElementById('confirmCancelBtn');
  if (!modal || !msgEl) return;

  msgEl.textContent = message;
  modal.style.display = 'flex';

  function close() {
    modal.style.display = 'none';
    okBtn.removeEventListener('click', onOk);
    cancelBtn.removeEventListener('click', close);
    modal.removeEventListener('click', onOverlayClick);
  }

  function onOverlayClick(e) {
    if (e.target === modal) close();
  }

  modal.addEventListener('click', onOverlayClick);

  function onOk() {
    close();
    if (onConfirm) onConfirm();
  }

  okBtn.addEventListener('click', onOk);
  cancelBtn.addEventListener('click', close);
}

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
  // 先初始化浮动小助手（保证 DOM 就位）
  Assistant.init(document.body);

  renderSceneCards();
  initNameModal();

  const name = getUserName();
  if (name) {
    updateProgressSummary();
    setTimeout(function() {
      Assistant.say('欢迎回来！🏠 选一个场景继续训练吧～', 'guide');
    }, 600);
  }
});
