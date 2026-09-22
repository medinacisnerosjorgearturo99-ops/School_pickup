package com.recogeaya.tv.ui

import android.annotation.SuppressLint
import android.webkit.WebView
import android.webkit.WebViewClient
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
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import com.recogeaya.tv.sync.TvPickup
import com.recogeaya.tv.sync.arrivalLabel

@Composable
fun ParentLocationDialog(
    pickup: TvPickup,
    onAction: (String, String) -> Unit,
    onDismiss: () -> Unit
) {
    val html = remember { mapHtml() }
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
            Spacer(Modifier.height(12.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(280.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color(0xFF0C1624))
            ) {
                if (pickup.latitude != null && pickup.longitude != null) {
                    LocationMap(html, pickup.latitude, pickup.longitude)
                } else {
                    Text(
                        "Esperando GPS del padre…",
                        color = TvColors.Muted,
                        modifier = Modifier.padding(16.dp)
                    )
                }
            }
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

@SuppressLint("SetJavaScriptEnabled")
@Composable
private fun LocationMap(html: String, lat: Double, lng: Double) {
    AndroidView(
        modifier = Modifier.fillMaxSize(),
        factory = { context ->
            WebView(context).apply {
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                webViewClient = WebViewClient()
                loadDataWithBaseURL("https://schoolpickup.local/", html, "text/html", "utf-8", null)
            }
        },
        update = { view ->
            view.evaluateJavascript("setPos($lat,$lng);", null)
        }
    )
}

private fun mapHtml(): String = """
<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#m{height:100%;margin:0;background:#071018}</style>
</head>
<body>
<div id="m"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
let map, marker;
function setPos(lat,lng){
  const p=[lat,lng];
  if(!map){
    map=L.map('m').setView(p,15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
    marker=L.marker(p).addTo(map);
  } else {
    marker.setLatLng(p);
    map.panTo(p);
  }
}
</script>
</body>
</html>
""".trimIndent()
