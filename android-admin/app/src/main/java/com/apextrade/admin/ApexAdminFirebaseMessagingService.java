package com.apextrade.admin;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

public class ApexAdminFirebaseMessagingService extends FirebaseMessagingService {

    public static final String CHANNEL_ID = "apextrade_admin_channel_v3";
    public static final String CHANNEL_NAME = "ApexTrade Critical Admin Notifications";

    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        MainActivity.sendTokenToServer(token, null, null);
    }

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        String title = "ApexTrade Admin Alert";
        String body = "";

        if (remoteMessage.getNotification() != null) {
            if (remoteMessage.getNotification().getTitle() != null) {
                title = remoteMessage.getNotification().getTitle();
            }
            if (remoteMessage.getNotification().getBody() != null) {
                body = remoteMessage.getNotification().getBody();
            }
        }

        Map<String, String> data = remoteMessage.getData();
        if (data != null && !data.isEmpty()) {
            if (data.containsKey("title") && data.get("title") != null && !data.get("title").isEmpty()) {
                title = data.get("title");
            }
            if (data.containsKey("body") && data.get("body") != null && !data.get("body").isEmpty()) {
                body = data.get("body");
            }
        }

        if (body.isEmpty()) {
            body = "New admin alert: check incoming requests & live traders.";
        }

        sendAdminNotification(title, body, data);
    }

    private void sendAdminNotification(String title, String messageBody, Map<String, String> data) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        if (data != null && data.containsKey("target_url")) {
            intent.putExtra("target_url", data.get("target_url"));
        }

        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                (int) System.currentTimeMillis(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

        NotificationManager notificationManager =
                (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && notificationManager != null) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    CHANNEL_NAME,
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Incoming Deposits, Withdrawals, KYC Submissions, and Live Trader Messages");
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 500, 200, 500});
            channel.enableLights(true);
            channel.setLightColor(0xFFFF5252);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            channel.setShowBadge(true);

            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                    .build();
            channel.setSound(defaultSoundUri, audioAttributes);

            notificationManager.createNotificationChannel(channel);
        }

        NotificationCompat.Builder notificationBuilder =
                new NotificationCompat.Builder(this, CHANNEL_ID)
                        .setSmallIcon(android.R.drawable.ic_dialog_alert)
                        .setContentTitle(title)
                        .setContentText(messageBody)
                        .setStyle(new NotificationCompat.BigTextStyle().bigText(messageBody))
                        .setAutoCancel(true)
                        .setSound(defaultSoundUri)
                        .setPriority(NotificationCompat.PRIORITY_MAX)
                        .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                        .setCategory(NotificationCompat.CATEGORY_ALARM)
                        .setDefaults(NotificationCompat.DEFAULT_ALL)
                        .setVibrate(new long[]{0, 500, 200, 500})
                        .setLights(0xFFFF5252, 1000, 500)
                        .setFullScreenIntent(pendingIntent, false)
                        .setContentIntent(pendingIntent);

        if (notificationManager != null) {
            int notificationId = (int) (System.currentTimeMillis() % 100000);
            notificationManager.notify(notificationId, notificationBuilder.build());
        }
    }
}

