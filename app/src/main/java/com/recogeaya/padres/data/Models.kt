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
    val availability: ChildAvailability = ChildAvailability.ACTIVO
) {
    val fullName: String get() = "$firstName $lastName"
    val initials: String get() = "${firstName.first()}${lastName.first()}"
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

object SampleData {
    const val demoPassword = "CSI-4821"

    val schools = listOf(
        School("csi", "Colegio San Ignacio", "San Ignacio"),
        School("ism", "Instituto Santa María", "Santa María")
    )

    val accounts = listOf(
        ParentAccount(
            email = "maria.gomez@gmail.com",
            password = demoPassword,
            profile = ParentProfile(name = "María Gómez López", initials = "MG"),
        ),
        ParentAccount(
            email = "jorge.gomez@gmail.com",
            password = demoPassword,
            profile = ParentProfile(name = "Jorge Gómez Ramírez", initials = "JG"),
        ),
        ParentAccount(
            email = "laura.martinez@gmail.com",
            password = demoPassword,
            profile = ParentProfile(name = "Laura Martínez", initials = "LM"),
        ),
        ParentAccount(
            email = "sofia.martinez@email.com",
            password = demoPassword,
            profile = ParentProfile(name = "Sofía Martínez", initials = "SM"),
        ),
    )

    val account get() = accounts.first()

    fun accountFor(email: String, password: String): ParentAccount? {
        val mail = email.trim()
        val pass = password.trim()
        return accounts.find { it.email.equals(mail, ignoreCase = true) && it.password == pass }
    }

    val children = listOf(
        Child(
            id = "lucas",
            firstName = "Lucas",
            lastName = "Gómez",
            grade = "2º Primaria",
            group = "Grupo A",
            teacher = "Ana Martínez",
            classroom = "A-12",
            schoolId = "csi"
        ),
        Child(
            id = "daniela",
            firstName = "Daniela",
            lastName = "Gómez",
            grade = "5º Primaria",
            group = "Grupo C",
            teacher = "Ricardo López",
            classroom = "C-05",
            schoolId = "csi"
        ),
        Child(
            id = "valentina",
            firstName = "Valentina",
            lastName = "Gómez",
            grade = "Kinder A",
            group = "",
            teacher = "Marta Ríos",
            classroom = "K-01",
            schoolId = "ism"
        )
    )

    val authorizedPeople = listOf(
        ResponsiblePerson(
            id = "sofia",
            name = "Sofía Martínez",
            initials = "SM",
            relation = "Madre principal",
            kind = ResponsibleKind.PRIMARY,
            authorizedLabel = "SELECCIONADA"
        ),
        ResponsiblePerson(
            id = "carlos",
            name = "Carlos Gómez",
            initials = "CG",
            relation = "Padre",
            kind = ResponsibleKind.AUTHORIZED,
            authorizedLabel = "AUTORIZADO"
        ),
        ResponsiblePerson(
            id = "laura",
            name = "Laura Martínez",
            initials = "LM",
            relation = "Abuela",
            kind = ResponsibleKind.AUTHORIZED,
            authorizedLabel = "AUTORIZADA"
        )
    )

    val activities = listOf(
        PickupActivityItem(
            id = "a1",
            title = "Entrega exitosa",
            description = "Lucas Gómez fue recogido por Sofía Martínez",
            timestamp = "Ayer, 13:52"
        ),
        PickupActivityItem(
            id = "a2",
            title = "Entrega exitosa",
            description = "Daniela Gómez fue recogida por Sofía Martínez",
            timestamp = "Ayer, 13:48"
        ),
        PickupActivityItem(
            id = "a3",
            title = "Entrega exitosa",
            description = "Valentina Gómez fue recogida por Sofía Martínez",
            timestamp = "Lunes, 13:10"
        )
    )

    const val receptionPhone = "5550000000"
    const val pickupZone = "Zona A"

    fun schoolById(id: String): School =
        schools.first { it.id == id }

    fun childrenGroupedBySchool(): List<Pair<School, List<Child>>> =
        schools.mapNotNull { school ->
            val kids = children.filter { it.schoolId == school.id }
            if (kids.isEmpty()) null else school to kids
        }
}
