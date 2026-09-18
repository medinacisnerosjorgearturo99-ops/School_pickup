package com.recogeaya.server

import kotlin.math.asin
import kotlin.math.ceil
import kotlin.math.cos
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.roundToInt
import kotlin.math.sin
import kotlin.math.sqrt

object Geo {
    fun distanceMeters(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Int {
        val earth = 6371000.0
        val p1 = Math.toRadians(lat1)
        val p2 = Math.toRadians(lat2)
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)
        val a = sin(dLat / 2).pow(2.0) + cos(p1) * cos(p2) * sin(dLon / 2).pow(2.0)
        val meters = 2 * earth * asin(min(1.0, sqrt(a)))
        return meters.roundToInt()
    }

    fun etaMinutes(meters: Int): Int {
        if (meters < 80) return 0
        val minutes = ceil(meters / 6.11 / 60.0).toInt()
        return minutes.coerceIn(1, 180)
    }
}
