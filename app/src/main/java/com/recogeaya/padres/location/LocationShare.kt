package com.recogeaya.padres.location

import kotlinx.coroutines.flow.MutableStateFlow

data class LocationFix(
    val latitude: Double,
    val longitude: Double,
    val distanceMeters: Int?,
    val etaMinutes: Int?,
    val sharing: Boolean
)

object LocationShare {
    @Volatile var childIds: List<String> = emptyList()
    @Volatile var destLat: Double? = null
    @Volatile var destLng: Double? = null
    val lastFix = MutableStateFlow<LocationFix?>(null)

    fun configure(ids: List<String>, destLat: Double?, destLng: Double?) {
        childIds = ids
        this.destLat = destLat
        this.destLng = destLng
    }

    fun clear() {
        childIds = emptyList()
        destLat = null
        destLng = null
        lastFix.value = null
    }
}
