package com.recogeaya.padres.ui.theme

import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

object RecogeYaColors {
    val Primary = Color(0xFF2152FF)
    val PrimaryDark = Color(0xFF1B45D6)
    val PrimarySoft = Color(0xFFE8EEFF)
    val InfoSoft = Color(0xFFEAF1FF)
    val ScreenBg = Color(0xFFF7F8FC)
    val Card = Color(0xFFFFFFFF)
    val TextMain = Color(0xFF111827)
    val TextMuted = Color(0xFF6B7280)
    val Border = Color(0xFFE5E7EB)
    val Success = Color(0xFF16A34A)
    val SuccessSoft = Color(0xFFE7F8EF)
    val Warning = Color(0xFFD97706)
    val WarningSoft = Color(0xFFFFF6E0)
    val WarningBanner = Color(0xFFFFF4CC)
    val NeutralSoft = Color(0xFFF3F4F6)
}

@Immutable
data class AppDimens(
    val screenPad: Dp,
    val cardPad: Dp,
    val cardRadius: Dp,
    val title: TextUnit,
    val section: TextUnit,
    val maxContent: Dp
)

fun appDimensForWidth(widthDp: Int): AppDimens = when {
    widthDp < 360 -> AppDimens(
        screenPad = 16.dp,
        cardPad = 14.dp,
        cardRadius = 16.dp,
        title = 24.sp,
        section = 18.sp,
        maxContent = 560.dp
    )
    widthDp >= 600 -> AppDimens(
        screenPad = 32.dp,
        cardPad = 20.dp,
        cardRadius = 20.dp,
        title = 32.sp,
        section = 22.sp,
        maxContent = 560.dp
    )
    else -> AppDimens(
        screenPad = 20.dp,
        cardPad = 16.dp,
        cardRadius = 18.dp,
        title = 28.sp,
        section = 20.sp,
        maxContent = 560.dp
    )
}

val LocalAppDimens = staticCompositionLocalOf {
    appDimensForWidth(411)
}
