package com.recogeaya.server

import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

object SchoolRoster {
    private val mutex = Mutex()
    private var schoolName: String = "Escuela"
    private var screens: List<ScreenDto> = emptyList()
    private var groups: List<GroupDto> = emptyList()
    private var students: List<StudentSyncDto> = emptyList()
    private var guardians: List<GuardianSyncDto> = emptyList()

    suspend fun defaultScreenId(): String = mutex.withLock {
        screens.firstOrNull()?.id.orEmpty()
    }

    suspend fun replace(request: SchoolSyncRequest, persist: Boolean = true) = mutex.withLock {
        schoolName = request.schoolName.ifBlank { schoolName }
        screens = request.screens
        groups = request.groups
        students = request.students
        guardians = request.guardians
        if (persist) {
            RecogeYaDb.put("roster", RecogeYaDb.json.encodeToString(SchoolSyncRequest.serializer(), request))
        }
    }

    suspend fun restore() {
        val raw = RecogeYaDb.get("roster") ?: return
        val request = runCatching {
            RecogeYaDb.json.decodeFromString(SchoolSyncRequest.serializer(), raw)
        }.getOrNull() ?: return
        replace(request, persist = false)
    }

    suspend fun hasRoster(): Boolean = mutex.withLock { students.isNotEmpty() }

    suspend fun screenById(id: String?): ScreenDto? = mutex.withLock {
        val key = id?.ifBlank { null }
        if (key != null) screens.find { it.id == key } else screens.firstOrNull()
    }

    suspend fun screenByCode(code: String): ScreenDto? = mutex.withLock {
        val needle = normalizeCode(code)
        screens.find { normalizeCode(it.pairingCode) == needle }
    }

    private fun normalizeCode(code: String) = code.trim().uppercase().replace("-", "").replace(" ", "")

    suspend fun screensForPicker(): List<ScreenPickDto> = mutex.withLock {
        screens
            .map { screen ->
                val group = groups.find { it.id == screen.groupId }
                ScreenPickDto(
                    id = screen.id,
                    name = screen.name,
                    pairingCode = screen.pairingCode,
                    groupLabel = group?.let { "${it.grade} • Grupo ${it.letter}" } ?: "${screen.name} (sin grupo)",
                    classroom = group?.classroom ?: screen.location.replace("Salón ", "")
                )
            }
            .sortedBy { it.groupLabel }
    }

    suspend fun classroomFor(screen: ScreenDto?): ClassroomInfo = mutex.withLock {
        val group = groups.find { it.id == screen?.groupId }
        val enrolled = students.count { it.groupId == group?.id && it.status != "inactivo" }
        val teacher = group?.teacherName?.ifBlank { null }
        ClassroomInfo(
            school = schoolName,
            grade = group?.let { "${it.grade} • Grupo ${it.letter}" } ?: "Sin grupo",
            teacher = when {
                teacher == null -> "Sin profesor"
                teacher.startsWith("Prof") -> teacher
                else -> "Prof. $teacher"
            },
            classroom = group?.classroom?.let { "Salón $it" } ?: "Sin salón",
            zone = group?.zoneName?.ifBlank { "Sin zona" } ?: "Sin zona",
            totalStudents = enrolled,
            screenId = screen?.id.orEmpty(),
            groupId = group?.id.orEmpty(),
            pairingCode = screen?.pairingCode.orEmpty(),
            dismissalTime = group?.dismissalTime.orEmpty()
        )
    }

    suspend fun rosterFor(groupId: String): List<RosterStudent> = mutex.withLock {
        if (groupId.isBlank()) return@withLock emptyList()
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

    suspend fun groupForStudent(studentId: String): GroupDto? = mutex.withLock {
        val student = students.find { it.id == studentId } ?: return@withLock null
        groups.find { it.id == student.groupId }
    }

    suspend fun parentStateMeta(childIds: List<String>): Triple<String, String, Pair<Double, Double>?> = mutex.withLock {
        val first = childIds.firstNotNullOfOrNull { id ->
            val student = students.find { it.id == id } ?: return@firstNotNullOfOrNull null
            groups.find { it.id == student.groupId }
        }
        val coords = if (first?.zoneLat != null && first.zoneLng != null) {
            first.zoneLat to first.zoneLng
        } else {
            null
        }
        Triple(first?.zoneName.orEmpty(), first?.zonePhone.orEmpty(), coords)
    }

    suspend fun login(email: String, password: String): ParentLoginResponse = mutex.withLock {
        val mail = email.trim()
        val pass = password.trim()
        if (mail.isBlank() || pass.isBlank()) {
            return@withLock ParentLoginResponse(ok = false, error = "Escribe correo y contraseña.")
        }
        val guardian = guardians.find {
            it.email.equals(mail, ignoreCase = true) && it.password == pass && it.password.isNotBlank()
        } ?: return@withLock ParentLoginResponse(
            ok = false,
            error = "Correo o contraseña incorrectos. Usa los datos que te envió la escuela."
        )
        val kids = students.filter { student ->
            student.status != "inactivo" && guardian.id in student.guardianIds
        }
        val childDtos = kids.map { student ->
            val group = groups.find { it.id == student.groupId }
            ParentChildDto(
                id = student.id,
                firstName = student.firstName,
                lastName = student.lastName,
                grade = group?.grade.orEmpty(),
                group = group?.letter.orEmpty(),
                teacher = group?.teacherName.orEmpty(),
                classroom = group?.classroom.orEmpty(),
                schoolId = "school",
                schoolName = schoolName,
                zone = group?.zoneName.orEmpty(),
                zonePhone = group?.zonePhone.orEmpty(),
                zoneLat = group?.zoneLat,
                zoneLng = group?.zoneLng,
                dismissalTime = group?.dismissalTime.orEmpty()
            )
        }
        val relatedIds = kids.flatMap { it.guardianIds }.toSet()
        val people = guardians.filter { it.id in relatedIds }.map { person ->
            val parts = person.name.trim().split(" ").filter { it.isNotBlank() }
            val initials = buildString {
                if (parts.isNotEmpty()) append(parts.first().first().uppercaseChar())
                if (parts.size > 1) append(parts.last().first().uppercaseChar())
            }
            ParentPersonDto(
                id = person.id,
                name = person.name,
                initials = initials.ifBlank { "R" },
                relation = person.relation,
                kind = person.kind
            )
        }
        val zone = childDtos.firstOrNull()?.zone.orEmpty()
        val phone = childDtos.firstOrNull()?.zonePhone.orEmpty()
        val nameParts = guardian.name.trim().split(" ").filter { it.isNotBlank() }
        val initials = buildString {
            if (nameParts.isNotEmpty()) append(nameParts.first().first().uppercaseChar())
            if (nameParts.size > 1) append(nameParts.last().first().uppercaseChar())
        }
        ParentLoginResponse(
            ok = true,
            profileName = guardian.name,
            profileInitials = initials.ifBlank { "R" },
            email = guardian.email,
            schoolName = schoolName,
            pickupZone = zone,
            receptionPhone = phone,
            children = childDtos,
            people = people
        )
    }
}
