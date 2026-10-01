import { registerPlugin, Capacitor, PluginListenerHandle } from '@capacitor/core';
import { ParsedSmsTransaction, Account } from '../types/finance';
import { parseBankSms, parseMultipleSms } from '../finance/smsParser';

interface SmsReaderPluginInterface {
  checkPermission(): Promise<{ granted: boolean }>;
  requestPermission(): Promise<{ granted: boolean }>;
  startLiveListener(): Promise<{ active: boolean }>;
  stopLiveListener(): Promise<{ active: boolean }>;
  checkNotificationAccess(): Promise<{ granted: boolean }>;
  openNotificationSettings(): Promise<{ opened: boolean }>;
  openAppDetailsSettings(): Promise<{ opened: boolean }>;
  getFinancialSms(options?: { limit?: number; sinceTimestamp?: number }): Promise<{
    messages: Array<{ address: string; body: string; date: number }>;
  }>;
  addListener(
    eventName: 'liveSmsReceived' | 'liveNotificationReceived',
    listenerFunc: (data: { address: string; body: string; date: number; isLive?: boolean; source?: string; packageName?: string }) => void
  ): Promise<PluginListenerHandle>;
}

export function isNativePlatform(): boolean {
  if (typeof window !== 'undefined') {
    try {
      return Capacitor.isNativePlatform();
    } catch {
      return false;
    }
  }
  return false;
}

export async function checkNotificationAccessPermission(): Promise<boolean> {
  if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
    try {
      const SmsReader = getSmsReader();
      if (!SmsReader) return false;
      const res = await SmsReader.checkNotificationAccess();
      return !!res.granted;
    } catch {
      return false;
    }
  }
  return false;
}

export async function openAndroidNotificationSettings(): Promise<boolean> {
  if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
    try {
      const SmsReader = getSmsReader();
      if (!SmsReader) return false;
      const res = await SmsReader.openNotificationSettings();
      return !!res.opened;
    } catch {
      return false;
    }
  }
  return false;
}

export async function openAndroidAppDetailsSettings(): Promise<boolean> {
  if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
    try {
      const SmsReader = getSmsReader();
      if (!SmsReader) return false;
      const res = await SmsReader.openAppDetailsSettings();
      return !!res.opened;
    } catch {
      return false;
    }
  }
  return false;
}

function getSmsReader() {
  if (typeof window === 'undefined') return null;
  try {
    return registerPlugin<SmsReaderPluginInterface>('SmsReader');
  } catch (e) {
    console.warn('Failed to register SmsReader plugin:', e);
    return null;
  }
}

/**
 * Check or request SMS permissions for live real-time detection
 */
export async function requestSmsPermission(): Promise<{
  granted: boolean;
  isNative: boolean;
  error?: string;
}> {
  if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
    try {
      const SmsReader = getSmsReader();
      if (!SmsReader) {
        return { granted: false, isNative: true, error: 'SmsReader plugin unavailable' };
      }
      const perm = await SmsReader.checkPermission();
      if (perm.granted) {
        return { granted: true, isNative: true };
      }
      const req = await SmsReader.requestPermission();
      return { granted: !!req.granted, isNative: true };
    } catch (err: any) {
      return { granted: false, isNative: true, error: err?.message || 'Permission request failed' };
    }
  }
  return { granted: true, isNative: false };
}

/**
 * Start listening for LIVE incoming SMS in real-time.
 * Only catches new messages that arrive on the device while active.
 */
export async function startLiveSmsTracking(
  onLiveMessage: (tx: ParsedSmsTransaction) => void,
  existingAccounts: Account[] = []
): Promise<{
  active: boolean;
  isNative: boolean;
  stop: () => void;
  error?: string;
}> {
  if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
    try {
      const SmsReader = getSmsReader();
      if (!SmsReader) {
        return {
          active: false,
          isNative: true,
          stop: () => {},
          error: 'SMS plugin not available on this device.',
        };
      }

      const permRes = await requestSmsPermission();
      if (!permRes.granted) {
        return {
          active: false,
          isNative: true,
          stop: () => {},
          error: 'SMS permission not granted. Please allow SMS permission in Android settings.',
        };
      }

      await SmsReader.startLiveListener();

      let handle: PluginListenerHandle | null = null;
      handle = await SmsReader.addListener('liveSmsReceived', (data) => {
        if (!data || !data.body) return;
        const parsed = parseBankSms(
          data.body,
          data.address || '',
          new Date(data.date || Date.now()).toISOString(),
          existingAccounts
        );
        if (parsed) {
          onLiveMessage(parsed);
        }
      });

      const stop = () => {
        if (handle) {
          handle.remove();
        }
        SmsReader.stopLiveListener().catch(() => {});
      };

      return {
        active: true,
        isNative: true,
        stop,
      };
    } catch (err: any) {
      console.error('Failed to start live SMS listener:', err);
      return {
        active: false,
        isNative: true,
        stop: () => {},
        error: err?.message || 'Failed to start live SMS tracker.',
      };
    }
  }

  return {
    active: true,
    isNative: false,
    stop: () => {},
  };
}

/**
 * Global background engine that captures all live bank SMS and notification events
 * and delivers raw payloads for automatic instant confirmation and deduplication.
 */
export async function startGlobalBackgroundSmsSync(
  onRawMessage: (data: { address: string; body: string; date?: number; source?: string; packageName?: string }) => void
): Promise<{ active: boolean; stop: () => void }> {
  if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
    try {
      const SmsReader = getSmsReader();
      if (!SmsReader) return { active: false, stop: () => {} };

      const permRes = await requestSmsPermission();
      if (!permRes.granted) return { active: false, stop: () => {} };

      await SmsReader.startLiveListener();

      const smsHandle = await SmsReader.addListener('liveSmsReceived', (data) => {
        if (!data || !data.body) return;
        onRawMessage(data);
      });

      const notifHandle = await SmsReader.addListener('liveNotificationReceived', (data) => {
        if (!data || !data.body) return;
        onRawMessage(data);
      });

      const stop = () => {
        if (smsHandle) smsHandle.remove();
        if (notifHandle) notifHandle.remove();
        SmsReader.stopLiveListener().catch(() => {});
      };

      return { active: true, stop };
    } catch (e) {
      console.warn('Failed to start global background SMS sync:', e);
      return { active: false, stop: () => {} };
    }
  }
  return { active: true, stop: () => {} };
}

/**
 * Fetch ONLY live SMS received since a specific timestamp (never old history).
 */
export async function fetchLiveSmsSince(
  sinceTimestamp: number,
  existingAccounts: Account[] = []
): Promise<{
  success: boolean;
  hasPermission: boolean;
  transactions: ParsedSmsTransaction[];
  error?: string;
  isNative: boolean;
}> {
  if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
    try {
      const SmsReader = getSmsReader();
      if (!SmsReader) {
        return {
          success: false,
          hasPermission: false,
          transactions: [],
          error: 'SMS reader plugin is not available.',
          isNative: true,
        };
      }

      const perm = await requestSmsPermission();
      if (!perm.granted) {
        return {
          success: false,
          hasPermission: false,
          transactions: [],
          error: 'SMS permission is required to detect incoming bank messages.',
          isNative: true,
        };
      }

      // Query messages since the specified timestamp (default up to 48 hours window)
      const querySince = sinceTimestamp > 0
        ? Math.max(sinceTimestamp, Date.now() - 48 * 60 * 60 * 1000)
        : Date.now() - 24 * 60 * 60 * 1000;

      const res = await SmsReader.getFinancialSms({
        limit: 50,
        sinceTimestamp: querySince,
      });

      const rawMessages = res.messages || [];
      const parsed = parseMultipleSms(rawMessages, existingAccounts);

      return {
        success: true,
        hasPermission: true,
        transactions: parsed,
        isNative: true,
      };
    } catch (err: any) {
      console.error('Native SMS scan failed:', err);
      return {
        success: false,
        hasPermission: true,
        transactions: [],
        error: err?.message || 'Failed to fetch live SMS.',
        isNative: true,
      };
    }
  }

  return {
    success: true,
    hasPermission: true,
    transactions: [],
    isNative: false,
  };
}

// Backward compatibility alias for any existing callers, enforcing live window
export async function requestAndScanBankSms(existingAccounts: Account[] = []) {
  // Default to 15 minutes window so old history is NEVER scanned
  return fetchLiveSmsSince(Date.now() - 15 * 60 * 1000, existingAccounts);
}

