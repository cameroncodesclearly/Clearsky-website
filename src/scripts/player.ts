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
