package com.recogeaya.server

import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

object PickupStore {
    private val mutex = Mutex()
    private val pickups = linkedMapOf<String, PickupEntry>()

    suspend fun dashboard(screenId: String?): DashboardState {
        val screen = SchoolRoster.screenById(screenId)
        val classroom = SchoolRoster.classroomFor(screen)
        val roster = SchoolRoster.rosterFor(classroom.groupId)
        val rosterIds = roster.map { it.id }.toSet()
        val rows = mutex.withLock {
            if (pickups.isEmpty()) seedLocked()
            pickups.values.toList()
        }
        val visible = if (rosterIds.isNotEmpty()) {
            rows.filter { it.childId in rosterIds }
        } else if (classroom.groupId.endsWith("-2-a")) {
            rows.filter { it.grade.contains("2º") && it.group.contains("A") && it.childId != "daniela" }
        } else {
            emptyList()
        }
        return DashboardState(
            classroom = classroom.copy(totalStudents = if (roster.isNotEmpty()) roster.size else classroom.totalStudents),
            pickups = visible,
            roster = roster
        )
    }

    suspend fun snapshot(): List<PickupEntry> = dashboard(null).pickups

    suspend fun notifyPickup(request: NotifyPickupRequest): List<PickupEntry> = mutex.withLock {
        if (pickups.isEmpty()) seedLocked()
        request.children.forEach { child ->
            val existing = pickups[child.id]
            pickups[child.id] = PickupEntry(
                childId = child.id,
                firstName = child.firstName,
                lastName = child.lastName,
                initials = child.initials,
                grade = child.grade,
                group = child.group,
                teacher = child.teacher,
                classroom = child.classroom,
                responsibleName = request.responsibleName,
                etaMinutes = request.etaMinutes,
                arrived = false,
                action = existing?.action ?: TeacherAction.PREPARAR.name,
                fromParentApp = true
            )
        }
        pickups.values.toList()
    }

    suspend fun setAction(childId: String, action: String): PickupEntry? = mutex.withLock {
        val current = pickups[childId] ?: return@withLock null
        pickups[childId] = current.copy(action = action)
        pickups[childId]
    }

    suspend fun setArrived(childId: String, arrived: Boolean, etaMinutes: Int): PickupEntry? = mutex.withLock {
        val current = pickups[childId] ?: return@withLock null
        pickups[childId] = current.copy(arrived = arrived, etaMinutes = etaMinutes)
        pickups[childId]
    }

    suspend fun cancel(childId: String) = mutex.withLock {
        val current = pickups[childId] ?: return@withLock
        if (current.fromParentApp && childId in seededIds) {
            seedOneLocked(childId)
            return@withLock
        }
        if (current.fromParentApp) {
            pickups.remove(childId)
        } else if (childId in seededIds) {
            seedOneLocked(childId)
        }
    }

    private val seededIds = setOf("lucas", "camila")

    private fun seedLocked() {
        listOf(
            PickupEntry("lucas", "Lucas", "Gómez", "LG", "2º Primaria", "Grupo A", "Ana Martínez", "A-12", "María Gómez López", 3, false, TeacherAction.PREPARANDO.name),
            PickupEntry("camila", "Camila", "Torres", "CT", "2º Primaria", "Grupo A", "Ana Martínez", "A-12", "Gabriela Torres", 0, true, TeacherAction.LISTO.name),
        ).forEach { pickups[it.childId] = it }
    }

    private fun seedOneLocked(id: String) {
        val defaults = mapOf(
            "lucas" to PickupEntry("lucas", "Lucas", "Gómez", "LG", "2º Primaria", "Grupo A", "Ana Martínez", "A-12", "María Gómez López", 3, false, TeacherAction.PREPARANDO.name),
            "camila" to PickupEntry("camila", "Camila", "Torres", "CT", "2º Primaria", "Grupo A", "Ana Martínez", "A-12", "Gabriela Torres", 0, true, TeacherAction.LISTO.name),
        )
        defaults[id]?.let { pickups[id] = it }
    }
}
