// ===== 音效模块 =====
// 使用 Web Audio API 合成音效，无需外部音频文件
// 答对：清脆上行音 / 答错：温和低音 / 通关：欢快旋律

const Sound = {
  enabled: true,
  ctx: null,

  init() {
    try {
      this.enabled = localStorage.getItem('emergency_rescue_sound') !== 'off';
    } catch (e) {
      this.enabled = true;
    }
  },

  // 延迟初始化 AudioContext（需用户交互后才能播放）
  _getCtx() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    // 浏览器可能挂起，需恢复
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  },

  // 合成单个音调
  _beep(freq, duration, type, volume) {
    if (!this.enabled) return;
    const ctx = this._getCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume || 0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // 静默失败，不影响主流程
    }
  },

  // 答对：上行双音"叮~叮"
  correct() {
    this._beep(660, 0.12, 'sine', 0.16);
    setTimeout(() => this._beep(880, 0.18, 'sine', 0.14), 100);
  },

  // 答错：温和下行低音"噔"
  wrong() {
    this._beep(320, 0.18, 'sine', 0.14);
    setTimeout(() => this._beep(240, 0.22, 'sine', 0.12), 120);
  },

  // 通关：欢快旋律 do mi sol do
  complete() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => {
      setTimeout(() => this._beep(f, 0.2, 'triangle', 0.13), i * 130);
    });
  },

  // 点击：轻柔提示音
  click() {
    this._beep(800, 0.05, 'sine', 0.06);
  },

  toggle() {
    this.enabled = !this.enabled;
    try {
      localStorage.setItem('emergency_rescue_sound', this.enabled ? 'on' : 'off');
    } catch (e) {}
    // 切换到开启时播放一个提示音
    if (this.enabled) this.click();
    return this.enabled;
  }
};

Sound.init();
