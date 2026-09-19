package com.ipomoneyhandler.app;

import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        
        int nightModeFlags = getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
        boolean isNightMode = nightModeFlags == Configuration.UI_MODE_NIGHT_YES;

        if (isNightMode) {
            window.setStatusBarColor(Color.parseColor("#0b1120"));
            window.setNavigationBarColor(Color.parseColor("#0b1120"));
        } else {
            window.setStatusBarColor(Color.parseColor("#0f172a"));
            window.setNavigationBarColor(Color.WHITE);
        }

        WindowCompat.setDecorFitsSystemWindows(window, true);

        WindowInsetsControllerCompat controller = new WindowInsetsControllerCompat(window, window.getDecorView());
        controller.setAppearanceLightStatusBars(false); // White icons on dark bar
        controller.setAppearanceLightNavigationBars(!isNightMode);
    }
}
