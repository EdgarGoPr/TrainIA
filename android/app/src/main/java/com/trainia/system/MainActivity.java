package com.trainia.system;

import android.os.Bundle;
import android.content.Intent;
import android.net.Uri;
import android.webkit.DownloadListener;
import com.getcapacitor.BridgeActivity;
import com.capacitorjs.plugins.localnotifications.LocalNotificationsPlugin;

public class MainActivity extends BridgeActivity {
    private long lastDownloadTimestamp = 0;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LocalNotificationsPlugin.class);
        super.onCreate(savedInstanceState);
        
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().setDownloadListener(new DownloadListener() {
                    @Override
                    public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimetype, long contentLength) {
                        long now = System.currentTimeMillis();
                        // Debounce: prevent duplicate downloads within 3.5 seconds
                        if (now - lastDownloadTimestamp < 3500) {
                            return;
                        }
                        lastDownloadTimestamp = now;

                        try {
                            // Stop WebView from following further redirect hops internally
                            if (getBridge() != null && getBridge().getWebView() != null) {
                                getBridge().getWebView().stopLoading();
                            }
                        } catch (Exception ignored) {}

                        try {
                            Intent i = new Intent(Intent.ACTION_VIEW);
                            i.setData(Uri.parse(url));
                            startActivity(i);
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    }
                });
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

