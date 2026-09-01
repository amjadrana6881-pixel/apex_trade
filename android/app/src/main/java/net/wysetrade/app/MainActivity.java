package net.wysetrade.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import android.widget.RelativeLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private ProgressBar progressBar;
    private RelativeLayout splashOverlay;
    private RelativeLayout splashLogo;
    private View splashTitleBox;
    private TextView splashSubtitle;
    private TextView splashStatusText;

    private boolean isPageLoaded = false;
    private boolean isSplashDismissed = false;
    private final Handler handler = new Handler(Looper.getMainLooper());

    private ValueCallback<Uri[]> filePathCallback;
    private final static int FILE_CHOOSER_RESULT_CODE = 1001;

    // Set this to your live Netlify production URL or local development server.
    // When live on Netlify, replace with your live Netlify domain (e.g., "https://your-apextrade.netlify.app")
    private static final String APP_URL = "http://192.168.100.5:3000";

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Bind Views
        webView = findViewById(R.id.webView);
        progressBar = findViewById(R.id.progressBar);
        splashOverlay = findViewById(R.id.splashOverlay);
        splashLogo = findViewById(R.id.splashLogo);
        splashTitleBox = findViewById(R.id.splashTitleBox);
        splashSubtitle = findViewById(R.id.splashSubtitle);
        splashStatusText = findViewById(R.id.splashStatusText);

        // Start Native Animations
        startSplashAnimations();

        // Configure WebView
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setUseWideViewPort(true);
        webSettings.setBuiltInZoomControls(false);
        webSettings.setDisplayZoomControls(false);
        webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);

        // Hardware acceleration for real-time charts & candles
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                if (progressBar != null) progressBar.setVisibility(View.VISIBLE);
                if (splashStatusText != null) {
                    splashStatusText.setText("Loading live market engine...");
                }
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                if (progressBar != null) progressBar.setVisibility(View.GONE);
                isPageLoaded = true;
                
                // Allow users to enjoy the crisp intro animation for at least 1.8s
                handler.postDelayed(() -> dismissSplashWithAnimation(), 1800);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                if (request.isForMainFrame()) {
                    if (splashStatusText != null) {
                        splashStatusText.setText("Connecting to ApexTrade servers...");
                    }
                    Toast.makeText(MainActivity.this, "Connecting to ApexTrade live network...", Toast.LENGTH_SHORT).show();
                    
                    // Dismiss splash screen even on error after 3s so user can see retry/offline view
                    handler.postDelayed(() -> dismissSplashWithAnimation(), 3000);
                }
            }
        });

        // File and camera upload chooser for deposit proofs & KYC document verification
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (progressBar != null) {
                    progressBar.setProgress(newProgress);
                    if (newProgress == 100) {
                        progressBar.setVisibility(View.GONE);
                    }
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
                    Toast.makeText(MainActivity.this, "Cannot open file picker", Toast.LENGTH_SHORT).show();
                    return false;
                }
                return true;
            }
        });

        // Fallback timer: ensure splash never hangs if connection is slow
        handler.postDelayed(() -> {
            if (!isSplashDismissed) {
                dismissSplashWithAnimation();
            }
        }, 3500);

        // Load the live application
        webView.loadUrl(APP_URL);
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
        } catch (Exception e) {
            e.printStackTrace();
        }
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

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
