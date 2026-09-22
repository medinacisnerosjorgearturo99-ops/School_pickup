package com.recogeaya.server

import java.time.LocalTime
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale

object PickupWindow {
    val zone: ZoneId = ZoneId.of("America/Mexico_City")
    const val MINUTES_BEFORE = 5
    private val clockFmt = DateTimeFormatter.ofPattern("HH:mm:ss")
    private val dateFmt = DateTimeFormatter.ofPattern("EEEE d 'de' MMMM", Locale("es", "MX"))

    fun now(): ZonedDateTime = ZonedDateTime.now(zone)

    fun clock(): String = now().format(clockFmt)

    fun dateLabel(): String {
        val raw = now().format(dateFmt)
        return raw.replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale("es", "MX")) else it.toString() }
    }

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
        val opens = at.toLocalDate().atTime(time).atZone(zone).minusMinutes(MINUTES_BEFORE.toLong())
        return !at.isBefore(opens)
    }
}
