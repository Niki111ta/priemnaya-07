(() => {
  const bridge = window.vkBridge;
  let ready = false;
  let state = 0;

  function bounded(request, timeout) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("VK Bridge timed out")), timeout);
      request.then(
        (value) => { clearTimeout(timer); resolve(value); },
        (error) => { clearTimeout(timer); reject(error); }
      );
    });
  }

  async function requestAd(format) {
    if (!ready || state < 0) return;
    state = -1;
    try {
      const available = await bounded(bridge.send("VKWebAppCheckNativeAds", { ad_format: format }), 2500);
      if (!available || available.result !== true) {
        state = 0;
        return;
      }
      state = -2;
      const shown = await bounded(bridge.send("VKWebAppShowNativeAds", { ad_format: format }), 90000);
      state = shown && shown.result === true ? 1 : 0;
    } catch (_) {
      state = 0;
    }
  }

  window.LombardVK = {
    adsReady: () => ready,
    requestAd,
    adState: () => state
  };

  if (bridge && (bridge.isEmbedded() || bridge.isWebView())) {
    bounded(bridge.send("VKWebAppInit"), 4000)
      .then(() => { ready = bridge.supports("VKWebAppShowNativeAds"); })
      .catch(() => {});
  }
})();
