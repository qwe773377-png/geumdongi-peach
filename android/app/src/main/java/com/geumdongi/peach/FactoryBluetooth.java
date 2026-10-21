package com.geumdongi.peach;

import android.Manifest;
import android.app.AlertDialog;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothSocket;
import android.content.pm.PackageManager;
import android.os.Build;
import android.webkit.JavascriptInterface;
import org.json.JSONObject;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Classic Bluetooth SPP for HC-05/HC-06. Pair in Android Settings first. */
public final class FactoryBluetooth {
    static final int PERMISSION_REQUEST = 401;
    private static final UUID SPP = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
    private final MainActivity activity;
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private volatile BluetoothSocket socket;
    private volatile boolean connected = false;
    private volatile boolean connecting = false;
    private volatile boolean closed = false;

    FactoryBluetooth(MainActivity activity) { this.activity = activity; }

    private void event(String type, String message, boolean success) {
        try {
            JSONObject data = new JSONObject();
            data.put("type", type); data.put("message", message); data.put("connected", success);
            activity.bluetoothEvent(data.toString());
        } catch (Exception ignored) { }
    }

    @JavascriptInterface public boolean isConnected() { return connected; }

    @JavascriptInterface public void connect() {
        if (!activity.isFactoryPage() || closed) return;
        activity.runOnUiThread(this::chooseDevice);
    }

    void chooseDevice() {
        if (connected) { event("connection", "블루투스 연결됨", true); return; }
        if (connecting || closed) return;
        if (Build.VERSION.SDK_INT >= 31 && activity.checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
            activity.requestPermissions(new String[]{Manifest.permission.BLUETOOTH_CONNECT}, PERMISSION_REQUEST);
            return;
        }
        try {
            BluetoothManager manager = (BluetoothManager) activity.getSystemService(MainActivity.BLUETOOTH_SERVICE);
            BluetoothAdapter adapter = manager == null ? null : manager.getAdapter();
            if (adapter == null || !adapter.isEnabled()) {
                event("connection", "휴대폰 설정에서 블루투스를 켜고 HC-05와 페어링하세요.", false); return;
            }
            List<BluetoothDevice> devices = new ArrayList<>(adapter.getBondedDevices());
            if (devices.isEmpty()) {
                event("connection", "페어링된 기기가 없습니다. 휴대폰 설정에서 모듈을 먼저 등록하세요.", false); return;
            }
            String[] names = new String[devices.size()];
            for (int i = 0; i < names.length; i++) names[i] = devices.get(i).getName() + "\n" + devices.get(i).getAddress();
            new AlertDialog.Builder(activity).setTitle("컨베이어 블루투스 모듈 선택")
                .setItems(names, (dialog, index) -> open(devices.get(index)))
                .setNegativeButton("취소", (dialog, which) -> event("connection", "연결 취소", false)).show();
        } catch (Exception exc) { event("connection", "연결 준비 실패: " + exc.getMessage(), false); }
    }

    private void open(BluetoothDevice device) {
        connecting = true;
        io.execute(() -> {
            BluetoothSocket candidate = null;
            try {
                candidate = device.createRfcommSocketToServiceRecord(SPP);
                socket = candidate; // close() can cancel a blocked connect.
                candidate.connect();
                if (closed) { candidate.close(); return; }
                connected = true;
                event("connection", "블루투스 연결됨", true);
                final BluetoothSocket stream = candidate;
                new Thread(() -> read(stream), "factory-bt-reader").start();
            } catch (Exception exc) {
                connected = false;
                try { if (candidate != null) candidate.close(); } catch (Exception ignored) { }
                event("connection", "연결 실패: " + exc.getMessage(), false);
            } finally { connecting = false; }
        });
    }

    private void read(BluetoothSocket stream) {
        try {
            InputStream input = stream.getInputStream();
            StringBuilder line = new StringBuilder();
            int value;
            while ((value = input.read()) != -1) {
                if (value == '\n') {
                    event("line", line.toString().trim(), true); line.setLength(0);
                } else if (value != '\r') {
                    if (line.length() >= 512) throw new IllegalArgumentException("응답 길이 초과");
                    line.append((char) value);
                }
            }
        } catch (Exception exc) {
            // EOF and read failures are both handled below.
        } finally {
            if (socket == stream) {
                connected = false;
                if (!closed) event("connection", "블루투스 연결이 끊어졌습니다.", false);
            }
            try { stream.close(); } catch (Exception ignored) { }
        }
    }

    @JavascriptInterface public boolean sendOrder(String json) {
        if (!activity.isFactoryPage() || !connected || closed) return false;
        try {
            JSONObject data = new JSONObject(json);
            String id = data.getString("id");
            if (!id.matches("[A-Za-z0-9_-]{1,48}")) return false;
            int a = data.getInt("baekdo"), b = data.getInt("cheondo"), c = data.getInt("hwangdo");
            if (a < 0 || b < 0 || c < 0 || a > 99 || b > 99 || c > 99 || a + b + c == 0) return false;
            final String line = "ORDER|" + id + "|" + a + "|" + b + "|" + c + "\n";
            io.execute(() -> {
                try {
                    BluetoothSocket stream = socket;
                    if (stream == null || !connected) throw new IllegalStateException("연결 없음");
                    stream.getOutputStream().write(line.getBytes(StandardCharsets.US_ASCII));
                    stream.getOutputStream().flush();
                } catch (Exception exc) { event("connection", "주문 전송 실패", false); }
            });
            return true;
        } catch (Exception exc) { return false; }
    }

    void close() {
        closed = true; connected = false;
        try { if (socket != null) socket.close(); } catch (Exception ignored) { }
        io.shutdownNow();
    }
}
