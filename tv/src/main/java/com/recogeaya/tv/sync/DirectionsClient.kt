package com.recogeaya.tv.sync

import com.google.android.gms.maps.model.LatLng
import com.recogeaya.tv.BuildConfig
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit

object DirectionsClient {
    private val client = OkHttpClient.Builder()
        .connectTimeout(8, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()

    private val json = Json { ignoreUnknownKeys = true }

    fun drivingRoute(origin: LatLng, destination: LatLng): List<LatLng> {
        val key = BuildConfig.MAPS_API_KEY
        if (key.isBlank()) return emptyList()
        val url =
            "https://maps.googleapis.com/maps/api/directions/json" +
                "?origin=${origin.latitude},${origin.longitude}" +
                "&destination=${destination.latitude},${destination.longitude}" +
                "&mode=driving&key=$key"
        return runCatching {
            val request = Request.Builder().url(url).get().build()
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return emptyList()
                val body = response.body?.string().orEmpty()
                val parsed = json.decodeFromString(DirectionsResponse.serializer(), body)
                if (parsed.status != "OK") return emptyList()
                val points = parsed.routes.firstOrNull()?.overview_polyline?.points.orEmpty()
                decodePolyline(points)
            }
        }.getOrDefault(emptyList())
    }

    /** Google encoded polyline algorithm. */
    private fun decodePolyline(encoded: String): List<LatLng> {
        if (encoded.isBlank()) return emptyList()
        val result = ArrayList<LatLng>()
        var index = 0
        var lat = 0
        var lng = 0
        while (index < encoded.length) {
            var resultLat = 0
            var shift = 0
            var b: Int
            do {
                b = encoded[index++].code - 63
                resultLat = resultLat or ((b and 0x1f) shl shift)
                shift += 5
            } while (b >= 0x20)
            val dlat = if (resultLat and 1 != 0) (resultLat shr 1).inv() else resultLat shr 1
            lat += dlat

            var resultLng = 0
            shift = 0
            do {
                b = encoded[index++].code - 63
                resultLng = resultLng or ((b and 0x1f) shl shift)
                shift += 5
            } while (b >= 0x20)
            val dlng = if (resultLng and 1 != 0) (resultLng shr 1).inv() else resultLng shr 1
            lng += dlng

            result.add(LatLng(lat / 1e5, lng / 1e5))
        }
        return result
    }

    @Serializable
    private data class DirectionsResponse(
        val status: String = "",
        val routes: List<Route> = emptyList()
    )

    @Serializable
    private data class Route(val overview_polyline: OverviewPolyline? = null)

    @Serializable
    private data class OverviewPolyline(val points: String = "")
}
