package com.recogeaya.tv.ui

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PorterDuff
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.asinh
import kotlin.math.cos
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.tan

/**
 * Builds a street map bitmap (real tiles) with driving route + pins.
 * Avoids WebView/Leaflet, which often stay blank on classroom TVs.
 */
object RouteMapBitmap {
    private const val WIDTH = 720
    private const val HEIGHT = 400
    private const val TILE = 256

    private val client = OkHttpClient.Builder()
        .connectTimeout(8, TimeUnit.SECONDS)
        .readTimeout(12, TimeUnit.SECONDS)
        .build()

    private val json = Json { ignoreUnknownKeys = true }

    private val tileServers = listOf(
        "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
    )

    fun render(
        parentLat: Double,
        parentLng: Double,
        destLat: Double?,
        destLng: Double?
    ): Bitmap {
        val hasDest = destLat != null && destLng != null
        val route = if (hasDest) fetchRoute(parentLng, parentLat, destLng!!, destLat!!) else emptyList()
        val points = buildList {
            add(parentLat to parentLng)
            if (hasDest) add(destLat!! to destLng!!)
            addAll(route)
        }
        val zoom = chooseZoom(points)
        val (minX, minY, maxX, maxY) = worldBounds(points, zoom)
        val pad = 48.0
        val viewW = max(maxX - minX + pad * 2, WIDTH.toDouble())
        val viewH = max(maxY - minY + pad * 2, HEIGHT.toDouble())
        val scale = min(WIDTH / viewW, HEIGHT / viewH)
        val originX = (minX + maxX) / 2.0 - (WIDTH / scale) / 2.0
        val originY = (minY + maxY) / 2.0 - (HEIGHT / scale) / 2.0

        val bitmap = Bitmap.createBitmap(WIDTH, HEIGHT, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        canvas.drawColor(android.graphics.Color.parseColor("#E8EEF2"))

        val tileMinX = floor(originX / TILE).toInt()
        val tileMinY = floor(originY / TILE).toInt()
        val tileMaxX = floor((originX + WIDTH / scale) / TILE).toInt()
        val tileMaxY = floor((originY + HEIGHT / scale) / TILE).toInt()

        var anyTile = false
        for (ty in tileMinY..tileMaxY) {
            for (tx in tileMinX..tileMaxX) {
                val tile = downloadTile(zoom, tx, ty) ?: continue
                anyTile = true
                val left = ((tx * TILE - originX) * scale).toFloat()
                val top = ((ty * TILE - originY) * scale).toFloat()
                val right = left + (TILE * scale).toFloat()
                val bottom = top + (TILE * scale).toFloat()
                canvas.drawBitmap(tile, null, android.graphics.RectF(left, top, right, bottom), null)
                tile.recycle()
            }
        }

        if (!anyTile) {
            drawPlainBackground(canvas)
        }

        fun toScreen(lat: Double, lng: Double): Pair<Float, Float> {
            val (wx, wy) = latLngToWorldPixel(lat, lng, zoom)
            val sx = ((wx - originX) * scale).toFloat()
            val sy = ((wy - originY) * scale).toFloat()
            return sx to sy
        }

        val routePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = android.graphics.Color.parseColor("#2152FF")
            style = Paint.Style.STROKE
            strokeWidth = 10f
            strokeCap = Paint.Cap.ROUND
            strokeJoin = Paint.Join.ROUND
        }
        val routeOutline = Paint(routePaint).apply {
            color = android.graphics.Color.parseColor("#F4F7FB")
            strokeWidth = 16f
        }

        val pathPoints = if (route.isNotEmpty()) route else if (hasDest) {
            listOf(parentLat to parentLng, destLat!! to destLng!!)
        } else emptyList()

        if (pathPoints.size >= 2) {
            val path = Path()
            pathPoints.forEachIndexed { index, (lat, lng) ->
                val (x, y) = toScreen(lat, lng)
                if (index == 0) path.moveTo(x, y) else path.lineTo(x, y)
            }
            canvas.drawPath(path, routeOutline)
            canvas.drawPath(path, routePaint)
        }

        if (hasDest) {
            val (dx, dy) = toScreen(destLat!!, destLng!!)
            drawPin(canvas, dx, dy, android.graphics.Color.parseColor("#EF4444"), "Z")
        }
        val (px, py) = toScreen(parentLat, parentLng)
        drawPin(canvas, px, py, android.graphics.Color.parseColor("#2152FF"), "P")

        val label = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = android.graphics.Color.parseColor("#0A1322")
            textSize = 26f
            isFakeBoldText = true
            setShadowLayer(4f, 0f, 1f, android.graphics.Color.parseColor("#80FFFFFF"))
        }
        canvas.drawText(
            if (hasDest) "Ruta del padre → zona de salida" else "Ubicación del padre",
            18f,
            34f,
            label
        )
        return bitmap
    }

    private fun fetchRoute(
        fromLng: Double,
        fromLat: Double,
        toLng: Double,
        toLat: Double
    ): List<Pair<Double, Double>> {
        val url =
            "https://router.project-osrm.org/route/v1/driving/" +
                "$fromLng,$fromLat;$toLng,$toLat?overview=full&geometries=geojson"
        return runCatching {
            val body = httpGet(url) ?: return emptyList()
            val parsed = json.decodeFromString(OsrmResponse.serializer(), body)
            val coords = parsed.routes.firstOrNull()?.geometry?.coordinates.orEmpty()
            coords.mapNotNull { pair ->
                val lng = pair.getOrNull(0) ?: return@mapNotNull null
                val lat = pair.getOrNull(1) ?: return@mapNotNull null
                lat to lng
            }
        }.getOrDefault(emptyList())
    }

    private fun downloadTile(zoom: Int, x: Int, y: Int): Bitmap? {
        val n = 1 shl zoom
        if (x < 0 || y < 0 || x >= n || y >= n) return null
        for (template in tileServers) {
            val url = template
                .replace("{z}", zoom.toString())
                .replace("{x}", x.toString())
                .replace("{y}", y.toString())
            val bytes = httpBytes(url) ?: continue
            val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
            if (bitmap != null) return bitmap
        }
        return null
    }

    private fun httpGet(url: String): String? {
        return runCatching {
            val request = Request.Builder()
                .url(url)
                .header("User-Agent", "SchoolPickupTV/1.0")
                .header("Accept", "application/json")
                .get()
                .build()
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) null else response.body?.string()
            }
        }.getOrNull()
    }

    private fun httpBytes(url: String): ByteArray? {
        return runCatching {
            val request = Request.Builder()
                .url(url)
                .header("User-Agent", "SchoolPickupTV/1.0 (classroom map)")
                .header("Accept", "image/png,image/jpeg,*/*")
                .get()
                .build()
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) null else response.body?.bytes()
            }
        }.getOrNull()
    }

    private fun chooseZoom(points: List<Pair<Double, Double>>): Int {
        if (points.size <= 1) return 15
        for (z in 16 downTo 12) {
            val (minX, minY, maxX, maxY) = worldBounds(points, z)
            if (maxX - minX < WIDTH * 0.85 && maxY - minY < HEIGHT * 0.85) return z
        }
        return 12
    }

    private fun worldBounds(
        points: List<Pair<Double, Double>>,
        zoom: Int
    ): Quad {
        var minX = Double.POSITIVE_INFINITY
        var minY = Double.POSITIVE_INFINITY
        var maxX = Double.NEGATIVE_INFINITY
        var maxY = Double.NEGATIVE_INFINITY
        points.forEach { (lat, lng) ->
            val (x, y) = latLngToWorldPixel(lat, lng, zoom)
            minX = min(minX, x)
            minY = min(minY, y)
            maxX = max(maxX, x)
            maxY = max(maxY, y)
        }
        if (!minX.isFinite()) {
            val (x, y) = latLngToWorldPixel(19.43, -99.13, zoom)
            return Quad(x - 200, y - 120, x + 200, y + 120)
        }
        // Avoid zero-size bounds when parent is almost at school.
        if (abs(maxX - minX) < 80) {
            minX -= 80
            maxX += 80
        }
        if (abs(maxY - minY) < 80) {
            minY -= 80
            maxY += 80
        }
        return Quad(minX, minY, maxX, maxY)
    }

    private fun latLngToWorldPixel(lat: Double, lng: Double, zoom: Int): Pair<Double, Double> {
        val scale = TILE * 2.0.pow(zoom)
        val x = (lng + 180.0) / 360.0 * scale
        val latRad = Math.toRadians(lat.coerceIn(-85.0511, 85.0511))
        val y = (1.0 - asinh(tan(latRad)) / PI) / 2.0 * scale
        return x to y
    }

    private fun drawPin(canvas: Canvas, x: Float, y: Float, color: Int, letter: String) {
        val paint = Paint(Paint.ANTI_ALIAS_FLAG)
        paint.color = android.graphics.Color.WHITE
        canvas.drawCircle(x, y, 18f, paint)
        paint.color = color
        canvas.drawCircle(x, y, 14f, paint)
        paint.color = android.graphics.Color.WHITE
        paint.textSize = 16f
        paint.isFakeBoldText = true
        paint.textAlign = Paint.Align.CENTER
        canvas.drawText(letter, x, y + 6f, paint)
    }

    private fun drawPlainBackground(canvas: Canvas) {
        canvas.drawColor(android.graphics.Color.parseColor("#D9E2EC"), PorterDuff.Mode.SRC)
        val paint = Paint(Paint.ANTI_ALIAS_FLAG)
        paint.color = android.graphics.Color.parseColor("#B7C4D1")
        paint.strokeWidth = 10f
        for (i in 1..6) {
            val y = HEIGHT * (i / 7f)
            canvas.drawLine(0f, y, WIDTH.toFloat(), y, paint)
            val x = WIDTH * (i / 7f)
            canvas.drawLine(x, 0f, x, HEIGHT.toFloat(), paint)
        }
    }

    private data class Quad(val minX: Double, val minY: Double, val maxX: Double, val maxY: Double)

    @Serializable
    private data class OsrmResponse(val routes: List<OsrmRoute> = emptyList())

    @Serializable
    private data class OsrmRoute(val geometry: OsrmGeometry? = null)

    @Serializable
    private data class OsrmGeometry(val coordinates: List<List<Double>> = emptyList())
}
