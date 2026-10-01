package com.ipomoneyhandler.app;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.telephony.SmsMessage;
import androidx.core.content.ContextCompat;

import android.provider.Settings;
import androidx.core.app.NotificationManagerCompat;
import java.util.Set;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "SmsReader",
    permissions = {
        @Permission(
            alias = "sms",
            strings = { Manifest.permission.READ_SMS, Manifest.permission.RECEIVE_SMS }
        )
    }
)
public class SmsReaderPlugin extends Plugin {

    private static SmsReaderPlugin staticInstance = null;
    private BroadcastReceiver liveSmsReceiver = null;

    @Override
    public void load() {
        super.load();
        staticInstance = this;
        registerLiveSmsReceiver();
    }

    @Override
    protected void handleOnDestroy() {
        unregisterLiveSmsReceiver();
        if (staticInstance == this) {
            staticInstance = null;
        }
        super.handleOnDestroy();
    }

    public static void onSmsReceivedFromStaticReceiver(String address, String body, long timestamp) {
        if (staticInstance != null && body != null && isFinancialMessage(address, body)) {
            try {
                JSObject data = new JSObject();
                data.put("address", address != null ? address : "");
                data.put("body", body);
                data.put("date", timestamp > 0 ? timestamp : System.currentTimeMillis());
                data.put("isLive", true);
                data.put("source", "sms");
                staticInstance.notifyListeners("liveSmsReceived", data);
            } catch (Exception ignored) {}
        }
    }

    public static void onNotificationReceivedFromStaticReceiver(String packageName, String title, String text, long timestamp) {
        if (staticInstance != null && text != null) {
            String combined = (!title.isEmpty() ? title + " " : "") + text;
            if (isFinancialMessage(packageName, combined)) {
                try {
                    String sender = !title.isEmpty() ? title : packageName;
                    JSObject data = new JSObject();
                    data.put("address", sender);
                    data.put("body", text);
                    data.put("date", timestamp > 0 ? timestamp : System.currentTimeMillis());
                    data.put("isLive", true);
                    data.put("source", "notification");
                    data.put("packageName", packageName != null ? packageName : "");
                    staticInstance.notifyListeners("liveSmsReceived", data);
                    staticInstance.notifyListeners("liveNotificationReceived", data);
                } catch (Exception ignored) {}
            }
        }
    }

    private synchronized void registerLiveSmsReceiver() {
        if (liveSmsReceiver != null) return;
        try {
            liveSmsReceiver = new BroadcastReceiver() {
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

                                            if (body != null && isFinancialMessage(address, body)) {
                                                JSObject data = new JSObject();
                                                data.put("address", address != null ? address : "");
                                                data.put("body", body);
                                                data.put("date", timestamp > 0 ? timestamp : System.currentTimeMillis());
                                                data.put("isLive", true);
                                                notifyListeners("liveSmsReceived", data);
                                            }
                                        }
                                    } catch (Exception ignored) {}
                                }
                            }
                        }
                    }
                }
            };

            IntentFilter filter = new IntentFilter("android.provider.Telephony.SMS_RECEIVED");
            filter.setPriority(IntentFilter.SYSTEM_HIGH_PRIORITY);

            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    getContext().registerReceiver(liveSmsReceiver, filter, Context.RECEIVER_EXPORTED);
                } else {
                    getContext().registerReceiver(liveSmsReceiver, filter);
                }
            } catch (Exception e) {
                // Fallback registration without flags
                getContext().registerReceiver(liveSmsReceiver, filter);
            }
        } catch (Exception ignored) {}
    }

    private synchronized void unregisterLiveSmsReceiver() {
        if (liveSmsReceiver != null) {
            try {
                getContext().unregisterReceiver(liveSmsReceiver);
            } catch (Exception ignored) {}
            liveSmsReceiver = null;
        }
    }

    @PluginMethod
    public void checkPermission(PluginCall call) {
        boolean readGranted = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED;
        boolean receiveGranted = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED;
        JSObject ret = new JSObject();
        ret.put("granted", readGranted || receiveGranted);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        boolean readGranted = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED;
        boolean receiveGranted = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED;
        if (readGranted && receiveGranted) {
            registerLiveSmsReceiver();
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
            return;
        }
        requestPermissionForAlias("sms", call, "smsPermissionCallback");
    }

    @PermissionCallback
    private void smsPermissionCallback(PluginCall call) {
        boolean readGranted = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED;
        boolean receiveGranted = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED;
        if (readGranted || receiveGranted) {
            registerLiveSmsReceiver();
        }
        JSObject ret = new JSObject();
        ret.put("granted", readGranted || receiveGranted);
        call.resolve(ret);
    }

    @PluginMethod
    public void startLiveListener(PluginCall call) {
        registerLiveSmsReceiver();
        JSObject ret = new JSObject();
        ret.put("active", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void stopLiveListener(PluginCall call) {
        unregisterLiveSmsReceiver();
        JSObject ret = new JSObject();
        ret.put("active", false);
        call.resolve(ret);
    }

    @PluginMethod
    public void checkNotificationAccess(PluginCall call) {
        try {
            Context ctx = getContext();
            Set<String> enabledPackages = NotificationManagerCompat.getEnabledListenerPackages(ctx);
            boolean isGranted = enabledPackages != null && enabledPackages.contains(ctx.getPackageName());
            JSObject ret = new JSObject();
            ret.put("granted", isGranted);
            call.resolve(ret);
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("granted", false);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void openNotificationSettings(PluginCall call) {
        try {
            Context ctx = getContext();
            Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(intent);
            JSObject ret = new JSObject();
            ret.put("opened", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to open notification settings: " + e.getMessage());
        }
    }

    @PluginMethod
    public void openAppDetailsSettings(PluginCall call) {
        try {
            Context ctx = getContext();
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            Uri uri = Uri.fromParts("package", ctx.getPackageName(), null);
            intent.setData(uri);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(intent);
            JSObject ret = new JSObject();
            ret.put("opened", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to open app details settings: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getFinancialSms(PluginCall call) {
        if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.READ_SMS) != PackageManager.PERMISSION_GRANTED) {
            call.reject("READ_SMS permission not granted");
            return;
        }

        int maxCount = call.getInt("limit", 50);
        long sinceTimestamp = 0;
        try {
            Double sinceVal = call.getDouble("sinceTimestamp");
            if (sinceVal != null && sinceVal > 0) {
                sinceTimestamp = sinceVal.longValue();
            }
        } catch (Exception ignored) {}

        JSArray smsList = new JSArray();

        try {
            ContentResolver cr = getContext().getContentResolver();
            Uri inboxUri = Uri.parse("content://sms/inbox");
            
            String[] projection = new String[] { "_id", "address", "body", "date" };
            String selection = null;
            String[] selectionArgs = null;

            if (sinceTimestamp > 0) {
                selection = "date >= ?";
                selectionArgs = new String[] { String.valueOf(sinceTimestamp) };
            }

            Cursor cursor = cr.query(inboxUri, projection, selection, selectionArgs, "date DESC LIMIT " + maxCount);

            if (cursor != null && cursor.moveToFirst()) {
                int addressIdx = cursor.getColumnIndex("address");
                int bodyIdx = cursor.getColumnIndex("body");
                int dateIdx = cursor.getColumnIndex("date");

                do {
                    String address = addressIdx != -1 ? cursor.getString(addressIdx) : "";
                    String body = bodyIdx != -1 ? cursor.getString(bodyIdx) : "";
                    long date = dateIdx != -1 ? cursor.getLong(dateIdx) : System.currentTimeMillis();

                    if (body != null && isFinancialMessage(address, body)) {
                        JSObject sms = new JSObject();
                        sms.put("address", address);
                        sms.put("body", body);
                        sms.put("date", date);
                        smsList.put(sms);
                    }
                } while (cursor.moveToNext());

                cursor.close();
            }

            JSObject ret = new JSObject();
            ret.put("messages", smsList);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to read SMS: " + e.getMessage(), e);
        }
    }

    public static boolean isFinancialMessage(String address, String body) {
        if (body == null) return false;
        String b = body.toLowerCase();
        String addr = address != null ? address.toUpperCase() : "";

        boolean hasBankSender = addr.contains("HDFC") || addr.contains("SBI") || addr.contains("ICICI") ||
                                addr.contains("AXIS") || addr.contains("KOTAK") || addr.contains("PNB") ||
                                addr.contains("BOB") || addr.contains("YES") || addr.contains("IDFC") ||
                                addr.contains("PAYTM") || addr.contains("GROWW") || addr.contains("ZERODHA") ||
                                addr.contains("ANGEL") || addr.contains("CANARA") || addr.contains("UNION") ||
                                addr.contains("INDUS") || addr.contains("FEDERAL") || addr.contains("RBL") ||
                                addr.contains("BANDHAN") || addr.contains("AUBANK") || addr.contains("PHONEPE") ||
                                addr.contains("GPAY") || addr.contains("GOOGLE") || addr.contains("PAISA") ||
                                addr.contains("BHIM") || addr.contains("CRED") || addr.contains("MOBIKWIK") ||
                                addr.contains("UPSTOX") || addr.contains("5PAISA") || addr.contains("DHAN") ||
                                addr.contains("AIRTEL") || addr.contains("IPPB") || addr.contains("JUPITER") ||
                                addr.contains("FIMONEY") || addr.contains("SLICE") || addr.contains("NAVI") ||
                                addr.contains("BOI") || addr.contains("CBI") || addr.contains("IOB") ||
                                addr.contains("UCO") || addr.contains("EQUITAS") || addr.contains("UJJIVAN");

        boolean hasFinancialKeyword = b.contains("debited") ||
                                      b.contains("credited") ||
                                      b.contains("mandate") ||
                                      b.contains("ipo") ||
                                      b.contains("asba") ||
                                      b.contains("blocked") ||
                                      b.contains("unblocked") ||
                                      b.contains("lien") ||
                                      b.contains("spent") ||
                                      b.contains("withdrawn") ||
                                      b.contains("deposited") ||
                                      b.contains("transferred") ||
                                      b.contains("refund") ||
                                      b.contains("paid") ||
                                      b.contains("received") ||
                                      b.contains("avail bal") ||
                                      b.contains("avl bal") ||
                                      b.contains("balance is") ||
                                      b.contains("vpa") ||
                                      b.contains("upi") ||
                                      b.contains("autopay") ||
                                      b.contains("payment of") ||
                                      b.contains("successful");

        if (!hasFinancialKeyword && !hasBankSender) return false;

        // Verify currency, transaction, or amount indicators
        return b.contains("rs") || b.contains("inr") || b.contains("₹") || b.contains("amt") ||
               b.contains("a/c") || b.contains("acct") || b.contains("account") || b.contains("txn") ||
               b.contains("ref") || b.contains("bal") || b.contains("paid") || b.contains("sent") ||
               b.contains("received") || b.contains("debited") || b.contains("credited");
    }
}
