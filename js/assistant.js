// ===== 安全小助手 =====
// 可拖动浮动卡通角色，引导操作、反馈答案

const Assistant = {
  idleMessages: [
    '选一个答案试试吧！',
    '别着急，仔细想想哦～',
    '想想老师教过的安全知识！',
    '你一定能选对的！',
    '安全知识很重要，认真学哦～'
  ],
  idleTimer: null,

  getUserName() {
    try {
      return localStorage.getItem('emergency_rescue_name') || '';
    } catch(e) {
      return '';
    }
  },

  // 根据当前页面路径计算 SVG 文件的前缀
  _getSvgBase() {
    if (window.location.pathname.includes('/scenes/')) return '../';
    return '';
  },

  _getSvgPath(pose) {
    return this._getSvgBase() + '安全小助手卡通形象生成 -' + pose + '.svg';
  },

  getHtml() {
    const base = this._getSvgBase();
    const defaultSvg = base + '安全小助手卡通形象生成 -微笑.svg';
    return `
    <div class="assistant-float" id="assistantFloat">
      <div class="assistant-speech" id="assistantSpeech"></div>
      <div class="assistant-body" id="assistantBody" title="拖动我可以移动哦～">
        <img class="assistant-img" id="assistantImg" src="${defaultSvg}" alt="安全小助手">
      </div>
      <div class="assistant-name">安全小助手</div>
    </div>
  `;
  },

  init(containerEl) {
    if (document.getElementById('assistantFloat')) return;
    const container = containerEl || document.body;
    container.insertAdjacentHTML('beforeend', this.getHtml());
    this._setupDrag();
    this._positionNearContent();

    document.getElementById('assistantBody').addEventListener('click', (e) => {
      if (this._wasDragged) { this._wasDragged = false; return; }
      const msgs = this.idleMessages;
      this.say(msgs[Math.floor(Math.random() * msgs.length)], 'idle');
    });

    this.startIdle();
  },

  hide() {
    const float = document.getElementById('assistantFloat');
    if (float) float.style.display = 'none';
  },

  show() {
    const float = document.getElementById('assistantFloat');
    if (float) float.style.display = '';
  },

  _positionNearContent() {
    const float = document.getElementById('assistantFloat');
    if (!float) return;

    try {
      const saved = JSON.parse(localStorage.getItem('assistant_position'));
      if (saved && saved.left && saved.top) {
        float.style.left = saved.left;
        float.style.top = saved.top;
        return;
      }
    } catch(e) {}

    const header = document.querySelector('.home-header') || document.querySelector('.scene-cover');
    if (header) {
      const rect = header.getBoundingClientRect();
      float.style.top = (rect.top + rect.height / 2 - 40) + 'px';
      float.style.left = (rect.right + 8) + 'px';
    } else {
      float.style.top = '120px';
      float.style.left = (window.innerWidth - 100) + 'px';
    }
  },

  _wasDragged: false,
  _setupDrag() {
    const float = document.getElementById('assistantFloat');
    if (!float) return;

    let startX, startY, startLeft, startTop;

    const onStart = (e) => {
      this._wasDragged = false;
      const touch = e.touches ? e.touches[0] : e;
      startX = touch.clientX;
      startY = touch.clientY;
      startLeft = float.offsetLeft;
      startTop = float.offsetTop;
      float.classList.add('dragging');
      e.preventDefault();
    };

    const onMove = (e) => {
      if (startX === undefined) return;
      const touch = e.touches ? e.touches[0] : e;
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        this._wasDragged = true;
      }
      float.style.left = Math.max(0, Math.min(window.innerWidth - 90, startLeft + dx)) + 'px';
      float.style.top = Math.max(0, Math.min(window.innerHeight - 90, startTop + dy)) + 'px';
    };

    const onEnd = () => {
      startX = undefined;
      float.classList.remove('dragging');
      const pos = { left: float.style.left, top: float.style.top };
      localStorage.setItem('assistant_position', JSON.stringify(pos));
    };

    float.addEventListener('mousedown', onStart);
    float.addEventListener('touchstart', onStart, { passive: false });
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchend', onEnd);
  },

  // 根据表情切换图片
  _setPose(mood) {
    const img = document.getElementById('assistantImg');
    if (!img) return;
    const poses = {
      happy: this._getSvgPath('点赞'),
      sad: this._getSvgPath('摇头'),
      guide: this._getSvgPath('伸出双手')
    };
    img.src = poses[mood] || this._getSvgPath('微笑');
  },

  say(message, mood) {
    const speech = document.getElementById('assistantSpeech');
    const body = document.getElementById('assistantBody');
    if (!speech || !body) return;

    const name = this.getUserName();
    if (name && !message.startsWith(name)) {
      message = name + '同学，' + message;
    }

    body.classList.remove('happy', 'sad');

    if (mood === 'happy') body.classList.add('happy');
    else if (mood === 'sad') body.classList.add('sad');

    this._setPose(mood);

    speech.innerHTML = message;
    speech.classList.add('show');

    if (mood !== 'guide') {
      clearTimeout(this._hideTimer);
      this._hideTimer = setTimeout(() => {
        speech.classList.remove('show');
        body.classList.remove('happy', 'sad');
        this._setPose('normal');
      }, mood === 'idle' ? 8000 : 10000);
    }
  },

  cheer(feedback) { this.say('✅ ' + feedback, 'happy'); },
  encourage(feedback) { this.say('😅 ' + feedback, 'sad'); },
  guide(message) { this.say(message, 'guide'); },

  startIdle() {
    this.idleTimer = setInterval(() => {
      const speech = document.getElementById('assistantSpeech');
      if (speech && !speech.classList.contains('show')) {
        const msg = this.idleMessages[Math.floor(Math.random() * this.idleMessages.length)];
        this.say(msg, 'idle');
      }
    }, 15000);
  },

  stop() {
    clearTimeout(this.idleTimer);
    clearTimeout(this._hideTimer);
  }
};
