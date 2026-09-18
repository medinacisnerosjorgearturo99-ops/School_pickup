package com.recogeaya.padres.location

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Build
import android.os.HandlerThread
import android.os.IBinder
import android.os.SystemClock
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.recogeaya.padres.R
import com.recogeaya.padres.sync.RecogeYaApi
import java.util.concurrent.Executors

class PickupLocationService : Service() {
    private val handlerThread = HandlerThread("pickup-location").apply { start() }
    private val io = Executors.newSingleThreadExecutor()
    private val listener = LocationListener { location -> onFix(location) }
    @Volatile private var lastPostAt = 0L

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        startInForeground()
        requestUpdates()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (!hasPermission()) {
            stopSelf()
            return START_NOT_STICKY
        }
        startInForeground()
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        val manager = getSystemService(LocationManager::class.java)
        runCatching { manager?.removeUpdates(listener) }
        handlerThread.quitSafely()
        io.shutdownNow()
        super.onDestroy()
    }

    private fun startInForeground() {
        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(
            NotificationChannel(
                CHANNEL_ID,
                "Ubicación de recogida",
                NotificationManager.IMPORTANCE_LOW
            )
        )
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_launcher)
            .setContentTitle(getString(R.string.location_notification_title))
            .setContentText(getString(R.string.location_notification_text))
            .setOngoing(true)
            .setSilent(true)
            .build()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIF_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION)
        } else {
            startForeground(NOTIF_ID, notification)
        }
    }

    private fun requestUpdates() {
        if (!hasPermission()) return
        val manager = getSystemService(LocationManager::class.java) ?: return
        val looper = handlerThread.looper
        listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER).forEach { provider ->
            if (manager.isProviderEnabled(provider)) {
                runCatching {
                    manager.requestLocationUpdates(provider, 3_000L, 8f, listener, looper)
                }
                runCatching {
                    manager.getLastKnownLocation(provider)?.let(::onFix)
                }
            }
        }
    }

    private fun onFix(location: Location) {
        val ids = LocationShare.childIds
        if (ids.isEmpty()) return
        val destLat = LocationShare.destLat
        val destLng = LocationShare.destLng
        val distance = if (destLat != null && destLng != null) {
            Geo.distanceMeters(location.latitude, location.longitude, destLat, destLng)
        } else {
            null
        }
        val eta = distance?.let { Geo.etaMinutes(it) }
        LocationShare.lastFix.value = LocationFix(
            latitude = location.latitude,
            longitude = location.longitude,
            distanceMeters = distance,
            etaMinutes = eta,
            sharing = true
        )
        val now = SystemClock.elapsedRealtime()
        if (now - lastPostAt < 3_000L) return
        lastPostAt = now
        io.execute {
            runCatching {
                RecogeYaApi.updateLocation(ids, location.latitude, location.longitude, distance, eta)
            }
        }
    }

    private fun hasPermission(): Boolean {
        return ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) ==
            PackageManager.PERMISSION_GRANTED ||
            ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) ==
            PackageManager.PERMISSION_GRANTED
    }

    companion object {
        private const val CHANNEL_ID = "pickup_location"
        private const val NOTIF_ID = 42
    }
}
