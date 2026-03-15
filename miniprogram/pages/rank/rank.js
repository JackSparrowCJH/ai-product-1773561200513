const app = getApp();

Page({
  data: { list: [] },

  onLoad() {
    wx.request({
      url: `${app.globalData.baseUrl}/rank?limit=20`,
      success: (res) => {
        if (res.data?.list) {
          this.setData({ list: res.data.list });
        }
      }
    });
  }
});
