package com.recogeaya.padres.ui

import android.Manifest
import android.app.Application
import android.content.Intent
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.recogeaya.padres.data.Child
import com.recogeaya.padres.data.ChildPickupProgress
import com.recogeaya.padres.data.PickupActivityItem
import com.recogeaya.padres.data.PickupStep
import com.recogeaya.padres.data.ResponsibleKind
import com.recogeaya.padres.data.ResponsiblePerson
import com.recogeaya.padres.data.ParentAccount
import com.recogeaya.padres.data.ParentProfile
import com.recogeaya.padres.data.School
import com.recogeaya.padres.location.LocationShare
import com.recogeaya.padres.location.PickupLocationService
import com.recogeaya.padres.sync.RecogeYaApi
import com.recogeaya.padres.sync.toSession
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class ParentUiState(
    val loggedIn: Boolean = false,
    val loginError: String? = null,
    val session: ParentAccount? = null,
    val children: List<Child> = emptyList(),
    val people: List<ResponsiblePerson> = emptyList(),
    val activities: List<PickupActivityItem> = emptyList(),
    val school: School? = null,
    val pickupZone: String = "",
    val receptionPhone: String = "",
    val selectedIds: Set<String> = emptySet(),
    val pickupActive: Boolean = false,
    val progress: List<ChildPickupProgress> = emptyList(),
    val selectedResponsibleId: String = "",
    val draftResponsibleId: String = "",
    val extraResponsibles: List<ResponsiblePerson> = emptyList(),
    val verificationCode: String = "",
    val tvConnected: Boolean = false,
    val shareLocation: Boolean = true,
    val locationSharing: Boolean = false,
    val distanceMeters: Int? = null,
    val locationEtaMinutes: Int? = null
)

class ParentPickupViewModel(application: Application) : AndroidViewModel(application) {
    val parent: ParentProfile
        get() = _ui.value.session?.profile ?: ParentProfile(name = "Responsable", initials = "R")
    val children: List<Child>
        get() = _ui.value.children
    val activities: List<PickupActivityItem>
        get() = _ui.value.activities

    private val _ui = MutableStateFlow(ParentUiState())
    val ui: StateFlow<ParentUiState> = _ui.asStateFlow()
    private var syncJob: Job? = null
    private val clock = SimpleDateFormat("HH:mm", Locale.getDefault())

    init {
        viewModelScope.launch {
            LocationShare.lastFix.collect { fix ->
                if (!_ui.value.pickupActive) return@collect
                _ui.update { state ->
                    state.copy(
                        locationSharing = fix?.sharing == true,
                        distanceMeters = fix?.distanceMeters,
                        locationEtaMinutes = fix?.etaMinutes
                    )
                }
            }
        }
    }

    fun childrenBySchool(): List<Pair<School, List<Child>>> {
        val school = _ui.value.school ?: return emptyList()
        val kids = _ui.value.children
        return if (kids.isEmpty()) emptyList() else listOf(school to kids)
    }

    fun allResponsibles(): List<ResponsiblePerson> =
        _ui.value.people + _ui.value.extraResponsibles

    fun currentResponsible(): ResponsiblePerson =
        allResponsibles().firstOrNull { it.id == _ui.value.selectedResponsibleId }
            ?: allResponsibles().firstOrNull()
            ?: ResponsiblePerson(
                id = "",
                name = parent.name,
                initials = parent.initials,
                relation = "Responsable",
                kind = ResponsibleKind.PRIMARY,
                authorizedLabel = "SELECCIONADA"
            )

    fun draftResponsible(): ResponsiblePerson =
        allResponsibles().firstOrNull { it.id == _ui.value.draftResponsibleId }
            ?: currentResponsible()

    fun selectedChildren(): List<Child> =
        children.filter { it.id in _ui.value.selectedIds }

    fun pickupZone(): String =
        _ui.value.progress.mapNotNull { it.zone }.firstOrNull { it.isNotBlank() }
            ?: _ui.value.pickupZone

    fun setShareLocation(enabled: Boolean) {
        _ui.update { it.copy(shareLocation = enabled) }
    }

    fun login(email: String, password: String) {
        viewModelScope.launch {
            val result = withContext(Dispatchers.IO) {
                runCatching { RecogeYaApi.login(email, password) }.getOrNull()
            }
            if (result == null) {
                _ui.update {
                    it.copy(loginError = "No se pudo conectar con la escuela. Revisa que el servidor esté encendido.")
                }
                return@launch
            }
            if (!result.ok) {
                _ui.update { it.copy(loginError = result.error ?: "Correo o contraseña incorrectos.") }
                return@launch
            }
            val session = result.toSession()
            _ui.update {
                it.copy(
                    loggedIn = true,
                    loginError = null,
                    session = session.account,
                    children = session.children,
                    people = session.people,
                    school = session.school,
                    pickupZone = session.pickupZone,
                    receptionPhone = session.receptionPhone,
                    selectedResponsibleId = session.people.firstOrNull { person -> person.kind == ResponsibleKind.PRIMARY }?.id
                        ?: session.people.firstOrNull()?.id.orEmpty()
                )
            }
        }
    }

    fun logout() {
        stopSharing()
        syncJob?.cancel()
        _ui.value = ParentUiState()
    }

    fun toggleChild(id: String) {
        _ui.update { state ->
            val next = state.selectedIds.toMutableSet()
            if (id in next) next.remove(id) else next.add(id)
            state.copy(selectedIds = next)
        }
    }

    fun beginEditResponsible() {
        _ui.update { it.copy(draftResponsibleId = it.selectedResponsibleId) }
    }

    fun selectDraftResponsible(id: String) {
        _ui.update { it.copy(draftResponsibleId = id) }
    }

    fun saveResponsible() {
        _ui.update { it.copy(selectedResponsibleId = it.draftResponsibleId) }
    }

    fun addTemporaryResponsible(name: String, relation: String) {
        val trimmed = name.trim()
        if (trimmed.isBlank()) return
        val parts = trimmed.split(" ").filter { it.isNotBlank() }
        val initials = buildString {
            append(parts.first().first().uppercaseChar())
            if (parts.size > 1) append(parts.last().first().uppercaseChar())
        }
        val person = ResponsiblePerson(
            id = "temp-${trimmed.lowercase().replace(" ", "-")}",
            name = trimmed,
            initials = initials,
            relation = relation.trim().ifBlank { "Responsable temporal" },
            kind = ResponsibleKind.TEMPORARY,
            authorizedLabel = "TEMPORAL"
        )
        _ui.update { state ->
            val withoutSame = state.extraResponsibles.filterNot { it.id == person.id }
            state.copy(
                extraResponsibles = withoutSame + person,
                draftResponsibleId = person.id
            )
        }
    }

    fun shareMessage(): String {
        val kids = selectedChildren().joinToString(", ") { it.fullName }
        val person = currentResponsible()
        return buildString {
            appendLine("RecogeYa — entrega temporal")
            appendLine("Alumno(s): $kids")
            appendLine("Responsable: ${person.name} (${person.relation})")
            appendLine("Código: ${_ui.value.verificationCode}")
            appendLine("Muéstralo en la escuela. No necesitas instalar la app.")
            append("Válido para esta salida.")
        }
    }

    fun startPickup(shareIfPossible: Boolean = false) {
        val selected = selectedChildren()
        if (selected.isEmpty()) return
        val responsible = currentResponsible()
        val code = (1000..9999).random().toString()
        val zone = _ui.value.pickupZone.ifBlank { null }
        val sharing = _ui.value.shareLocation && shareIfPossible && hasLocationPermission()
        _ui.update { state ->
            state.copy(
                pickupActive = true,
                verificationCode = code,
                locationSharing = sharing,
                distanceMeters = null,
                locationEtaMinutes = null,
                progress = selected.map { child ->
                    ChildPickupProgress(
                        childId = child.id,
                        step = PickupStep.AVISADO,
                        zone = zone,
                        readyEtaMinutes = null
                    )
                },
                activities = listOf(
                    PickupActivityItem(
                        id = "act-$code",
                        title = "Aviso enviado",
                        description = selected.joinToString(", ") { it.fullName },
                        timestamp = clock.format(Date())
                    )
                ) + state.activities
            )
        }
        viewModelScope.launch(Dispatchers.IO) {
            runCatching {
                RecogeYaApi.notifyPickup(selected, responsible.name, code)
            }
        }
        if (sharing) startSharing() else stopSharing()
        startSync()
    }

    fun markArrived() {
        val ids = _ui.value.selectedIds
        viewModelScope.launch(Dispatchers.IO) {
            ids.forEach { id ->
                runCatching { RecogeYaApi.markArrived(id) }
            }
        }
    }

    fun markAllReady() {
        stopSharing()
        markArrived()
        _ui.update { state ->
            state.copy(
                progress = state.progress.map {
                    it.copy(step = PickupStep.LISTO, zone = it.zone ?: state.pickupZone.ifBlank { null })
                }
            )
        }
    }

    fun cancelPickup() {
        val ids = _ui.value.selectedIds
        stopSharing()
        syncJob?.cancel()
        _ui.update {
            it.copy(pickupActive = false, progress = emptyList(), tvConnected = false)
        }
        viewModelScope.launch(Dispatchers.IO) {
            ids.forEach { id ->
                runCatching { RecogeYaApi.cancel(id) }
            }
        }
    }

    override fun onCleared() {
        stopSharing()
        super.onCleared()
    }

    private fun hasLocationPermission(): Boolean {
        val ctx = getApplication<Application>()
        return ContextCompat.checkSelfPermission(ctx, Manifest.permission.ACCESS_FINE_LOCATION) ==
            PackageManager.PERMISSION_GRANTED ||
            ContextCompat.checkSelfPermission(ctx, Manifest.permission.ACCESS_COARSE_LOCATION) ==
            PackageManager.PERMISSION_GRANTED
    }

    private fun startSharing() {
        val selected = selectedChildren()
        val dest = selected.firstOrNull { it.zoneLat != null && it.zoneLng != null }
        LocationShare.configure(
            ids = selected.map { it.id },
            destLat = dest?.zoneLat,
            destLng = dest?.zoneLng
        )
        val ctx = getApplication<Application>()
        ContextCompat.startForegroundService(ctx, Intent(ctx, PickupLocationService::class.java))
        _ui.update { it.copy(locationSharing = true) }
    }

    private fun stopSharing() {
        val ctx = getApplication<Application>()
        ctx.stopService(Intent(ctx, PickupLocationService::class.java))
        LocationShare.clear()
        _ui.update { it.copy(locationSharing = false, distanceMeters = null, locationEtaMinutes = null) }
    }

    private fun startSync() {
        syncJob?.cancel()
        syncJob = viewModelScope.launch {
            while (isActive && _ui.value.pickupActive) {
                val ids = _ui.value.selectedIds.toList()
                val remote = withContext(Dispatchers.IO) {
                    runCatching { RecogeYaApi.fetchParentState(ids) }.getOrNull()
                }
                if (remote != null) {
                    if (remote.zoneLat != null && remote.zoneLng != null) {
                        LocationShare.destLat = remote.zoneLat
                        LocationShare.destLng = remote.zoneLng
                    }
                    _ui.update { state ->
                        val nextProgress = state.progress.map { local ->
                            val match = remote.pickups.firstOrNull { it.childId == local.childId }
                            if (match == null) local
                            else local.copy(
                                step = when (match.action) {
                                    "LISTO" -> PickupStep.LISTO
                                    "PREPARANDO" -> PickupStep.PREPARANDO
                                    else -> PickupStep.AVISADO
                                },
                                zone = match.zone.ifBlank { remote.zone.ifBlank { local.zone } },
                                parentEtaMinutes = if (match.arrived) 0 else match.etaMinutes,
                                readyEtaMinutes = local.readyEtaMinutes
                            )
                        }
                        state.copy(
                            progress = nextProgress,
                            tvConnected = true,
                            pickupZone = remote.zone.ifBlank { state.pickupZone },
                            receptionPhone = remote.receptionPhone.ifBlank { state.receptionPhone },
                            locationEtaMinutes = if (state.locationSharing) {
                                nextProgress.mapNotNull { it.parentEtaMinutes }.minOrNull()
                                    ?: state.locationEtaMinutes
                            } else {
                                state.locationEtaMinutes
                            }
                        )
                    }
                } else {
                    _ui.update { it.copy(tvConnected = false) }
                }
                delay(1500)
            }
        }
    }
}

fun combinedChildrenTitle(children: List<Child>): String {
    if (children.isEmpty()) return ""
    if (children.size == 1) return children.first().fullName
    val lastNames = children.map { it.lastName }.distinct()
    val firstNames = children.map { it.firstName }
    return if (lastNames.size == 1) {
        firstNames.joinToString(" y ") + " " + lastNames.first()
    } else {
        children.joinToString(" y ") { it.fullName }
    }
}

fun greetingForHour(hour: Int): String = when (hour) {
    in 5..11 -> "Buenos días"
    in 12..18 -> "Buenas tardes"
    else -> "Buenas noches"
}
