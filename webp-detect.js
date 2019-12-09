// 手動偵測 WebP
// https://medium.com/@mingjunlu/image-optimization-using-webp-72d5641213c9
// webp-detect.js
window.addEventListener('DOMContentLoaded', async () => {
  const detectWebp = () => new Promise((resolve) => {
    const imgSrc = 'data:image/webp;base64,UklGRlIAAABXRUJQVlA4WAoAAAASAAAAAAAAAAAAQU5JTQYAAAD/////AABBTk1GJgAAAAAAAAAAAAAAAAAAAGQAAABWUDhMDQAAAC8AAAAQBxAREYiI/gcA';
    const pixel = new Image();
    pixel.addEventListener('load', () => {
      const isSuccess = (pixel.width > 0) && (pixel.height > 0);
      resolve(isSuccess);
    });
    pixel.addEventListener('error', () => { resolve(false); });
    pixel.setAttribute('src', imgSrc); // 開始載入測試圖
  });

  const hasSupport = await detectWebp();
  document.querySelector('body').classList.add(hasSupport ? 'webp' : 'no-webp');
});
