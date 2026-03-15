const app = getApp();

Page({
  data: {
    merit: 0,
    combo: 0,
    currentSkin: 'default',
    tapping: false,
    floats: [],
    floatId: 0
  },

  comboTimer: null,
  pendingDelta: 0,
  syncTimer: null,

  onLoad() {
    const merit = wx.getStorageSync('merit') || 0;
    const skin = wx.getStorageSync('currentSkin') || 'default';
    this.setData({ merit, currentSkin: skin });
  },

  onTap(e) {
    const merit = this.data.merit + 1;
    const combo = this.data.combo + 1;
    const floatId = this.data.floatId + 1;

    // 浮字
    const x = 200 + (Math.random() - 0.5) * 200;
    const y = 300;
    const floats = [...this.data.floats.slice(-5), { id: floatId, x, y }];

    this.setData({ merit, combo, tapping: true, floats, floatId });

    // 音效
    this.playSound();

    // 缩放回弹
    setTimeout(() => this.setData({ tapping: false }), 80);

    // 清除浮字
    setTimeout(() => {
      this.setData({ floats: this.data.floats.filter(f => f.id !== floatId) });
    }, 800);

    // 连击重置
    clearTimeout(this.comboTimer);
    this.comboTimer = setTimeout(() => this.setData({ combo: 0 }), 1000);

    // 本地持久化
    wx.setStorageSync('merit', merit);

    // 批量同步云端
    this.pendingDelta++;
    clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => this.syncMerit(), 3000);
  },

  playSound() {
    if (!this._audio) {
      this._audio = wx.createInnerAudioContext();
      this._audio.src = `/assets/sounds/${this.data.currentSkin}.mp3`;
    }
    this._audio.stop();
    this._audio.play();
  },

  syncMerit() {
    if (this.pendingDelta <= 0) return;
    const delta = this.pendingDelta;
    this.pendingDelta = 0;

    wx.request({
      url: `${app.globalData.baseUrl}/merit/sync`,
      method: 'POST',
      data: {
        openid: app.globalData.userInfo?.openid || 'guest',
        delta,
        client_ts: Date.now()
      }
    });
  },

  goRank() {
    wx.navigateTo({ url: '/pages/rank/rank' });
  },

  onShareAppMessage() {
    return {
      title: `我已积累${this.data.merit}点功德，来敲木鱼！`,
      path: '/pages/index/index'
    };
  }
});
