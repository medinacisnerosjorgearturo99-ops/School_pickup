package com.recogeaya.tv.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.material3.Text
import kotlin.math.cos
import kotlin.math.sin

@Composable
fun WaitingClockScreen(
    clock: String,
    dateLabel: String,
    dismissalTime: String,
    modifier: Modifier = Modifier
) {
    val parts = clock.split(":")
    val hour = parts.getOrNull(0)?.toIntOrNull() ?: 0
    val minute = parts.getOrNull(1)?.toIntOrNull() ?: 0
    val second = parts.getOrNull(2)?.toIntOrNull() ?: 0
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(TvColors.Bg),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            AnalogClock(hour, minute, second)
            Spacer(Modifier.height(24.dp))
            Text(clock, color = TvColors.Text, fontWeight = FontWeight.ExtraBold, fontSize = 64.sp)
            Text(dateLabel, color = TvColors.Muted, fontSize = 22.sp)
            Spacer(Modifier.height(16.dp))
            Text("Esperando hora de salida", color = TvColors.Accent, fontWeight = FontWeight.Bold, fontSize = 20.sp)
            if (dismissalTime.isNotBlank()) {
                Text(
                    "La lista se abre 5 min antes de las $dismissalTime",
                    color = TvColors.Muted,
                    fontSize = 16.sp
                )
            }
        }
    }
}

@Composable
private fun AnalogClock(hour: Int, minute: Int, second: Int) {
    Canvas(Modifier.size(220.dp)) {
        val radius = size.minDimension / 2f
        val center = Offset(size.width / 2f, size.height / 2f)
        drawCircle(color = TvColors.Card, radius = radius)
        drawCircle(color = TvColors.Line, radius = radius, style = Stroke(width = 6f))
        repeat(12) { i ->
            val angle = Math.toRadians((i * 30 - 90).toDouble())
            val inner = radius * 0.82f
            val outer = radius * 0.92f
            drawLine(
                color = TvColors.Accent,
                start = Offset(center.x + inner * cos(angle).toFloat(), center.y + inner * sin(angle).toFloat()),
                end = Offset(center.x + outer * cos(angle).toFloat(), center.y + outer * sin(angle).toFloat()),
                strokeWidth = 4f,
                cap = StrokeCap.Round
            )
        }
        fun hand(value: Float, length: Float, width: Float, color: androidx.compose.ui.graphics.Color) {
            val angle = Math.toRadians((value * 360.0 / 60.0 - 90).toDouble())
            drawLine(
                color = color,
                start = center,
                end = Offset(center.x + length * cos(angle).toFloat(), center.y + length * sin(angle).toFloat()),
                strokeWidth = width,
                cap = StrokeCap.Round
            )
        }
        val hourVal = ((hour % 12) + minute / 60f) * 5f
        hand(hourVal, radius * 0.5f, 10f, TvColors.Text)
        hand(minute + second / 60f, radius * 0.7f, 7f, TvColors.Accent)
        hand(second.toFloat(), radius * 0.78f, 3f, TvColors.Orange)
        drawCircle(color = TvColors.Orange, radius = 8f, center = center)
    }
}
