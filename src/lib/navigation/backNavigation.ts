'use client';

type BackHandler = () => boolean | void;

const backHandlersStack: Array<{ id: string; handler: BackHandler }> = [];

export function registerGlobalBackHandler(id: string, handler: BackHandler): () => void {
  const index = backHandlersStack.findIndex((h) => h.id === id);
  if (index !== -1) {
    backHandlersStack.splice(index, 1);
  }
  backHandlersStack.push({ id, handler });

  return () => {
    const idx = backHandlersStack.findIndex((h) => h.id === id);
    if (idx !== -1) {
      backHandlersStack.splice(idx, 1);
    }
  };
}

export function executeRegisteredBackHandlers(): boolean {
  for (let i = backHandlersStack.length - 1; i >= 0; i--) {
    const item = backHandlersStack[i];
    if (item && item.handler) {
      const res = item.handler();
      if (res !== false) {
        return true;
      }
    }
  }
  return false;
}
