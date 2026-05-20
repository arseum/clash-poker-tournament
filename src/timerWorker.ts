/// <reference lib="webworker" />

let id: ReturnType<typeof setInterval> | null = null;

self.onmessage = (e: MessageEvent<'start' | 'stop'>) => {
  if (e.data === 'start' && !id) {
    id = setInterval(() => self.postMessage(null), 500);
  } else if (e.data === 'stop' && id) {
    clearInterval(id);
    id = null;
  }
};
