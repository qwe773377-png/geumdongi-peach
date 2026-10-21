package com.geumdongi.peach;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.graphics.Bitmap;
import android.content.pm.PackageManager;

/**
 * 웹앱 주소를 그대로 열어 보여 주는 껍데기 앱.
 * 화면은 웹(GitHub Pages)에서 오므로, 웹 파일을 고쳐 올리면 APK를 다시 설치하지 않아도 바로 반영된다.
 * 장바구니(localStorage)와 오프라인 저장(서비스 워커)을 쓰려고 DOM 저장소를 켜 둔다.
 */
public class MainActivity extends Activity {
    private WebView webView;
    private String appUrl;
    private FactoryBluetooth factoryBluetooth;
    private volatile boolean factoryPage = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        appUrl = getString(R.string.app_url);

        webView = new WebView(this);
        webView.setBackgroundColor(0xFFFFF4EA); // 첫 화면이 뜨기 전 흰 번쩍임 방지
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        factoryBluetooth = new FactoryBluetooth(this);
        webView.addJavascriptInterface(factoryBluetooth, "FactoryBluetooth");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                factoryPage = isOwnSite(Uri.parse(url));
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (isOwnSite(uri)) {
                    return false; // 우리 앱 안의 이동은 그대로
                }
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri)); // 바깥 링크는 브라우저로
                } catch (Exception ignored) {
                    // 열 앱이 없으면 아무 일도 하지 않는다
                }
                return true;
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    showOfflinePage(view);
                }
            }
        });

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            webView.loadUrl(appUrl);
        }
    }

    private boolean isOwnSite(Uri uri) {
        Uri own = Uri.parse(appUrl);
        String host = own.getHost();
        return "https".equals(uri.getScheme()) && host != null && host.equals(uri.getHost())
                && uri.getUserInfo() == null && uri.getPath() != null
                && uri.getPath().startsWith(own.getPath());
    }

    boolean isFactoryPage() { return factoryPage; }

    void bluetoothEvent(String json) {
        runOnUiThread(() -> {
            if (webView != null && factoryPage) webView.evaluateJavascript(
                "window.dispatchEvent(new CustomEvent('factory-bluetooth',{detail:" + json + "}));", null);
        });
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(requestCode, permissions, results);
        if (requestCode == FactoryBluetooth.PERMISSION_REQUEST && results.length > 0
                && results[0] == PackageManager.PERMISSION_GRANTED) factoryBluetooth.chooseDevice();
        else if (requestCode == FactoryBluetooth.PERMISSION_REQUEST) bluetoothEvent(
            "{\"type\":\"connection\",\"connected\":false,\"message\":\"주변 기기 연결 권한이 필요합니다.\"}");
    }

    private void showOfflinePage(WebView view) {
        String html = "<html><head><meta charset='utf-8'>"
                + "<meta name='viewport' content='width=device-width, initial-scale=1'></head>"
                + "<body style='margin:0;background:#fff4ea;color:#4a2c1d;font-family:sans-serif;"
                + "display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;'>"
                + "<p style='font-size:1.2rem'>" + getString(R.string.offline_title) + "</p>"
                + "<a href='" + appUrl + "' style='padding:12px 24px;border-radius:12px;"
                + "background:#ff8a65;color:#fff;text-decoration:none'>" + getString(R.string.offline_retry) + "</a>"
                + "</body></html>";
        view.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null);
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (factoryBluetooth != null) factoryBluetooth.close();
        factoryPage = false;
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }
}
