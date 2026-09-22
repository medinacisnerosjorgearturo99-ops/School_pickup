package com.recogeaya.padres.sync

import java.time.LocalTime
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

object PickupWindow {
    val zone: ZoneId = ZoneId.of("America/Mexico_City")
    const val MINUTES_BEFORE = 5L

    fun now(): ZonedDateTime = ZonedDateTime.now(zone)

    fun parseHm(value: String): LocalTime? {
        val parts = value.trim().split(":")
        if (parts.size < 2) return null
        val hour = parts[0].toIntOrNull() ?: return null
        val minute = parts[1].toIntOrNull() ?: return null
        if (hour !in 0..23 || minute !in 0..59) return null
        return LocalTime.of(hour, minute)
    }

    fun isOpen(dismissalHm: String, at: ZonedDateTime = now()): Boolean {
        val time = parseHm(dismissalHm) ?: return true
        val opens = at.toLocalDate().atTime(time).atZone(zone).minusMinutes(MINUTES_BEFORE)
        return !at.isBefore(opens)
    }

    fun waitLabel(dismissalHm: String, at: ZonedDateTime = now()): String {
        val time = parseHm(dismissalHm) ?: return ""
        val opens = at.toLocalDate().atTime(time).atZone(zone).minusMinutes(MINUTES_BEFORE)
        if (!at.isBefore(opens)) return ""
        val minutes = ChronoUnit.MINUTES.between(at, opens).coerceAtLeast(0)
        val hours = minutes / 60
        val rest = minutes % 60
        val wait = if (hours > 0) "${hours}h ${rest} min" else "$rest min"
        return "La recogida se abre 5 min antes de las ${dismissalHm.take(5)}. Faltan $wait."
    }

    fun earliestDismissal(times: List<String>): String =
        times.map { it.trim() }.filter { it.isNotBlank() }.minOrNull().orEmpty()
}
