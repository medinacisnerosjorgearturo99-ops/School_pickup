package com.recogeaya.server

import kotlinx.serialization.Serializable

enum class TeacherAction {
    PREPARAR,
    PREPARANDO,
    LISTO
}

@Serializable
data class PickupEntry(
    val childId: String,
    val firstName: String,
    val lastName: String,
    val initials: String,
    val grade: String,
    val group: String,
    val teacher: String,
    val classroom: String,
    val responsibleName: String,
    val etaMinutes: Int? = null,
    val arrived: Boolean = false,
    val action: String = TeacherAction.PREPARAR.name,
    val fromParentApp: Boolean = false,
    val verificationCode: String = "",
    val zone: String = ""
) {
    val fullName: String get() = "$firstName $lastName"
}

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
data class ActionRequest(
    val action: String
)

@Serializable
data class ArrivedRequest(
    val arrived: Boolean = true,
    val etaMinutes: Int = 0
)

@Serializable
data class LocationUpdateRequest(
    val childIds: List<String> = emptyList(),
    val latitude: Double,
    val longitude: Double,
    val distanceMeters: Int? = null,
    val etaMinutes: Int? = null
)

@Serializable
data class ClassroomInfo(
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
data class RosterStudent(
    val id: String,
    val firstName: String,
    val lastName: String,
    val initials: String,
    val status: String = "activo"
) {
    val fullName: String get() = "$firstName $lastName"
}

@Serializable
data class ScreenDto(
    val id: String,
    val name: String,
    val location: String,
    val groupId: String? = null,
    val pairingCode: String,
    val online: Boolean = true
)

@Serializable
data class GroupDto(
    val id: String,
    val grade: String,
    val letter: String,
    val classroom: String,
    val teacherName: String,
    val zoneName: String,
    val zonePhone: String = "",
    val zoneLat: Double? = null,
    val zoneLng: Double? = null
)

@Serializable
data class StudentSyncDto(
    val id: String,
    val firstName: String,
    val lastName: String,
    val initials: String,
    val groupId: String,
    val status: String = "activo",
    val guardianName: String = "",
    val guardianIds: List<String> = emptyList()
)

@Serializable
data class GuardianSyncDto(
    val id: String,
    val name: String,
    val email: String,
    val password: String = "",
    val phone: String = "",
    val relation: String = "",
    val kind: String = "PRIMARY"
)

@Serializable
data class SchoolSyncRequest(
    val schoolName: String = "Escuela",
    val screens: List<ScreenDto> = emptyList(),
    val groups: List<GroupDto> = emptyList(),
    val students: List<StudentSyncDto> = emptyList(),
    val guardians: List<GuardianSyncDto> = emptyList()
)

@Serializable
data class DashboardState(
    val classroom: ClassroomInfo,
    val pickups: List<PickupEntry>,
    val roster: List<RosterStudent> = emptyList()
)

@Serializable
data class ScreenPickDto(
    val id: String,
    val name: String,
    val pairingCode: String,
    val groupLabel: String,
    val classroom: String
)

@Serializable
data class ScreensResponse(
    val screens: List<ScreenPickDto> = emptyList()
)

@Serializable
data class ParentLoginRequest(
    val email: String,
    val password: String
)

@Serializable
data class ParentChildDto(
    val id: String,
    val firstName: String,
    val lastName: String,
    val grade: String,
    val group: String,
    val teacher: String,
    val classroom: String,
    val schoolId: String,
    val schoolName: String,
    val zone: String = "",
    val zonePhone: String = "",
    val zoneLat: Double? = null,
    val zoneLng: Double? = null
)

@Serializable
data class ParentPersonDto(
    val id: String,
    val name: String,
    val initials: String,
    val relation: String,
    val kind: String
)

@Serializable
data class ParentLoginResponse(
    val ok: Boolean,
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

@Serializable
data class ParentStateResponse(
    val pickups: List<PickupEntry> = emptyList(),
    val zone: String = "",
    val receptionPhone: String = "",
    val zoneLat: Double? = null,
    val zoneLng: Double? = null
)

@Serializable
data class PickupEvent(
    val id: String,
    val at: String,
    val childName: String,
    val groupLabel: String,
    val zone: String,
    val responsibleName: String,
    val event: String
)

@Serializable
data class PickupHistoryResponse(
    val events: List<PickupEvent> = emptyList()
)

@Serializable
data class PickupSnapshot(
    val pickups: List<PickupEntry> = emptyList(),
    val history: List<PickupEvent> = emptyList()
)
