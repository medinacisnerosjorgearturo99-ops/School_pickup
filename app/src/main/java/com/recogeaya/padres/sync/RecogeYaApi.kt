package com.recogeaya.padres.sync

import com.recogeaya.padres.data.Child
import com.recogeaya.padres.data.ParentAccount
import com.recogeaya.padres.data.ParentProfile
import com.recogeaya.padres.data.ResponsibleKind
import com.recogeaya.padres.data.ResponsiblePerson
import com.recogeaya.padres.data.School
import android.os.Build
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
    val etaMinutes: Int? = null,
    val verificationCode: String = ""
)

@Serializable
data class LocationUpdateRequest(
    val childIds: List<String>,
    val latitude: Double,
    val longitude: Double,
    val distanceMeters: Int? = null,
    val etaMinutes: Int? = null
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
    val fromParentApp: Boolean = false,
    val verificationCode: String = "",
    val zone: String = ""
)

@Serializable
data class ParentLoginRequest(
    val email: String,
    val password: String
)

@Serializable
data class ParentChildDto(
    val id: String,
    val firstName: String = "",
    val lastName: String = "",
    val grade: String = "",
    val group: String = "",
    val teacher: String = "",
    val classroom: String = "",
    val schoolId: String = "",
    val schoolName: String = "",
    val zone: String = "",
    val zonePhone: String = "",
    val zoneLat: Double? = null,
    val zoneLng: Double? = null
)

@Serializable
data class ParentPersonDto(
    val id: String,
    val name: String = "",
    val initials: String = "",
    val relation: String = "",
    val kind: String = "PRIMARY"
)

@Serializable
data class ParentLoginResponse(
    val ok: Boolean = false,
    val error: String? = null,
    val profileName: String = "",
    val profileInitials: String = "",
    val email: String = "",
    val schoolName: String = "",
    val pickupZone: String = "",
    val receptionPhone: String = "",
    val children: List<ParentChildDto> = emptyList(),
    val people: List<ParentPersonDto> = emptyList()
)

data class ParentSessionData(
    val account: ParentAccount,
    val school: School,
    val children: List<Child>,
    val people: List<ResponsiblePerson>,
    val pickupZone: String,
    val receptionPhone: String
)

@Serializable
data class ParentStateDto(
    val pickups: List<RemotePickup> = emptyList(),
    val zone: String = "",
    val receptionPhone: String = "",
    val zoneLat: Double? = null,
    val zoneLng: Double? = null
)

object RecogeYaApi {
    val BASE_URL: String = if (isEmulator()) "http://10.0.2.2:8080" else "http://10.76.67.180:8080"

    private val json = Json { ignoreUnknownKeys = true }
    private val media = "application/json; charset=utf-8".toMediaType()
    private val client = OkHttpClient.Builder()
        .connectTimeout(5, TimeUnit.SECONDS)
        .readTimeout(8, TimeUnit.SECONDS)
        .build()

    fun login(email: String, password: String): ParentLoginResponse {
        val request = Request.Builder()
            .url("$BASE_URL/api/parent/login")
            .post(json.encodeToString(ParentLoginRequest(email.trim(), password.trim())).toRequestBody(media))
            .build()
        client.newCall(request).execute().use { response ->
            val text = response.body?.string().orEmpty()
            if (text.isBlank()) {
                return ParentLoginResponse(ok = false, error = "No se pudo conectar con la escuela.")
            }
            return json.decodeFromString(text)
        }
    }

    fun notifyPickup(children: List<Child>, responsibleName: String, verificationCode: String) {
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
            verificationCode = verificationCode
        )
        post("/api/pickups", json.encodeToString(body))
    }

    fun updateLocation(
        childIds: List<String>,
        latitude: Double,
        longitude: Double,
        distanceMeters: Int?,
        etaMinutes: Int?
    ) {
        if (childIds.isEmpty()) return
        val body = LocationUpdateRequest(
            childIds = childIds,
            latitude = latitude,
            longitude = longitude,
            distanceMeters = distanceMeters,
            etaMinutes = etaMinutes
        )
        post("/api/pickups/location", json.encodeToString(body))
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

    fun fetchParentState(childIds: List<String>): ParentStateDto? {
        if (childIds.isEmpty()) return ParentStateDto()
        val ids = childIds.joinToString(",")
        val request = Request.Builder().url("$BASE_URL/api/parent/state?ids=$ids").get().build()
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

fun ParentLoginResponse.toSession(): ParentSessionData {
    val children = children.map { dto ->
        Child(
            id = dto.id,
            firstName = dto.firstName,
            lastName = dto.lastName,
            grade = dto.grade,
            group = dto.group,
            teacher = dto.teacher,
            classroom = dto.classroom,
            schoolId = dto.schoolId.ifBlank { "school" },
            zoneLat = dto.zoneLat,
            zoneLng = dto.zoneLng
        )
    }
    val people = people.map { person ->
        ResponsiblePerson(
            id = person.id,
            name = person.name,
            initials = person.initials.ifBlank { "R" },
            relation = person.relation,
            kind = when (person.kind.uppercase()) {
                "AUTHORIZED" -> ResponsibleKind.AUTHORIZED
                "TEMPORARY" -> ResponsibleKind.TEMPORARY
                else -> ResponsibleKind.PRIMARY
            }
        )
    }
    return ParentSessionData(
        account = ParentAccount(
            email = email,
            password = "",
            profile = ParentProfile(name = profileName, initials = profileInitials.ifBlank { "R" })
        ),
        school = School(id = "school", name = schoolName.ifBlank { "Escuela" }, shortName = schoolName.ifBlank { "Escuela" }),
        children = children,
        people = people,
        pickupZone = pickupZone,
        receptionPhone = receptionPhone
    )
}

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
