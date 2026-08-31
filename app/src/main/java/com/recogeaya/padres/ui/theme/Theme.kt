package com.recogeaya.padres.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalConfiguration

private val RecogeYaColorScheme = lightColorScheme(
    primary = RecogeYaColors.Primary,
    onPrimary = RecogeYaColors.Card,
    secondary = RecogeYaColors.PrimaryDark,
    background = RecogeYaColors.ScreenBg,
    surface = RecogeYaColors.Card,
    onBackground = RecogeYaColors.TextMain,
    onSurface = RecogeYaColors.TextMain
)

@Composable
fun RecogeYaTheme(content: @Composable () -> Unit) {
    val widthDp = LocalConfiguration.current.screenWidthDp
    CompositionLocalProvider(LocalAppDimens provides appDimensForWidth(widthDp)) {
        MaterialTheme(
            colorScheme = RecogeYaColorScheme,
            content = content
        )
    }
}
