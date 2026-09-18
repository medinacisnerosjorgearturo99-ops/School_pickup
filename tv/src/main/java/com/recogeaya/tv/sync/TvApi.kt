package com.recogeaya.tv.sync

import android.os.Build
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

@Serializable
data class TvPickup(
    val childId: String,
    val firstName: String = "",
    val lastName: String = "",
    val initials: String = "",
    val grade: String = "",
    val group: String = "",
    val responsibleName: String = "",
    val action: String = "PREPARAR",
    val arrived: Boolean = false,
    val etaMinutes: Int? = null,
    val fromParentApp: Boolean = false,
    val verificationCode: String = ""
) {
    val fullName: String get() = "$firstName $lastName".trim()
    val gradeGroup: String
        get() = if (group.isBlank()) grade else "$grade • $group"
}

@Serializable
data class TvClassroom(
    val school: String = "Escuela",
    val grade: String = "Sin grupo",
    val teacher: String = "Sin profesor",
    val classroom: String = "Sin salón",
    val zone: String = "Sin zona",
    val totalStudents: Int = 0,
    val screenId: String = "",
    val groupId: String = "",
    val pairingCode: String = ""
)

@Serializable
data class TvRosterStudent(
    val id: String,
    val firstName: String = "",
    val lastName: String = "",
    val initials: String = "",
    val status: String = "activo"
) {
    val fullName: String get() = "$firstName $lastName".trim()
}

@Serializable
data class TvDashboardState(
    val classroom: TvClassroom = TvClassroom(),
    val pickups: List<TvPickup> = emptyList(),
    val roster: List<TvRosterStudent> = emptyList()
)

@Serializable
data class TvScreenOption(
    val id: String,
    val name: String = "",
    val pairingCode: String = "",
    val groupLabel: String = "",
    val classroom: String = ""
)

@Serializable
data class TvScreensResponse(
    val screens: List<TvScreenOption> = emptyList()
)

object TvApi {
    val BASE_URL: String = if (isEmulator()) "http://10.0.2.2:8080" else "http://10.76.67.180:8080"

    private val json = Json { ignoreUnknownKeys = true }
    private val client = OkHttpClient.Builder()
        .connectTimeout(2, TimeUnit.SECONDS)
        .readTimeout(4, TimeUnit.SECONDS)
        .build()

    fun fetchState(screenId: String?): TvDashboardState? {
        val url = if (screenId.isNullOrBlank()) {
            "$BASE_URL/api/state"
        } else {
            "$BASE_URL/api/state?screenId=${screenId.trim()}"
        }
        return getDashboard(url)
    }

    fun pair(code: String): TvDashboardState? {
        val encoded = java.net.URLEncoder.encode(code.trim(), "UTF-8")
        return getDashboard("$BASE_URL/api/tv/pair/$encoded")
    }

    fun fetchScreens(): List<TvScreenOption>? {
        val request = Request.Builder().url("$BASE_URL/api/tv/screens").get().build()
        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) return null
            val text = response.body?.string() ?: return emptyList()
            return json.decodeFromString<TvScreensResponse>(text).screens
        }
    }

    fun setAction(childId: String, action: String) {
        val media = "application/json; charset=utf-8".toMediaType()
        val request = Request.Builder()
            .url("$BASE_URL/api/pickups/$childId/action")
            .post("""{"action":"$action"}""".toRequestBody(media))
            .build()
        client.newCall(request).execute().close()
    }

    private fun getDashboard(url: String): TvDashboardState? {
        val request = Request.Builder().url(url).get().build()
        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) return null
            val text = response.body?.string() ?: return null
            return json.decodeFromString(text)
        }
    }
}

fun TvPickup.isPrepareNow(): Boolean =
    arrived || action == "PREPARANDO" || action == "LISTO" || (etaMinutes != null && etaMinutes <= 8)

fun TvPickup.arrivalLabel(): String = when {
    arrived || etaMinutes == 0 -> "HA LLEGADO"
    etaMinutes != null -> "A $etaMinutes MIN"
    else -> "EN CAMINO"
}

fun TvPickup.hasArrived(): Boolean = arrived || etaMinutes == 0

private fun isEmulator(): Boolean {
    val fingerprint = Build.FINGERPRINT
    val model = Build.MODEL
    val hardware = Build.HARDWARE
    val product = Build.PRODUCT
    return fingerprint.startsWith("generic") ||
        fingerprint.contains("emulator") ||
        model.contains("Emulator") ||
        model.contains("Android SDK") ||
        hardware.contains("goldfish") ||
        hardware.contains("ranchu") ||
        product.contains("sdk")
}
