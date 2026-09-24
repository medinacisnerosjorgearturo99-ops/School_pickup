package com.recogeaya.tv.ui

import android.os.Bundle
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.MapsInitializer
import com.google.android.gms.maps.model.BitmapDescriptorFactory
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.LatLngBounds
import com.google.android.gms.maps.model.MarkerOptions
import com.google.android.gms.maps.model.PolylineOptions
import com.recogeaya.tv.BuildConfig
import com.recogeaya.tv.sync.DirectionsClient
import com.recogeaya.tv.sync.TvPickup
import com.recogeaya.tv.sync.arrivalLabel
import com.recogeaya.tv.sync.hasLocation
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import java.util.Locale
import kotlin.math.roundToInt

@Composable
fun ParentLocationDialog(
    pickup: TvPickup,
    zoneLat: Double? = null,
    zoneLng: Double? = null,
    onAction: (String, String) -> Unit,
    onDismiss: () -> Unit
) {
    val hasGps = pickup.hasLocation()
    val destLat = pickup.destLatitude ?: zoneLat
    val destLng = pickup.destLongitude ?: zoneLng
    Dialog(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(24.dp))
                .background(TvColors.Card)
                .border(1.dp, TvColors.Line, RoundedCornerShape(24.dp))
                .padding(18.dp)
        ) {
            Text(pickup.fullName, color = TvColors.Text, fontWeight = FontWeight.ExtraBold, fontSize = 22.sp)
            Text("Responsable: ${pickup.responsibleName}", color = TvColors.Muted, fontSize = 14.sp)
            Text(pickup.arrivalLabel(), color = TvColors.Accent, fontWeight = FontWeight.Bold, fontSize = 16.sp)
            if (hasGps) {
                Text(
                    "GPS en vivo · ${formatCoord(pickup.latitude)} , ${formatCoord(pickup.longitude)}",
                    color = TvColors.Green,
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp
                )
                val key = BuildConfig.MAPS_API_KEY
                if (key.length > 8) {
                    Text(
                        "Key OK · …${key.takeLast(6)}",
                        color = TvColors.Muted,
                        fontSize = 11.sp
                    )
                }
            }
            Spacer(Modifier.height(12.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(300.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color(0xFF0C1624))
            ) {
                when {
                    !hasGps -> Text(
                        "Esperando GPS del padre…",
                        color = TvColors.Muted,
                        modifier = Modifier.padding(16.dp)
                    )
                    !BuildConfig.HAS_MAPS_KEY -> Text(
                        "Falta MAPS_API_KEY en local.properties",
                        color = TvColors.Muted,
                        modifier = Modifier.padding(16.dp)
                    )
                    else -> LiveGoogleMap(
                        lat = pickup.latitude!!,
                        lng = pickup.longitude!!,
                        destLat = destLat,
                        destLng = destLng
                    )
                }
            }
            Spacer(Modifier.height(8.dp))
            Text(
                if (destLat != null && destLng != null) {
                    "Azul = padre  ·  Rojo = zona  ·  línea = ruta Google Directions"
                } else {
                    "Ubicación del padre en Google Maps (marca la zona en admin para ver la ruta)"
                },
                color = TvColors.Muted,
                fontSize = 12.sp
            )
            Spacer(Modifier.height(12.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                if (pickup.action != "PREPARANDO" && pickup.action != "LISTO") {
                    Button(
                        onClick = { onAction(pickup.childId, "PREPARANDO") },
                        colors = ButtonDefaults.buttonColors(containerColor = TvColors.Blue),
                        modifier = Modifier.weight(1f)
                    ) { Text("Preparando", fontWeight = FontWeight.Bold) }
                }
                if (pickup.action != "LISTO") {
                    Button(
                        onClick = { onAction(pickup.childId, "LISTO") },
                        colors = ButtonDefaults.buttonColors(containerColor = TvColors.Green),
                        modifier = Modifier.weight(1f)
                    ) { Text("Preparado", fontWeight = FontWeight.Bold) }
                }
            }
            TextButton(onClick = onDismiss, modifier = Modifier.fillMaxWidth()) {
                Text("Cerrar", color = TvColors.Muted)
            }
        }
    }
}

@Composable
private fun LiveGoogleMap(
    lat: Double,
    lng: Double,
    destLat: Double?,
    destLng: Double?
) {
    val context = LocalContext.current
    val mapView = remember {
        com.google.android.gms.maps.MapView(context).also { it.onCreate(Bundle()) }
    }
    var googleMap by remember { mutableStateOf<GoogleMap?>(null) }
    var status by remember { mutableStateOf("Cargando mapa…") }
    val routeBucket = remember(lat, lng) {
        LatLng((lat * 600).roundToInt() / 600.0, (lng * 600).roundToInt() / 600.0)
    }

    val lifecycle = LocalLifecycleOwner.current.lifecycle
    DisposableEffect(lifecycle, mapView) {
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_START -> mapView.onStart()
                Lifecycle.Event.ON_RESUME -> mapView.onResume()
                Lifecycle.Event.ON_PAUSE -> mapView.onPause()
                Lifecycle.Event.ON_STOP -> mapView.onStop()
                else -> Unit
            }
        }
        lifecycle.addObserver(observer)
        mapView.onStart()
        mapView.onResume()
        onDispose {
            lifecycle.removeObserver(observer)
            runCatching {
                mapView.onPause()
                mapView.onStop()
                mapView.onDestroy()
            }
        }
    }

    LaunchedEffect(Unit) {
        runCatching { MapsInitializer.initialize(context) }
        mapView.getMapAsync { map ->
            map.uiSettings.isZoomControlsEnabled = true
            map.uiSettings.isMapToolbarEnabled = false
            map.mapType = GoogleMap.MAP_TYPE_NORMAL
            googleMap = map
            status = ""
        }
        delay(4000)
        if (googleMap == null) {
            status = "No se pudo iniciar Google Maps. Revisa Play Services."
        } else if (status.isEmpty()) {
            // Still blank tiles usually means billing / API key.
            status = "Si el mapa sigue beige: activa facturación y deja la key sin restricción de app."
            delay(6000)
            status = ""
        }
    }

    LaunchedEffect(googleMap, lat, lng, destLat, destLng) {
        val map = googleMap ?: return@LaunchedEffect
        map.clear()
        val parent = LatLng(lat, lng)
        map.addMarker(
            MarkerOptions()
                .position(parent)
                .title("Padre")
                .icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_AZURE))
        )
        if (destLat != null && destLng != null) {
            val zone = LatLng(destLat, destLng)
            map.addMarker(
                MarkerOptions()
                    .position(zone)
                    .title("Zona de salida")
                    .icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_RED))
            )
            runCatching {
                map.moveCamera(
                    CameraUpdateFactory.newLatLngBounds(
                        LatLngBounds.builder().include(parent).include(zone).build(),
                        100
                    )
                )
            }.onFailure {
                map.moveCamera(CameraUpdateFactory.newLatLngZoom(parent, 15f))
            }
        } else {
            map.moveCamera(CameraUpdateFactory.newLatLngZoom(parent, 15f))
        }
    }

    LaunchedEffect(googleMap, routeBucket, destLat, destLng) {
        val map = googleMap ?: return@LaunchedEffect
        if (destLat == null || destLng == null) return@LaunchedEffect
        val zone = LatLng(destLat, destLng)
        val points = withContext(Dispatchers.IO) {
            DirectionsClient.drivingRoute(routeBucket, zone)
        }
        if (points.size >= 2) {
            map.addPolyline(
                PolylineOptions()
                    .addAll(points)
                    .width(12f)
                    .color(android.graphics.Color.parseColor("#2152FF"))
            )
        }
    }

    Box(Modifier.fillMaxSize()) {
        AndroidView(factory = { mapView }, modifier = Modifier.fillMaxSize())
        if (status.isNotBlank()) {
            Text(
                status,
                color = Color(0xFF0A1322),
                fontWeight = FontWeight.Bold,
                fontSize = 12.sp,
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .padding(10.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(Color(0xCCFFFFFF))
                    .padding(horizontal = 10.dp, vertical = 6.dp)
            )
        }
    }
}

private fun formatCoord(value: Double?): String =
    String.format(Locale.US, "%.5f", value ?: 0.0)
