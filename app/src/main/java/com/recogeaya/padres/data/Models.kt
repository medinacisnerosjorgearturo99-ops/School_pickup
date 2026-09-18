package com.recogeaya.padres.data

enum class ChildAvailability {
    ACTIVO,
    DISPONIBLE
}

enum class PickupStep {
    AVISADO,
    PREPARANDO,
    LISTO
}

enum class ResponsibleKind {
    PRIMARY,
    AUTHORIZED,
    TEMPORARY
}

data class School(
    val id: String,
    val name: String,
    val shortName: String
)

data class ParentAccount(
    val email: String,
    val password: String,
    val profile: ParentProfile
)

data class ParentProfile(
    val name: String,
    val initials: String
)

data class Child(
    val id: String,
    val firstName: String,
    val lastName: String,
    val grade: String,
    val group: String,
    val teacher: String,
    val classroom: String,
    val schoolId: String,
    val zoneLat: Double? = null,
    val zoneLng: Double? = null,
    val availability: ChildAvailability = ChildAvailability.ACTIVO
) {
    val fullName: String get() = "$firstName $lastName".trim()
    val initials: String get() = "${firstName.firstOrNull() ?: '?'}${lastName.firstOrNull() ?: '?'}"
    val gradeGroup: String
        get() = if (group.isBlank()) grade else "$grade • $group"
}

data class ResponsiblePerson(
    val id: String,
    val name: String,
    val initials: String,
    val relation: String,
    val kind: ResponsibleKind,
    val authorizedLabel: String = "AUTORIZADO"
) {
    val isTemporary: Boolean get() = kind == ResponsibleKind.TEMPORARY
    val isPrimary: Boolean get() = kind == ResponsibleKind.PRIMARY
}

data class ChildPickupProgress(
    val childId: String,
    val step: PickupStep,
    val zone: String? = null,
    val parentEtaMinutes: Int? = null,
    val readyEtaMinutes: Int? = null
)

data class PickupActivityItem(
    val id: String,
    val title: String,
    val description: String,
    val timestamp: String
)

/** Catálogo vacío: llena cuentas, hijos y responsables cuando la escuela los emita. */
object SampleData {
    val schools = emptyList<School>()
    val accounts = emptyList<ParentAccount>()
    val children = emptyList<Child>()
    val authorizedPeople = emptyList<ResponsiblePerson>()
    val activities = emptyList<PickupActivityItem>()

    val account: ParentAccount
        get() = ParentAccount(
            email = "",
            password = "",
            profile = ParentProfile(name = "Responsable", initials = "R")
        )

    fun accountFor(email: String, password: String): ParentAccount? {
        val mail = email.trim()
        val pass = password.trim()
        if (mail.isBlank() || pass.isBlank()) return null
        return accounts.find { it.email.equals(mail, ignoreCase = true) && it.password == pass }
    }

    const val receptionPhone = ""
    const val pickupZone = ""

    fun schoolById(id: String): School? =
        schools.find { it.id == id }

    fun childrenGroupedBySchool(): List<Pair<School, List<Child>>> =
        schools.mapNotNull { school ->
            val kids = children.filter { it.schoolId == school.id }
            if (kids.isEmpty()) null else school to kids
        }
}
