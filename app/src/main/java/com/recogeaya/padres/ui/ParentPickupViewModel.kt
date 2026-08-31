package com.recogeaya.padres.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.recogeaya.padres.data.Child
import com.recogeaya.padres.data.ChildPickupProgress
import com.recogeaya.padres.data.PickupStep
import com.recogeaya.padres.data.ResponsibleKind
import com.recogeaya.padres.data.ResponsiblePerson
import com.recogeaya.padres.data.ParentAccount
import com.recogeaya.padres.data.ParentProfile
import com.recogeaya.padres.data.SampleData
import com.recogeaya.padres.data.School
import com.recogeaya.padres.sync.RecogeYaApi
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

data class ParentUiState(
    val loggedIn: Boolean = false,
    val loginError: String? = null,
    val session: ParentAccount? = null,
    val selectedIds: Set<String> = emptySet(),
    val shareLocation: Boolean = true,
    val pickupActive: Boolean = false,
    val progress: List<ChildPickupProgress> = emptyList(),
    val distanceMeters: Int = 450,
    val etaMinutes: Int = 4,
    val selectedResponsibleId: String = "sofia",
    val draftResponsibleId: String = "sofia",
    val extraResponsibles: List<ResponsiblePerson> = emptyList(),
    val verificationCode: String = "6842",
    val tvConnected: Boolean = false
)

class ParentPickupViewModel : ViewModel() {
    val parent: ParentProfile
        get() = _ui.value.session?.profile ?: SampleData.account.profile
    val children = SampleData.children
    val activities = SampleData.activities

    private val _ui = MutableStateFlow(ParentUiState())
    val ui: StateFlow<ParentUiState> = _ui.asStateFlow()
    private var syncJob: Job? = null

    fun childrenBySchool(): List<Pair<School, List<Child>>> =
        SampleData.childrenGroupedBySchool()

    fun allResponsibles(): List<ResponsiblePerson> =
        SampleData.authorizedPeople + _ui.value.extraResponsibles

    fun currentResponsible(): ResponsiblePerson =
        allResponsibles().first { it.id == _ui.value.selectedResponsibleId }

    fun draftResponsible(): ResponsiblePerson =
        allResponsibles().first { it.id == _ui.value.draftResponsibleId }

    fun selectedChildren(): List<Child> =
        children.filter { it.id in _ui.value.selectedIds }

    fun login(email: String, password: String): Boolean {
        val found = SampleData.accountFor(email, password)
        if (found != null) {
            _ui.update { it.copy(loggedIn = true, loginError = null, session = found) }
            return true
        }
        _ui.update {
            it.copy(
                loginError = "Correo o contraseña incorrectos. Usa los datos que te envió la escuela."
            )
        }
        return false
    }

    fun logout() {
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

    fun setShareLocation(enabled: Boolean) {
        _ui.update { it.copy(shareLocation = enabled) }
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
            appendLine("Muéstralo o el QR en la escuela. No necesitas instalar la app.")
            append("Válido 15 minutos.")
        }
    }

    fun startPickup() {
        val selected = selectedChildren()
        if (selected.isEmpty()) return
        val responsible = currentResponsible()
        _ui.update { state ->
            state.copy(
                pickupActive = true,
                progress = selected.map { child ->
                    ChildPickupProgress(
                        childId = child.id,
                        step = PickupStep.AVISADO,
                        zone = SampleData.pickupZone,
                        readyEtaMinutes = 6
                    )
                }
            )
        }
        viewModelScope.launch(Dispatchers.IO) {
            runCatching {
                RecogeYaApi.notifyPickup(selected, responsible.name, _ui.value.etaMinutes)
            }
        }
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
        markArrived()
        _ui.update { state ->
            state.copy(
                progress = state.progress.map {
                    it.copy(step = PickupStep.LISTO, zone = SampleData.pickupZone)
                }
            )
        }
    }

    fun cancelPickup() {
        val ids = _ui.value.selectedIds
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

    private fun startSync() {
        syncJob?.cancel()
        syncJob = viewModelScope.launch {
            while (isActive && _ui.value.pickupActive) {
                val remote = withContext(Dispatchers.IO) {
                    runCatching { RecogeYaApi.fetchState() }.getOrNull()
                }
                if (remote != null) {
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
                                parentEtaMinutes = if (match.arrived) 0 else match.etaMinutes,
                                readyEtaMinutes = if (match.action == "LISTO") null else (match.etaMinutes ?: local.readyEtaMinutes)
                            )
                        }
                        state.copy(progress = nextProgress, tvConnected = true)
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
