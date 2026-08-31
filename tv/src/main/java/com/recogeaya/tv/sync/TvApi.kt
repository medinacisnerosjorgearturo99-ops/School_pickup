package com.recogeaya.tv.sync

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import okhttp3.OkHttpClient
import okhttp3.Request
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
    val fromParentApp: Boolean = false
) {
    val fullName: String get() = "$firstName $lastName".trim()
    val gradeGroup: String
        get() = if (group.isBlank()) grade else "$grade • $group"
}

@Serializable
data class TvClassroom(
    val school: String = "Colegio San Ignacio",
    val grade: String = "2º Primaria • Grupo A",
    val teacher: String = "Prof. Ana Martínez",
    val classroom: String = "Salón A-12",
    val zone: String = "Zona A",
    val totalStudents: Int = 26,
    val screenId: String = "scr-ciclo-2026-2-a",
    val groupId: String = "ciclo-2026-2-a",
    val pairingCode: String = "CSI-A12"
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
    const val BASE_URL = "http://10.0.2.2:8080"

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

    fun fetchScreens(): List<TvScreenOption> {
        val request = Request.Builder().url("$BASE_URL/api/tv/screens").get().build()
        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) return emptyList()
            val text = response.body?.string() ?: return emptyList()
            return json.decodeFromString<TvScreensResponse>(text).screens
        }
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
