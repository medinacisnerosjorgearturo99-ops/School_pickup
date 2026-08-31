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
    val fromParentApp: Boolean = false
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
    val etaMinutes: Int = 4
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
data class ClassroomInfo(
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
    val zoneName: String
)

@Serializable
data class StudentSyncDto(
    val id: String,
    val firstName: String,
    val lastName: String,
    val initials: String,
    val groupId: String,
    val status: String = "activo",
    val guardianName: String = ""
)

@Serializable
data class SchoolSyncRequest(
    val schoolName: String = "Colegio San Ignacio",
    val screens: List<ScreenDto> = emptyList(),
    val groups: List<GroupDto> = emptyList(),
    val students: List<StudentSyncDto> = emptyList()
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
