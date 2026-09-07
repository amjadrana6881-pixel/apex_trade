package com.apextrade.user;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;
import android.webkit.SslErrorHandler;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.RelativeLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.google.firebase.messaging.FirebaseMessaging;

import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class MainActivity extends AppCompatActivity {

    public static final String APP_URL = "https://apextrade.net/dashboard";
    public static final String API_FCM_REGISTER_URL = "https://apextrade.net/api/auth/save-fcm-token";
    private static final int FILE_CHOOSER_RESULT_CODE = 2001;

    private WebView webView;
    private SwipeRefreshLayout swipeRefreshLayout;
    private ProgressBar progressBar;
    private RelativeLayout splashOverlay;
    private RelativeLayout splashLogo;
    private View splashTitleBox;
    private TextView splashSubtitle;
    private TextView splashStatusText;
    private LinearLayout offlineView;
    private Button btnRetry;

    private boolean isPageLoaded = false;
    private boolean isSplashDismissed = false;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private ValueCallback<Uri[]> filePathCallback;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Bind Views
        webView = findViewById(R.id.webView);
        swipeRefreshLayout = findViewById(R.id.swipeRefreshLayout);
        progressBar = findViewById(R.id.progressBar);
        splashOverlay = findViewById(R.id.splashOverlay);
        splashLogo = findViewById(R.id.splashLogo);
        splashTitleBox = findViewById(R.id.splashTitleBox);
        splashSubtitle = findViewById(R.id.splashSubtitle);
        splashStatusText = findViewById(R.id.splashStatusText);
        offlineView = findViewById(R.id.offlineView);
        btnRetry = findViewById(R.id.btnRetry);

        // Native animations
        startSplashAnimations();

        // Setup swipe refresh
        swipeRefreshLayout.setColorSchemeColors(0xFF38BDF8, 0xFF2563EB, 0xFF10B981);
        swipeRefreshLayout.setProgressBackgroundColorSchemeColor(0xFF1E293B);
        swipeRefreshLayout.setOnRefreshListener(() -> {
            offlineView.setVisibility(View.GONE);
            webView.reload();
        });

        // Setup Retry button
        btnRetry.setOnClickListener(v -> {
            offlineView.setVisibility(View.GONE);
            webView.setVisibility(View.VISIBLE);
            webView.reload();
        });

        // Configure hardware-accelerated WebView
        setupWebView();

        // System integrations
        setupBackNavigation();
        requestNotificationPermission();
        fetchAndRegisterFcmToken();

        // Handle target URL or deep links
        String targetUrl = getIntent().getStringExtra("target_url");
        Uri data = getIntent().getData();
        if (targetUrl != null && !targetUrl.isEmpty()) {
            webView.loadUrl(targetUrl);
        } else if (data != null) {
            webView.loadUrl(data.toString());
        } else {
            webView.loadUrl(APP_URL);
        }

        // Safety fallback timer to dismiss splash after 3.5s
        handler.postDelayed(() -> {
            if (!isSplashDismissed) {
                dismissSplashWithAnimation();
            }
        }, 3500);
    }

    private void startSplashAnimations() {
        try {
            if (splashLogo != null) {
                Animation pulse = AnimationUtils.loadAnimation(this, R.anim.pulse);
                splashLogo.startAnimation(pulse);
            }
            if (splashTitleBox != null) {
                Animation fadeIn = AnimationUtils.loadAnimation(this, R.anim.fade_in);
                splashTitleBox.startAnimation(fadeIn);
            }
            if (splashSubtitle != null) {
                Animation slideUp = AnimationUtils.loadAnimation(this, R.anim.slide_up);
                splashSubtitle.startAnimation(slideUp);
            }
        } catch (Exception ignored) {}
    }

    private void dismissSplashWithAnimation() {
        if (isSplashDismissed || splashOverlay == null) return;
        isSplashDismissed = true;

        try {
            Animation fadeOut = AnimationUtils.loadAnimation(this, R.anim.fade_out);
            fadeOut.setAnimationListener(new Animation.AnimationListener() {
                @Override
                public void onAnimationStart(Animation animation) {}

                @Override
                public void onAnimationEnd(Animation animation) {
                    splashOverlay.setVisibility(View.GONE);
                }

                @Override
                public void onAnimationRepeat(Animation animation) {}
            });
            splashOverlay.startAnimation(fadeOut);
        } catch (Exception e) {
            splashOverlay.setVisibility(View.GONE);
        }
    }

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

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress < 100) {
                    progressBar.setVisibility(View.VISIBLE);
                    progressBar.setProgress(newProgress);
                } else {
                    progressBar.setVisibility(View.GONE);
                    swipeRefreshLayout.setRefreshing(false);
                }
            }

            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (MainActivity.this.filePathCallback != null) {
                    MainActivity.this.filePathCallback.onReceiveValue(null);
                }
                MainActivity.this.filePathCallback = filePathCallback;

                Intent intent = fileChooserParams.createIntent();
                try {
                    startActivityForResult(intent, FILE_CHOOSER_RESULT_CODE);
                } catch (Exception e) {
                    MainActivity.this.filePathCallback = null;
                    Toast.makeText(MainActivity.this, "Unable to open file picker", Toast.LENGTH_SHORT).show();
                    return false;
                }
                return true;
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                if (splashStatusText != null && !isSplashDismissed) {
                    splashStatusText.setText("Connecting to ApexTrader live network...");
                }
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                isPageLoaded = true;
                swipeRefreshLayout.setRefreshing(false);
                handler.postDelayed(() -> dismissSplashWithAnimation(), 1400);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                if (request.isForMainFrame()) {
                    swipeRefreshLayout.setRefreshing(false);
                    webView.setVisibility(View.GONE);
                    offlineView.setVisibility(View.VISIBLE);
                    handler.postDelayed(() -> dismissSplashWithAnimation(), 1000);
                }
            }

            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                handler.proceed();
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                if (url.startsWith("tel:") || url.startsWith("mailto:") || url.startsWith("whatsapp:") || url.startsWith("tg:")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        startActivity(intent);
                        return true;
                    } catch (Exception ignored) {}
                }
                return false;
            }
        });
    }

    private void setupBackNavigation() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView != null && webView.canGoBack()) {
                    webView.goBack();
                } else {
                    finish();
                }
            }
        });
    }

    private void requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.POST_NOTIFICATIONS}, 101);
            }
        }
    }

    private void fetchAndRegisterFcmToken() {
        FirebaseMessaging.getInstance().getToken().addOnCompleteListener(task -> {
            if (task.isSuccessful() && task.getResult() != null) {
                String token = task.getResult();
                sendTokenToServer(token);
            }
        });
    }

    public static void sendTokenToServer(String token) {
        new Thread(() -> {
            try {
                URL url = new URL(API_FCM_REGISTER_URL);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setConnectTimeout(6000);
                conn.setReadTimeout(6000);
                conn.setDoOutput(true);

                JSONObject payload = new JSONObject();
                payload.put("token", token);
                payload.put("app_type", "user");
                payload.put("device_os", "android");

                OutputStream os = conn.getOutputStream();
                os.write(payload.toString().getBytes("UTF-8"));
                os.close();

                conn.getResponseCode();
            } catch (Exception ignored) {}
        }).start();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_RESULT_CODE) {
            if (filePathCallback != null) {
                Uri[] results = null;
                if (resultCode == Activity.RESULT_OK && data != null) {
                    String dataString = data.getDataString();
                    if (dataString != null) {
                        results = new Uri[]{Uri.parse(dataString)};
                    } else if (data.getClipData() != null) {
                        int count = data.getClipData().getItemCount();
                        results = new Uri[count];
                        for (int i = 0; i < count; i++) {
                            results[i] = data.getClipData().getItemAt(i).getUri();
                        }
                    }
                }
                filePathCallback.onReceiveValue(results);
                filePathCallback = null;
            }
        } else {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }
}
