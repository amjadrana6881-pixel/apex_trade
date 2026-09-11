package com.apextrade.admin;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.SslErrorHandler;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.google.firebase.messaging.FirebaseMessaging;

import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class MainActivity extends AppCompatActivity {

    public static final String APP_URL = "https://apextraderpro.vercel.app/admin";
    public static final String API_FCM_REGISTER_URL = "https://apextraderpro.vercel.app/api/auth/save-fcm-token";
    private static final String PREFS_NAME = "ApexTradeAdminPrefs";
    private static final String KEY_SAVED_TOKEN = "saved_admin_fcm_token";
    private static final String KEY_USER_ID = "saved_admin_user_id";
    private static final String KEY_AUTH_TOKEN = "saved_admin_auth_token";

    private static String currentFcmToken = null;
    private static Context appContext = null;

    private WebView webView;
    private ProgressBar progressBar;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        appContext = getApplicationContext();
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webView);
        progressBar = findViewById(R.id.progressBar);

        createHighPriorityNotificationChannel();
        setupWebView();
        requestNotificationPermission();
        fetchAndRegisterFcmToken();

        String targetUrl = getIntent().getStringExtra("target_url");
        if (targetUrl != null && !targetUrl.isEmpty()) {
            webView.loadUrl(targetUrl);
        } else {
            webView.loadUrl(APP_URL);
        }
    }

    private void createHighPriorityNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                NotificationChannel channel = new NotificationChannel(
                        ApexAdminFirebaseMessagingService.CHANNEL_ID,
                        ApexAdminFirebaseMessagingService.CHANNEL_NAME,
                        NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Incoming Deposits, Withdrawals, KYC Submissions, and Live Trader Messages");
                channel.enableVibration(true);
                channel.setVibrationPattern(new long[]{0, 500, 200, 500});
                channel.enableLights(true);
                channel.setLightColor(0xFFFF5252);
                channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
                channel.setShowBadge(true);

                Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
                AudioAttributes audioAttributes = new AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                        .build();
                channel.setSound(defaultSoundUri, audioAttributes);

                notificationManager.createNotificationChannel(channel);
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        // Native bridge for JavaScript Auth & FCM sync
        webView.addJavascriptInterface(new Object() {
            @JavascriptInterface
            public void saveAuthToken(String userId, String authToken) {
                if (appContext != null) {
                    SharedPreferences prefs = appContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                    prefs.edit()
                            .putString(KEY_USER_ID, userId)
                            .putString(KEY_AUTH_TOKEN, authToken)
                            .apply();
                }
                if (currentFcmToken != null && !currentFcmToken.isEmpty()) {
                    sendTokenToServer(currentFcmToken, userId, authToken);
                }
            }

            @JavascriptInterface
            public String getFcmToken() {
                return currentFcmToken != null ? currentFcmToken : "";
            }
        }, "ApexNative");

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress < 100) {
                    progressBar.setVisibility(View.VISIBLE);
                    progressBar.setProgress(newProgress);
                } else {
                    progressBar.setVisibility(View.GONE);
                }
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return false;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                if (currentFcmToken != null && appContext != null) {
                    SharedPreferences prefs = appContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                    String savedUserId = prefs.getString(KEY_USER_ID, null);
                    String savedAuth = prefs.getString(KEY_AUTH_TOKEN, null);
                    if (savedUserId != null) {
                        sendTokenToServer(currentFcmToken, savedUserId, savedAuth);
                    }
                }
            }

            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                handler.proceed(); // Accept SSL for secure admin portal
            }
        });
    }

    private void requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.POST_NOTIFICATIONS}, 102);
            }
        }
    }

    private void fetchAndRegisterFcmToken() {
        FirebaseMessaging.getInstance().getToken().addOnCompleteListener(task -> {
            if (task.isSuccessful() && task.getResult() != null) {
                currentFcmToken = task.getResult();
                String savedUserId = null;
                String savedAuth = null;
                if (appContext != null) {
                    SharedPreferences prefs = appContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                    prefs.edit().putString(KEY_SAVED_TOKEN, currentFcmToken).apply();
                    savedUserId = prefs.getString(KEY_USER_ID, null);
                    savedAuth = prefs.getString(KEY_AUTH_TOKEN, null);
                }
                sendTokenToServer(currentFcmToken, savedUserId, savedAuth);
            }
        });
    }

    public static void sendTokenToServer(String token, String userId, String authToken) {
        if (token == null || token.isEmpty()) return;
        currentFcmToken = token;

        new Thread(() -> {
            try {
                URL url = new URL(API_FCM_REGISTER_URL);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                if (authToken != null && !authToken.isEmpty()) {
                    conn.setRequestProperty("Authorization", "Bearer " + authToken);
                }
                conn.setConnectTimeout(6000);
                conn.setReadTimeout(6000);
                conn.setDoOutput(true);

                JSONObject payload = new JSONObject();
                payload.put("token", token);
                payload.put("app_type", "admin");
                payload.put("device_os", "android");
                if (userId != null && !userId.isEmpty()) {
                    payload.put("user_id", userId);
                }

                OutputStream os = conn.getOutputStream();
                os.write(payload.toString().getBytes("UTF-8"));
                os.close();

                conn.getResponseCode();
            } catch (Exception ignored) {}
        }).start();
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}

