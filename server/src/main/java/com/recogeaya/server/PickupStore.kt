package com.recogeaya.server

import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import java.time.Instant

object PickupStore {
    private val mutex = Mutex()
    private val pickups = linkedMapOf<String, PickupEntry>()
    private val history = ArrayDeque<PickupEvent>()

    suspend fun dashboard(screenId: String?): DashboardState {
        val screen = SchoolRoster.screenById(screenId)
        val classroom = SchoolRoster.classroomFor(screen)
        val roster = SchoolRoster.rosterFor(classroom.groupId)
        val rosterIds = roster.map { it.id }.toSet()
        val rows = mutex.withLock { pickups.values.filterNot { it.collected }.toList() }
        val visible = if (rosterIds.isNotEmpty()) {
            rows.filter { it.childId in rosterIds }
        } else {
            emptyList()
        }
        val open = PickupWindow.isOpen(classroom.dismissalTime)
        return DashboardState(
            classroom = classroom.copy(totalStudents = roster.size),
            pickups = if (open) visible else emptyList(),
            roster = roster,
            pickupOpen = open,
            clock = PickupWindow.clock(),
            clockDate = PickupWindow.dateLabel()
        )
    }

    suspend fun forChildren(childIds: List<String>): List<PickupEntry> = mutex.withLock {
        val wanted = childIds.toSet()
        pickups.values.filter { it.childId in wanted }
    }

    suspend fun history(): List<PickupEvent> = mutex.withLock { history.toList() }

    suspend fun notifyPickup(request: NotifyPickupRequest): List<PickupEntry> {
        val zones = request.children.associate { child ->
            child.id to (SchoolRoster.groupForStudent(child.id)?.zoneName.orEmpty())
        }
        return mutex.withLock {
            request.children.forEach { child ->
                val existing = pickups[child.id]
                val zone = zones[child.id].orEmpty()
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
                    fromParentApp = true,
                    verificationCode = request.verificationCode,
                    zone = zone
                )
                pushHistory(
                    childName = "${child.firstName} ${child.lastName}".trim(),
                    groupLabel = listOf(child.grade, child.group).filter { it.isNotBlank() }.joinToString(" • "),
                    zone = zone,
                    responsibleName = request.responsibleName,
                    event = "AVISO"
                )
            }
            persistLocked()
            pickups.values.toList()
        }
    }

    suspend fun restore() {
        val raw = RecogeYaDb.get("pickups") ?: return
        val snapshot = runCatching {
            RecogeYaDb.json.decodeFromString(PickupSnapshot.serializer(), raw)
        }.getOrNull() ?: return
        mutex.withLock {
            pickups.clear()
            snapshot.pickups.forEach { pickups[it.childId] = it }
            history.clear()
            snapshot.history.forEach { history.addLast(it) }
        }
    }

    private fun persistLocked() {
        RecogeYaDb.put(
            "pickups",
            RecogeYaDb.json.encodeToString(
                PickupSnapshot.serializer(),
                PickupSnapshot(pickups = pickups.values.toList(), history = history.toList())
            )
        )
    }

    suspend fun setAction(childId: String, action: String): PickupEntry? = mutex.withLock {
        val current = pickups[childId] ?: return@withLock null
        val normalized = action.trim().uppercase()
        pickups[childId] = current.copy(action = normalized)
        pushHistory(
            childName = current.fullName,
            groupLabel = listOf(current.grade, current.group).filter { it.isNotBlank() }.joinToString(" • "),
            zone = current.zone,
            responsibleName = current.responsibleName,
            event = normalized
        )
        persistLocked()
        pickups[childId]
    }

    suspend fun setArrived(childId: String, arrived: Boolean, etaMinutes: Int): PickupEntry? = mutex.withLock {
        val current = pickups[childId] ?: return@withLock null
        pickups[childId] = current.copy(
            arrived = arrived,
            etaMinutes = etaMinutes
        )
        pushHistory(
            childName = current.fullName,
            groupLabel = listOf(current.grade, current.group).filter { it.isNotBlank() }.joinToString(" • "),
            zone = current.zone,
            responsibleName = current.responsibleName,
            event = if (arrived) "LLEGADA" else "EN CAMINO"
        )
        persistLocked()
        pickups[childId]
    }

    suspend fun collect(childId: String) = mutex.withLock {
        val current = pickups.remove(childId) ?: return@withLock
        pushHistory(
            childName = current.fullName,
            groupLabel = listOf(current.grade, current.group).filter { it.isNotBlank() }.joinToString(" • "),
            zone = current.zone,
            responsibleName = current.responsibleName,
            event = "RECOGIDO"
        )
        persistLocked()
    }

    suspend fun cancel(childId: String) = mutex.withLock {
        val current = pickups.remove(childId) ?: return@withLock
        pushHistory(
            childName = current.fullName,
            groupLabel = listOf(current.grade, current.group).filter { it.isNotBlank() }.joinToString(" • "),
            zone = current.zone,
            responsibleName = current.responsibleName,
            event = "CANCELADO"
        )
        persistLocked()
    }

    suspend fun updateLocation(request: LocationUpdateRequest) {
        val destinations = request.childIds.associateWith { id ->
            val group = SchoolRoster.groupForStudent(id)
            val lat = group?.zoneLat
            val lng = group?.zoneLng
            if (lat != null && lng != null) lat to lng else null
        }
        mutex.withLock {
            request.childIds.forEach { id ->
                val current = pickups[id] ?: return@forEach
                if (current.collected) return@forEach
                if (current.arrived) {
                    pickups[id] = current.copy(
                        latitude = request.latitude,
                        longitude = request.longitude,
                        etaMinutes = 0
                    )
                    return@forEach
                }
                val dest = destinations[id]
                val eta = if (dest != null) {
                    val meters = Geo.distanceMeters(
                        request.latitude,
                        request.longitude,
                        dest.first,
                        dest.second
                    )
                    Geo.etaMinutes(meters)
                } else {
                    request.etaMinutes ?: current.etaMinutes
                }
                pickups[id] = current.copy(
                    etaMinutes = eta,
                    latitude = request.latitude,
                    longitude = request.longitude
                )
            }
            persistLocked()
        }
    }

    private fun pushHistory(
        childName: String,
        groupLabel: String,
        zone: String,
        responsibleName: String,
        event: String
    ) {
        history.addFirst(
            PickupEvent(
                id = "evt-${System.currentTimeMillis()}-${history.size}",
                at = Instant.now().toString(),
                childName = childName,
                groupLabel = groupLabel,
                zone = zone,
                responsibleName = responsibleName,
                event = event
            )
        )
        while (history.size > 200) history.removeLast()
    }
}
