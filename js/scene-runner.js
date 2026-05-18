// ===== 场景运行器 =====
// 所有场景共用的逻辑：推演流程、助手交互、通关展示

function initScene(sceneId, customRenderAnimations) {
  const data = scenarioData[sceneId];
  const engine = new SimulationEngine(data);
  const ai = new AIHelper();

  // 动画渲染函数（由各场景自定义）
  const renderAnimations = customRenderAnimations || function() { return ''; };

  function startGame() {
    document.getElementById('cover').classList.add('hidden');
    document.getElementById('game').classList.remove('hidden');
    document.getElementById('result').classList.add('hidden');
    engine.currentLevel = 0; engine.score = 0; engine.answers = [];
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
      if (i === engine.currentLevel) dot.classList.add('current');
      bar.appendChild(dot);
    }
  }

  function renderLevel() {
    const level = engine.getCurrentLevel();
    if (!level) return;
    const scene = level.scene;
    const bg = scene.bg;

    const animHTML = renderAnimations(data.id, engine.currentLevel);

    const container = document.getElementById('levelContent');
    container.innerHTML = `
      <div class="scene-illustration" style="background:${bg};position:relative;overflow:hidden">
        ${animHTML}
        <span class="scene-emoji" style="position:relative;z-index:2">${scene.emoji}</span>
        <div class="scene-title" style="position:relative;z-index:2;color:white">${scene.title}</div>
        <div class="scene-context" style="position:relative;z-index:2;color:rgba(255,255,255,0.9)">${scene.context}</div>
      </div>
      <div class="level-question">${level.question}</div>
      <div class="options-grid" id="options"></div>
    `;

    const optionsGrid = document.getElementById('options');
    level.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.innerHTML = `<span class="option-icon">${opt.icon}</span>${opt.text.replace(/\n/g,'<br>')}`;
      btn.onclick = () => selectOption(i);
      optionsGrid.appendChild(btn);
    });

    document.getElementById('nextBtn').style.visibility = 'hidden';
  }

  function selectOption(index) {
    const level = engine.getCurrentLevel();
    const buttons = document.querySelectorAll('.option-btn');

    const result = engine.submitAnswer(index);

    if (result.correct) {
      // 答对了：禁用所有选项，高亮正确答案，显示下一关按钮
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
      // 答错了：只禁用当前错误选项，让用户重新选择
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
      const level = engine.getCurrentLevel();
      const progress = engine.getProgress();
      Assistant.guide(`第${progress.current}关啦！${level.scene.context.substring(0, 30)}...想想怎么做？`);
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
        <div style="margin-top:20px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="window._startGame()">🔄 再练一次</button>
          <a href="../index.html" class="btn btn-secondary">🏠 返回大厅</a>
        </div>
      </div>
    `;

    Assistant.say(cheerMsg, 'happy');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 暴露到全局
  window._startGame = startGame;
  window._nextLevel = nextLevel;

  // 启动AI检测
  ai.checkOnline().then(() => console.log('AI在线模式:', ai.online ? '可用' : '离线'));

  return { startGame, engine };
}
