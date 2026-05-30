// ===== 场景运行器 =====
// 所有场景共用的逻辑：推演流程、助手交互、通关展示

function initScene(sceneId, customRenderAnimations) {
  const data = scenarioData[sceneId];
  const engine = new SimulationEngine(data);
  const ai = new AIHelper();

  const renderAnimations = customRenderAnimations || function() { return ''; };

  function startGame() {
    document.getElementById('cover').classList.add('hidden');
    document.getElementById('game').classList.remove('hidden');
    document.getElementById('result').classList.add('hidden');
    engine.currentLevel = 0; engine.score = 0; engine.answers = [];
    engine.activeConsequence = null; engine.consequencesTriggered = [];
    engine.wrongAttempts = {};
    Assistant.init(document.getElementById('sceneLayout'));
    renderProgress();
    renderLevel();
    setTimeout(() => {
      Assistant.guide('嘿！仔细看看场景，选一个你认为对的答案吧～');
    }, 500);
  }

  function renderProgress() {
    const bar = document.getElementById('progress');
    bar.innerHTML = '';
    for (let i = 0; i < engine.totalLevels; i++) {
      const dot = document.createElement('span');
      dot.className = 'progress-dot';
      if (i < engine.currentLevel) dot.classList.add('done');
      if (i === engine.currentLevel && !engine.isInConsequence()) dot.classList.add('current');
      bar.appendChild(dot);
    }
    if (engine.isInConsequence()) {
      const branchDot = document.createElement('span');
      branchDot.className = 'progress-dot current';
      branchDot.style.background = '#f43f5e';
      branchDot.style.animation = 'none';
      bar.appendChild(branchDot);
    }
  }

  function renderLevel() {
    const level = engine.getCurrentLevel();
    if (!level) return;
    const scene = level.scene;
    const bg = scene.bg;
    const isConsequence = engine.isInConsequence();
    const isSort = level.type === 'sort';

    const animHTML = isConsequence ? '' : (typeof renderAnimations === 'function' ? renderAnimations(data.id, engine.currentLevel) : '');

    const container = document.getElementById('levelContent');
    const alertClass = isConsequence ? '" style="border:2px solid #f43f5e;box-shadow:0 0 0 6px rgba(244,63,94,0.1)' : '';

    let bodyHTML;
    if (isSort) {
      bodyHTML = renderSortLevel(level);
    } else {
      bodyHTML = `
        <div class="options-grid" id="options"></div>
      `;
    }

    container.innerHTML = `
      <div class="scene-illustration" style="background:${bg};position:relative;overflow:hidden${alertClass}">
        ${animHTML}
        <span class="scene-emoji" style="position:relative;z-index:2">${scene.emoji}</span>
        <div class="scene-title" style="position:relative;z-index:2;color:white">${scene.title}</div>
        <div class="scene-context" style="position:relative;z-index:2;color:rgba(255,255,255,0.9)">${scene.context}</div>
      </div>
      ${isConsequence ? '<div style="text-align:center;margin:8px 0;color:#f43f5e;font-weight:600;font-size:14px">⚠️ 这是一次错误的决策引发的后果！</div>' : ''}
      <div class="level-question">${level.question}</div>
      ${bodyHTML}
    `;

    if (!isSort) {
      const optionsGrid = document.getElementById('options');
      level.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = `<span class="option-icon">${opt.icon}</span>${opt.text.replace(/\n/g,'<br>')}`;
        btn.onclick = () => selectOption(i);
        optionsGrid.appendChild(btn);
      });
    }

    document.getElementById('nextBtn').style.visibility = 'hidden';

    if (isConsequence) {
      setTimeout(() => {
        Assistant.guide('糟糕！你遇到了意料之外的状况，快想想现在该怎么办？');
      }, 400);
    }
  }

  function renderSortLevel(level) {
    // 随机打乱顺序
    const shuffled = [...level.sortItems].sort(() => Math.random() - 0.5);
    // 如果碰巧顺序是对的，再交换两个
    if (shuffled.every((s, i) => s.order === i)) {
      [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
    }

    const itemsHTML = shuffled.map((item, i) => `
      <div class="sort-item" draggable="true" data-id="${item.id}" data-index="${i}">
        <span class="sort-handle">⠿</span>
        <span class="sort-num">${i + 1}</span>
        <span class="sort-icon">${item.icon}</span>
        <span class="sort-label">${item.text}</span>
      </div>
    `).join('');

    setTimeout(() => setupDragSort(level), 100);

    return `
      <div class="sort-list" id="sortList">
        ${itemsHTML}
      </div>
      <button class="btn btn-primary sort-confirm" id="sortConfirmBtn" onclick="window._checkSortOrder()">✅ 确认顺序</button>
    `;
  }

  function setupDragSort(level) {
    const list = document.getElementById('sortList');
    if (!list) return;

    let dragItem = null;

    list.querySelectorAll('.sort-item').forEach(item => {
      item.addEventListener('dragstart', function(e) {
        dragItem = this;
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });

      item.addEventListener('dragend', function() {
        this.classList.remove('dragging');
        dragItem = null;
        list.querySelectorAll('.sort-item').forEach(it => it.classList.remove('drag-over'));
      });

      item.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (this !== dragItem) {
          this.classList.add('drag-over');
        }
      });

      item.addEventListener('dragleave', function() {
        this.classList.remove('drag-over');
      });

      item.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('drag-over');
        if (this !== dragItem) {
          const items = [...list.querySelectorAll('.sort-item')];
          const fromIndex = items.indexOf(dragItem);
          const toIndex = items.indexOf(this);
          if (fromIndex < toIndex) {
            this.parentNode.insertBefore(dragItem, this.nextSibling);
          } else {
            this.parentNode.insertBefore(dragItem, this);
          }
          updateSortNumbers();
        }
      });
    });

    // 触摸拖拽支持
    let touchDragItem = null;
    let touchStartY = 0;

    list.querySelectorAll('.sort-item').forEach(item => {
      item.addEventListener('touchstart', function(e) {
        touchDragItem = this;
        touchStartY = e.touches[0].clientY;
        this.classList.add('dragging');
      }, { passive: false });

      item.addEventListener('touchmove', function(e) {
        e.preventDefault();
        if (!touchDragItem) return;
        const touchY = e.touches[0].clientY;
        const items = [...list.querySelectorAll('.sort-item')];
        items.forEach(it => it.classList.remove('drag-over'));

        const target = items.find(it => {
          const rect = it.getBoundingClientRect();
          return it !== touchDragItem && touchY >= rect.top && touchY <= rect.bottom;
        });
        if (target) target.classList.add('drag-over');
      }, { passive: false });

      item.addEventListener('touchend', function() {
        if (!touchDragItem) return;
        this.classList.remove('dragging');
        const items = [...list.querySelectorAll('.sort-item')];
        items.forEach(it => it.classList.remove('drag-over'));

        const highlighted = items.find(it => it.classList.contains('drag-over'));
        if (highlighted && highlighted !== touchDragItem) {
          const container = touchDragItem.parentNode;
          const fromIndex = items.indexOf(touchDragItem);
          const toIndex = items.indexOf(highlighted);
          if (fromIndex < toIndex) {
            container.insertBefore(touchDragItem, highlighted.nextSibling);
          } else {
            container.insertBefore(touchDragItem, highlighted);
          }
          updateSortNumbers();
        }
        touchDragItem = null;
      });
    });
  }

  function updateSortNumbers() {
    const items = document.querySelectorAll('#sortList .sort-item');
    items.forEach((item, i) => {
      item.dataset.index = i;
      item.querySelector('.sort-num').textContent = i + 1;
    });
    // 清除验证状态
    items.forEach(it => { it.classList.remove('sorted', 'wrong-pos'); });
  }

  window._checkSortOrder = function() {
    const level = engine.getCurrentLevel();
    if (!level || level.type !== 'sort') return;

    const items = [...document.querySelectorAll('#sortList .sort-item')];
    const userOrder = items.map(item => item.dataset.id);
    const result = engine.submitAnswer(userOrder);

    if (result.correct) {
      items.forEach((item, i) => {
        item.classList.add('sorted');
        item.querySelector('.sort-num').textContent = (i + 1);
      });
    } else {
      const correctOrder = level.sortItems.map(s => s.id);
      items.forEach((item, i) => {
        if (item.dataset.id !== correctOrder[i]) {
          item.classList.add('wrong-pos');
        }
      });
    }

    if (result.correct) {
      Assistant.cheer(result.feedback);
      if (engine.isComplete()) {
        document.getElementById('nextBtn').textContent = '查看结果 🏆';
      }
      document.getElementById('nextBtn').style.visibility = 'visible';
    } else {
      Assistant.encourage(result.feedback);
    }
  };

  function selectOption(index) {
    const level = engine.getCurrentLevel();
    const buttons = document.querySelectorAll('.option-btn');

    const result = engine.submitAnswer(index);

    if (result.consequenceTriggered) {
      buttons.forEach(b => { b.style.pointerEvents = 'none'; b.style.opacity = '0.5'; });
      buttons[index].classList.add('wrong');
      Assistant.encourage(result.feedback);
      setTimeout(() => {
        renderLevel();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 2500);
      return;
    }

    if (result.correct) {
      buttons.forEach((b, i) => {
        b.style.pointerEvents = 'none';
        if (i === level.correctIndex) b.classList.add('selected');
      });
      Assistant.cheer(result.feedback);
      if (engine.isComplete()) {
        document.getElementById('nextBtn').textContent = '查看结果 🏆';
      }
      document.getElementById('nextBtn').style.visibility = 'visible';
    } else {
      buttons[index].style.pointerEvents = 'none';
      buttons[index].classList.add('wrong');
      Assistant.encourage(result.feedback);
    }
  }

  function nextLevel() {
    if (engine.isComplete()) {
      showResult();
      return;
    }
    engine.nextLevel();
    renderProgress();
    renderLevel();
    document.getElementById('levelContent').classList.remove('active');
    setTimeout(() => {
      document.getElementById('levelContent').classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }

  function showResult() {
    document.getElementById('game').classList.add('hidden');
    const res = engine.getResult();
    const container = document.getElementById('result');
    container.classList.remove('hidden');
    saveProgress(data.id, res);

    const stars = res.score === res.total ? '⭐⭐⭐' : res.score >= 2 ? '⭐⭐' : '⭐';
    const cheerMsg = res.score === res.total
      ? '哇！全部答对！你太厉害了！🏆'
      : res.score >= 2
        ? '很不错哦！再练一次就能满分啦！💪'
        : '没关系，失败是成功之母，再试一次吧！📚';

    const consequencesHTML = res.consequencesTriggered && res.consequencesTriggered.length > 0
      ? `
        <div style="margin-top:16px;padding:16px;background:#fef5f5;border-radius:16px;border:1px solid rgba(244,63,94,0.15)">
          <h4 style="text-align:center;margin-bottom:10px;color:#c62828">⚠️ 决策回顾</h4>
          ${res.consequencesTriggered.map(c => {
            const correctOpt = c.consequence.options[c.consequence.correctIndex];
            return `
            <div style="background:white;border-radius:12px;padding:12px;margin:8px 0;font-size:14px">
              <div style="color:#999;margin-bottom:6px">❌ 错误选择：<strong style="color:#c62828">${c.choiceText.replace(/\n/g,'')}</strong></div>
              <div style="color:#333;margin-bottom:6px">➜ <strong>${c.consequence.scene.title}</strong>：${c.consequence.scene.context}</div>
              <div style="color:#2e7d32;background:#f1f8e9;border-radius:8px;padding:10px">
                ✅ 正确应对：<strong>${(correctOpt.icon + ' ' + correctOpt.text).replace(/\n/g,'')}</strong>
              </div>
            </div>
          `}).join('')}
        </div>
      ` : '';

    container.innerHTML = `
      <div class="result-page">
        <span class="result-badge">${res.badge.icon}</span>
        <div class="result-score">${stars}</div>
        <h3 class="result-badge-name">获得「${res.badge.name}」称号！</h3>
        <p style="color:var(--text-light);margin-bottom:16px">你答对了 ${res.score}/${res.total} 题</p>
        <div class="result-summary">
          <h4 style="text-align:center;margin-bottom:12px">📋 知识总结卡</h4>
          ${res.summary.map(s => `<div>${s}</div>`).join('')}
        </div>
        ${consequencesHTML}
        <div style="margin-top:16px;padding:16px;background:#f8faf8;border-radius:16px;border:1px solid rgba(134,212,107,0.12)">
          <h4 style="text-align:center;margin-bottom:12px;color:#3a633a">📝 答题回顾</h4>
          ${data.levels.map((l, i) => {
            const wrongs = res.wrongAttempts[i] || 0;
            let statusHTML, correctHTML;
            if (wrongs === 0) {
              statusHTML = '<span style="color:#2e7d32;font-weight:600">✅ 一次答对</span>';
            } else if (wrongs <= 2) {
              statusHTML = `<span style="color:#e65100;font-weight:600">🔄 错了${wrongs}次后答对</span>`;
            } else {
              statusHTML = `<span style="color:#c62828;font-weight:600">⚠️ 错了${wrongs}次后答对</span>`;
            }
            if (l.type === 'sort') {
              const order = [...l.sortItems].sort((a, b) => a.order - b.order);
              correctHTML = `<span style="color:#2e7d32;font-size:12px">✅ 正确顺序：${order.map(s => s.icon + s.text).join(' → ')}</span>`;
            } else {
              const correctOpt = l.options[l.correctIndex];
              correctHTML = `<span style="color:#2e7d32;font-size:12px">✅ 正确答案：${correctOpt.icon} ${correctOpt.text.replace(/\n/g,' ')}</span>`;
            }
            return `
              <div style="background:white;border-radius:10px;padding:10px 14px;margin:6px 0;font-size:14px">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
                  <span style="font-size:24px;flex-shrink:0">${l.scene.emoji}</span>
                  <div style="flex:1">
                    <div style="font-weight:600;color:#333">第${i+1}关 · ${l.scene.title}</div>
                    <div style="font-size:12px;color:#888">${l.question.substring(0, 30)}...</div>
                  </div>
                  <div style="text-align:right;flex-shrink:0">${statusHTML}</div>
                </div>
                <div style="padding-left:36px">${correctHTML}</div>
              </div>
            `;
          }).join('')}
        </div>
        <div style="margin-top:20px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="window._startGame()">🔄 再练一次</button>
          <a href="../index.html" class="btn btn-secondary">🏠 返回大厅</a>
        </div>
      </div>
    `;

    Assistant.say(cheerMsg, 'happy');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  window._startGame = startGame;
  window._nextLevel = nextLevel;

  ai.checkOnline().then(() => console.log('AI在线模式:', ai.online ? '可用' : '离线'));

  return { startGame, engine };
}
