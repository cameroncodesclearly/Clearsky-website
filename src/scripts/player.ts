// Vimeo players talk to the page through postMessage. We only reveal a player
// once it reports that it is actually playing; a video that is private or
// domain-restricted never does, so its poster simply stays in place.
export function onPlaying(iframe: HTMLIFrameElement, playing: () => void, failed?: () => void, timeout = 8000) {
  const isVimeo = iframe.src.includes('player.vimeo.com');
  if (!isVimeo) {
    iframe.addEventListener('load', () => setTimeout(playing, 800), { once: true });
    return;
  }
  let done = false;
  const timer = window.setTimeout(() => finish(false), timeout);
  const send = (method: string, value?: string) => iframe.contentWindow?.postMessage(JSON.stringify({ method, value }), '*');
  function finish(ok: boolean) {
    if (done) return;
    done = true;
    clearTimeout(timer);
    window.removeEventListener('message', listen);
    ok ? playing() : failed?.();
  }
  function listen(e: MessageEvent) {
    if (e.source !== iframe.contentWindow) return;
    let data = e.data;
    try { if (typeof data === 'string') data = JSON.parse(data); } catch { return; }
    if (data?.event === 'ready') {
      send('addEventListener', 'play');
      send('addEventListener', 'playProgress');
      send('addEventListener', 'error');
    } else if (data?.event === 'play' || data?.event === 'playProgress') {
      finish(true);
    } else if (data?.event === 'error') {
      finish(false);
    }
  }
  window.addEventListener('message', listen);
}

/** Like onPlaying, but for click-to-play players: succeeds as soon as the player is ready. */
export function onReady(iframe: HTMLIFrameElement, ready: () => void, failed: () => void, timeout = 7000) {
  if (!iframe.src.includes('player.vimeo.com')) {
    iframe.addEventListener('load', ready, { once: true });
    return;
  }
  const timer = window.setTimeout(() => { window.removeEventListener('message', listen); failed(); }, timeout);
  function listen(e: MessageEvent) {
    if (e.source !== iframe.contentWindow) return;
    let data = e.data;
    try { if (typeof data === 'string') data = JSON.parse(data); } catch { return; }
    if (data?.event === 'ready') {
      clearTimeout(timer);
      window.removeEventListener('message', listen);
      ready();
    }
  }
  window.addEventListener('message', listen);
}

/**
 * Size a Vimeo iframe to cover its frame using the film's real shape, so a
 * film cut to any ratio (4:5, 2.39:1, vertical in a landscape slot) crops to
 * fill instead of showing black bars. The frame gets --vr (width / height);
 * the CSS in global.css does the rest.
 */
export function fitToFrame(iframe: HTMLIFrameElement, frame: HTMLElement) {
  if (!iframe.src.includes('player.vimeo.com')) return;
  const size: { w?: number; h?: number } = {};
  const send = (method: string) => iframe.contentWindow?.postMessage(JSON.stringify({ method }), '*');
  function listen(e: MessageEvent) {
    if (e.source !== iframe.contentWindow) return;
    let data = e.data;
    try { if (typeof data === 'string') data = JSON.parse(data); } catch { return; }
    if (data?.event === 'ready') {
      send('getVideoWidth');
      send('getVideoHeight');
    } else if (data?.method === 'getVideoWidth') {
      size.w = Number(data.value);
    } else if (data?.method === 'getVideoHeight') {
      size.h = Number(data.value);
    }
    if (size.w && size.h) {
      frame.style.setProperty('--vr', (size.w / size.h).toFixed(4));
      window.removeEventListener('message', listen);
    }
  }
  window.addEventListener('message', listen);
  setTimeout(() => window.removeEventListener('message', listen), 15000);
}
