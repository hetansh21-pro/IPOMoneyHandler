package com.ipomoneyhandler.app;

import android.app.Notification;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

/**
 * Real-time Android Notification Listener Service
 * Automatically captures incoming bank, UPI, and broker transaction alerts in real-time
 * (e.g. Google Pay, PhonePe, Paytm, HDFC, SBI, ICICI, Kotak, Axis, Zerodha, Groww).
 */
public class FinancialNotificationListenerService extends NotificationListenerService {

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null || sbn.getNotification() == null) return;

        try {
            String packageName = sbn.getPackageName() != null ? sbn.getPackageName() : "";
            Bundle extras = sbn.getNotification().extras;
            if (extras == null) return;

            CharSequence titleSeq = extras.getCharSequence(Notification.EXTRA_TITLE);
            CharSequence textSeq = extras.getCharSequence(Notification.EXTRA_TEXT);
            CharSequence bigTextSeq = extras.getCharSequence(Notification.EXTRA_BIG_TEXT);

            String title = titleSeq != null ? titleSeq.toString() : "";
            String text = bigTextSeq != null ? bigTextSeq.toString() : (textSeq != null ? textSeq.toString() : "");

            if (text.isEmpty() && title.isEmpty()) return;

            String combined = title + " " + text;

            if (SmsReaderPlugin.isFinancialMessage(packageName, combined)) {
                SmsReaderPlugin.onNotificationReceivedFromStaticReceiver(
                    packageName,
                    title,
                    text,
                    sbn.getPostTime()
                );
            }
        } catch (Exception ignored) {}
    }
}
