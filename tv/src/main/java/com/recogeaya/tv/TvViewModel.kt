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

data class TvUiState(
    val dashboard: TvDashboardState = TvDashboardState(),
    val clock: String = "--:--",
    val connected: Boolean = false,
    val screenId: String? = null,
    val pairing: Boolean = false,
    val pairingError: String? = null,
    val pairingBusy: Boolean = false,
    val screens: List<TvScreenOption> = emptyList()
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
                        runCatching { TvApi.fetchScreens() }.getOrNull()
                    }
                    if (list != null) {
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
                delay(1000)
            }
        }
    }

    fun showPairing() {
        _ui.value = _ui.value.copy(pairing = true, pairingError = null, pairingBusy = false)
        viewModelScope.launch {
            val list = withContext(Dispatchers.IO) {
                runCatching { TvApi.fetchScreens() }.getOrNull()
            }
            if (list != null) {
                _ui.value = _ui.value.copy(screens = list, connected = true)
            }
        }
    }

    fun pairWithCode(raw: String) {
        if (_ui.value.pairingBusy) return
        val code = raw.trim()
        if (code.isBlank()) {
            _ui.value = _ui.value.copy(pairingError = "Escribe el código de la pantalla (el de Dirección).")
            return
        }
        viewModelScope.launch {
            _ui.value = _ui.value.copy(pairingBusy = true, pairingError = null)
            val remote = withContext(Dispatchers.IO) {
                runCatching { TvApi.pair(code) }.getOrNull()
            }
            applyPairing(remote, fallbackId = null)
        }
    }

    fun setAction(childId: String, action: String) {
        viewModelScope.launch(Dispatchers.IO) {
            runCatching { TvApi.setAction(childId, action) }
        }
        val dashboard = _ui.value.dashboard
        _ui.value = _ui.value.copy(
            dashboard = dashboard.copy(
                pickups = dashboard.pickups.map { pickup ->
                    if (pickup.childId == childId) pickup.copy(action = action) else pickup
                }
            )
        )
    }

    fun pairWith(screen: TvScreenOption) {
        if (_ui.value.pairingBusy) return
        viewModelScope.launch {
            _ui.value = _ui.value.copy(pairingBusy = true, pairingError = null)
            val remote = withContext(Dispatchers.IO) {
                runCatching { TvApi.fetchState(screen.id) }.getOrNull()
                    ?: runCatching { TvApi.pair(screen.pairingCode) }.getOrNull()
            }
            applyPairing(remote, fallbackId = screen.id)
        }
    }

    private fun applyPairing(remote: TvDashboardState?, fallbackId: String?) {
        if (remote == null) {
            _ui.value = _ui.value.copy(
                pairingBusy = false,
                pairingError = "No se encontró ese salón. Revisa el código en Dirección y que el servidor esté en :8080."
            )
            return
        }
        val screenId = remote.classroom.screenId.ifBlank { fallbackId.orEmpty() }
        if (screenId.isNotBlank()) persist(screenId)
        _ui.value = _ui.value.copy(
            dashboard = remote,
            connected = true,
            screenId = screenId.ifBlank { _ui.value.screenId },
            pairing = false,
            pairingBusy = false,
            pairingError = null
        )
    }

    private fun persist(screenId: String) {
        prefs.edit().putString(KEY_SCREEN, screenId).apply()
    }

    companion object {
        private const val KEY_SCREEN = "screen_id"
    }
}
