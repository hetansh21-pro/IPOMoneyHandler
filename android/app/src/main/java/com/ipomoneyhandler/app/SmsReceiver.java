package com.ipomoneyhandler.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.telephony.SmsMessage;

public class SmsReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if ("android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) {
            Bundle bundle = intent.getExtras();
            if (bundle != null) {
                Object[] pdus = (Object[]) bundle.get("pdus");
                String format = bundle.getString("format");
                if (pdus != null) {
                    for (Object pdu : pdus) {
                        try {
                            SmsMessage msg;
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                                msg = SmsMessage.createFromPdu((byte[]) pdu, format);
                            } else {
                                msg = SmsMessage.createFromPdu((byte[]) pdu);
                            }
                            if (msg != null) {
                                String address = msg.getDisplayOriginatingAddress();
                                String body = msg.getMessageBody();
                                long timestamp = msg.getTimestampMillis();
                                if (timestamp <= 0) {
                                    timestamp = System.currentTimeMillis();
                                }
                                SmsReaderPlugin.onSmsReceivedFromStaticReceiver(address, body, timestamp);
                            }
                        } catch (Exception ignored) {}
                    }
                }
            }
        }
    }
}
