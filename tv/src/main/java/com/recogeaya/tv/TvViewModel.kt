package com.recogeaya.tv

import android.app.Application
import android.content.Context.MODE_PRIVATE
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.recogeaya.tv.sync.TvApi
import com.recogeaya.tv.sync.TvDashboardState
import com.recogeaya.tv.sync.TvScreenOption
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

private val fallbackScreens = listOf(
    "k-a" to Triple("Kinder", "A", "K-01"),
    "k-b" to Triple("Kinder", "B", "K-03"),
    "1-a" to Triple("1º Primaria", "A", "A-01"),
    "1-b" to Triple("1º Primaria", "B", "A-02"),
    "1-c" to Triple("1º Primaria", "C", "A-03"),
    "2-a" to Triple("2º Primaria", "A", "A-12"),
    "2-b" to Triple("2º Primaria", "B", "A-13"),
    "2-c" to Triple("2º Primaria", "C", "A-14"),
    "3-a" to Triple("3º Primaria", "A", "B-01"),
    "3-b" to Triple("3º Primaria", "B", "B-02"),
    "4-a" to Triple("4º Primaria", "A", "B-11"),
    "4-b" to Triple("4º Primaria", "B", "B-12"),
    "5-a" to Triple("5º Primaria", "A", "C-01"),
    "5-b" to Triple("5º Primaria", "B", "C-02"),
    "5-c" to Triple("5º Primaria", "C", "C-05"),
    "6-a" to Triple("6º Primaria", "A", "C-11"),
    "6-b" to Triple("6º Primaria", "B", "C-12"),
    "6-c" to Triple("6º Primaria", "C", "C-13"),
).map { (id, info) ->
    val (grade, letter, classroom) = info
    TvScreenOption(
        id = "scr-ciclo-2026-$id",
        name = "Pantalla $classroom",
        pairingCode = "CSI-${classroom.replace("-", "")}",
        groupLabel = "$grade • Grupo $letter",
        classroom = classroom
    )
}.sortedBy { if (it.id.contains("-2-a")) 0 else 1 }

data class TvUiState(
    val dashboard: TvDashboardState = TvDashboardState(),
    val clock: String = "--:--",
    val connected: Boolean = false,
    val screenId: String? = null,
    val pairing: Boolean = false,
    val pairingError: String? = null,
    val pairingBusy: Boolean = false,
    val screens: List<TvScreenOption> = fallbackScreens
)

class TvViewModel(application: Application) : AndroidViewModel(application) {
    private val prefs = application.getSharedPreferences("tv", MODE_PRIVATE)
    private val _ui = MutableStateFlow(
        TvUiState(
            screenId = prefs.getString(KEY_SCREEN, null),
            pairing = prefs.getString(KEY_SCREEN, null).isNullOrBlank()
        )
    )
    val ui: StateFlow<TvUiState> = _ui.asStateFlow()
    private val timeFormat = SimpleDateFormat("HH:mm", Locale.getDefault())

    init {
        viewModelScope.launch {
            while (isActive) {
                _ui.value = _ui.value.copy(clock = timeFormat.format(Date()))
                delay(1000)
            }
        }
        viewModelScope.launch {
            while (isActive) {
                if (_ui.value.pairing) {
                    val list = withContext(Dispatchers.IO) {
                        runCatching { TvApi.fetchScreens() }.getOrNull().orEmpty()
                    }
                    if (list.isNotEmpty()) {
                        _ui.value = _ui.value.copy(screens = list, connected = true)
                    }
                } else {
                    val screenId = _ui.value.screenId
                    val remote = withContext(Dispatchers.IO) {
                        runCatching { TvApi.fetchState(screenId) }.getOrNull()
                    }
                    _ui.value = _ui.value.copy(
                        dashboard = remote ?: _ui.value.dashboard,
                        connected = remote != null
                    )
                }
                delay(1500)
            }
        }
    }

    fun showPairing() {
        _ui.value = _ui.value.copy(pairing = true, pairingError = null, pairingBusy = false)
    }

    fun pairWith(screen: TvScreenOption) {
        if (_ui.value.pairingBusy) return
        viewModelScope.launch {
            _ui.value = _ui.value.copy(pairingBusy = true, pairingError = null)
            val remote = withContext(Dispatchers.IO) {
                runCatching { TvApi.fetchState(screen.id) }.getOrNull()
                    ?: runCatching { TvApi.pair(screen.pairingCode) }.getOrNull()
            }
            if (remote == null) {
                _ui.value = _ui.value.copy(
                    pairingBusy = false,
                    pairingError = "No se pudo vincular. Revisa que el servidor esté en :8080."
                )
                return@launch
            }
            persist(remote.classroom.screenId.ifBlank { screen.id })
            _ui.value = _ui.value.copy(
                dashboard = remote,
                connected = true,
                screenId = remote.classroom.screenId.ifBlank { screen.id },
                pairing = false,
                pairingBusy = false,
                pairingError = null
            )
        }
    }

    private fun persist(screenId: String) {
        prefs.edit().putString(KEY_SCREEN, screenId).apply()
    }

    companion object {
        private const val KEY_SCREEN = "screen_id"
    }
}
