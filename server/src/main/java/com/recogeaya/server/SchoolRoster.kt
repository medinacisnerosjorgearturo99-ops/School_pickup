package com.recogeaya.server

import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

object SchoolRoster {
    private val mutex = Mutex()
    private var schoolName: String = "Colegio San Ignacio"
    private var screens: List<ScreenDto> = emptyList()
    private var groups: List<GroupDto> = emptyList()
    private var students: List<StudentSyncDto> = emptyList()

    val defaultScreenId: String = "scr-ciclo-2026-2-a"

    private val bundledGroups = listOf(
        GroupDto("ciclo-2026-k-a", "Kinder", "A", "K-01", "Laura Pérez", "Zona A"),
        GroupDto("ciclo-2026-k-b", "Kinder", "B", "K-03", "Sofía Ruiz", "Zona A"),
        GroupDto("ciclo-2026-1-a", "1º Primaria", "A", "A-01", "Diego Soto", "Zona A"),
        GroupDto("ciclo-2026-1-b", "1º Primaria", "B", "A-02", "Paola Méndez", "Zona A"),
        GroupDto("ciclo-2026-1-c", "1º Primaria", "C", "A-03", "Lucía Vargas", "Zona A"),
        GroupDto("ciclo-2026-2-a", "2º Primaria", "A", "A-12", "Ana Martínez", "Zona A"),
        GroupDto("ciclo-2026-2-b", "2º Primaria", "B", "A-13", "Miguel Torres", "Zona A"),
        GroupDto("ciclo-2026-2-c", "2º Primaria", "C", "A-14", "Andrés Peña", "Zona A"),
        GroupDto("ciclo-2026-3-a", "3º Primaria", "A", "B-01", "Elena Cruz", "Zona B"),
        GroupDto("ciclo-2026-3-b", "3º Primaria", "B", "B-02", "Jorge Díaz", "Zona B"),
        GroupDto("ciclo-2026-4-a", "4º Primaria", "A", "B-11", "Carmen Ortiz", "Zona B"),
        GroupDto("ciclo-2026-4-b", "4º Primaria", "B", "B-12", "Iván León", "Zona B"),
        GroupDto("ciclo-2026-5-a", "5º Primaria", "A", "C-01", "Raúl Pineda", "Zona C"),
        GroupDto("ciclo-2026-5-b", "5º Primaria", "B", "C-02", "Marina Solís", "Zona C"),
        GroupDto("ciclo-2026-5-c", "5º Primaria", "C", "C-05", "Ricardo López", "Zona C"),
        GroupDto("ciclo-2026-6-a", "6º Primaria", "A", "C-11", "Pablo Reyes", "Zona C"),
        GroupDto("ciclo-2026-6-b", "6º Primaria", "B", "C-12", "Adriana Mora", "Zona C"),
        GroupDto("ciclo-2026-6-c", "6º Primaria", "C", "C-13", "Sergio Núñez", "Zona C"),
    )

    private val bundledScreens = bundledGroups.map { group ->
        ScreenDto(
            id = "scr-${group.id}",
            name = "Pantalla ${group.classroom}",
            location = "Salón ${group.classroom}",
            groupId = group.id,
            pairingCode = "CSI-${group.classroom.replace("-", "")}",
            online = true
        )
    }

    private fun activeScreens() = screens.ifEmpty { bundledScreens }
    private fun activeGroups() = groups.ifEmpty { bundledGroups }

    suspend fun replace(request: SchoolSyncRequest) = mutex.withLock {
        schoolName = request.schoolName.ifBlank { schoolName }
        screens = request.screens
        groups = request.groups
        students = request.students
    }

    suspend fun hasRoster(): Boolean = mutex.withLock { students.isNotEmpty() }

    suspend fun screenById(id: String?): ScreenDto? = mutex.withLock {
        val key = id?.ifBlank { null } ?: defaultScreenId
        val pool = activeScreens()
        pool.find { it.id == key }
            ?: pool.find { it.groupId?.endsWith("-2-a") == true }
            ?: pool.firstOrNull()
    }

    suspend fun screenByCode(code: String): ScreenDto? = mutex.withLock {
        val needle = normalizeCode(code)
        val pool = activeScreens()
        pool.find { normalizeCode(it.pairingCode) == needle }
            ?: pool.find { normalizeCode(it.pairingCode) == needle.replace('1', 'I') }
    }

    private fun normalizeCode(code: String) = code.trim().uppercase().replace("-", "").replace(" ", "")

    suspend fun screensForPicker(): List<ScreenPickDto> = mutex.withLock {
        val groupPool = activeGroups()
        activeScreens()
            .filter { it.groupId != null }
            .map { screen ->
                val group = groupPool.find { it.id == screen.groupId }
                ScreenPickDto(
                    id = screen.id,
                    name = screen.name,
                    pairingCode = screen.pairingCode,
                    groupLabel = group?.let { "${it.grade} • Grupo ${it.letter}" } ?: screen.name,
                    classroom = group?.classroom ?: screen.location.replace("Salón ", "")
                )
            }
            .sortedWith(
                compareBy<ScreenPickDto> { if (it.id.contains("-2-a")) 0 else 1 }
                    .thenBy { it.groupLabel }
            )
    }

    suspend fun classroomFor(screen: ScreenDto?): ClassroomInfo = mutex.withLock {
        val group = activeGroups().find { it.id == screen?.groupId }
        val enrolled = students.count { it.groupId == group?.id && it.status != "inactivo" }
        ClassroomInfo(
            school = schoolName,
            grade = group?.let { "${it.grade} • Grupo ${it.letter}" } ?: "2º Primaria • Grupo A",
            teacher = group?.teacherName?.ifBlank { "Sin profesor" }?.let { if (it.startsWith("Prof") || it == "Sin profesor") it else "Prof. $it" }
                ?: "Prof. Ana Martínez",
            classroom = group?.classroom?.let { "Salón $it" } ?: "Salón A-12",
            zone = group?.zoneName?.ifBlank { "Zona A" } ?: "Zona A",
            totalStudents = if (enrolled > 0) enrolled else 26,
            screenId = screen?.id ?: defaultScreenId,
            groupId = group?.id ?: "ciclo-2026-2-a",
            pairingCode = screen?.pairingCode ?: "CSI-A12"
        )
    }

    suspend fun rosterFor(groupId: String): List<RosterStudent> = mutex.withLock {
        students
            .filter { it.groupId == groupId && it.status != "inactivo" }
            .map {
                RosterStudent(
                    id = it.id,
                    firstName = it.firstName,
                    lastName = it.lastName,
                    initials = it.initials,
                    status = it.status
                )
            }
    }

    suspend fun rosterIds(groupId: String): Set<String> = mutex.withLock {
        students.filter { it.groupId == groupId }.map { it.id }.toSet()
    }
}
