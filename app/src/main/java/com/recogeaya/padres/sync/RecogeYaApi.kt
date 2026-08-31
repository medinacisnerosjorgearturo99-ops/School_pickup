package com.recogeaya.padres.sync

import com.recogeaya.padres.data.Child
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

@Serializable
data class ChildDto(
    val id: String,
    val firstName: String,
    val lastName: String,
    val initials: String,
    val grade: String,
    val group: String,
    val teacher: String,
    val classroom: String
)

@Serializable
data class NotifyPickupRequest(
    val children: List<ChildDto>,
    val responsibleName: String,
    val etaMinutes: Int = 4
)

@Serializable
data class RemotePickup(
    val childId: String,
    val firstName: String = "",
    val lastName: String = "",
    val initials: String = "",
    val grade: String = "",
    val group: String = "",
    val teacher: String = "",
    val classroom: String = "",
    val responsibleName: String = "",
    val action: String = "PREPARAR",
    val arrived: Boolean = false,
    val etaMinutes: Int? = null,
    val fromParentApp: Boolean = false
)

@Serializable
data class ClassroomDto(
    val school: String = "Colegio San Ignacio",
    val grade: String = "2º Primaria • Grupo A",
    val teacher: String = "Prof. Ana Martínez",
    val classroom: String = "Salón A-12",
    val zone: String = "Zona A",
    val totalStudents: Int = 26
)

@Serializable
data class DashboardStateDto(
    val classroom: ClassroomDto = ClassroomDto(),
    val pickups: List<RemotePickup> = emptyList()
)

object RecogeYaApi {
    const val BASE_URL = "http://10.0.2.2:8080"

    private val json = Json { ignoreUnknownKeys = true }
    private val media = "application/json; charset=utf-8".toMediaType()
    private val client = OkHttpClient.Builder()
        .connectTimeout(2, TimeUnit.SECONDS)
        .readTimeout(4, TimeUnit.SECONDS)
        .build()

    fun notifyPickup(children: List<Child>, responsibleName: String, etaMinutes: Int) {
        val body = NotifyPickupRequest(
            children = children.map {
                ChildDto(
                    id = it.id,
                    firstName = it.firstName,
                    lastName = it.lastName,
                    initials = it.initials,
                    grade = it.grade,
                    group = it.group,
                    teacher = it.teacher,
                    classroom = it.classroom
                )
            },
            responsibleName = responsibleName,
            etaMinutes = etaMinutes
        )
        post("/api/pickups", json.encodeToString(body))
    }

    fun markArrived(childId: String) {
        post("/api/pickups/$childId/arrived", """{"arrived":true,"etaMinutes":0}""")
    }

    fun cancel(childId: String) {
        val request = Request.Builder()
            .url("$BASE_URL/api/pickups/$childId")
            .delete()
            .build()
        client.newCall(request).execute().close()
    }

    fun fetchState(): DashboardStateDto? {
        val request = Request.Builder().url("$BASE_URL/api/state").get().build()
        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) return null
            val text = response.body?.string() ?: return null
            return json.decodeFromString(text)
        }
    }

    private fun post(path: String, payload: String) {
        val request = Request.Builder()
            .url("$BASE_URL$path")
            .post(payload.toRequestBody(media))
            .build()
        client.newCall(request).execute().close()
    }
}
