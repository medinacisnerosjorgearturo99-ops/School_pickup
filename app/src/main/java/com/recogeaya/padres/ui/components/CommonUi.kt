package com.recogeaya.padres.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.windowInsetsPadding
import com.recogeaya.padres.data.PickupStep
import com.recogeaya.padres.ui.theme.LocalAppDimens
import com.recogeaya.padres.ui.theme.RecogeYaColors

@Composable
fun RecogeYaScreen(
    modifier: Modifier = Modifier,
    scrollable: Boolean = true,
    content: @Composable ColumnScope.() -> Unit
) {
    val dimens = LocalAppDimens.current
    Surface(
        color = RecogeYaColors.ScreenBg,
        modifier = modifier.fillMaxSize()
    ) {
        BoxWithConstraints(
            modifier = Modifier
                .fillMaxSize()
                .windowInsetsPadding(WindowInsets.statusBars)
                .windowInsetsPadding(WindowInsets.navigationBars)
        ) {
            val columnModifier = Modifier
                .widthIn(max = dimens.maxContent)
                .fillMaxWidth()
                .align(Alignment.TopCenter)
                .then(
                    if (scrollable) Modifier.verticalScroll(rememberScrollState()) else Modifier
                )
                .padding(horizontal = dimens.screenPad)
                .padding(top = 8.dp, bottom = 20.dp)

            Column(modifier = columnModifier, content = content)
        }
    }
}

@Composable
fun AppCard(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit
) {
    val dimens = LocalAppDimens.current
    val shape = RoundedCornerShape(dimens.cardRadius)
    val colors = CardDefaults.cardColors(containerColor = RecogeYaColors.Card)
    val elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    if (onClick != null) {
        Card(
            onClick = onClick,
            modifier = modifier.fillMaxWidth(),
            shape = shape,
            colors = colors,
            elevation = elevation,
            content = content
        )
    } else {
        Card(
            modifier = modifier.fillMaxWidth(),
            shape = shape,
            colors = colors,
            elevation = elevation,
            content = content
        )
    }
}

@Composable
fun InitialsAvatar(
    initials: String,
    size: Dp = 44.dp
) {
    Box(
        modifier = Modifier
            .size(size)
            .clip(CircleShape)
            .border(1.5.dp, RecogeYaColors.Primary, CircleShape)
            .background(RecogeYaColors.Card),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = initials,
            color = RecogeYaColors.Primary,
            fontWeight = FontWeight.SemiBold,
            fontSize = (size.value * 0.32f).sp
        )
    }
}

@Composable
fun ChildAvatar(size: Dp = 44.dp) {
    Box(
        modifier = Modifier
            .size(size)
            .clip(CircleShape)
            .background(RecogeYaColors.PrimarySoft),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = Icons.Filled.Person,
            contentDescription = null,
            tint = RecogeYaColors.Primary,
            modifier = Modifier.size(size * 0.5f)
        )
    }
}

@Composable
fun StatusChip(
    text: String,
    background: Color,
    foreground: Color
) {
    Text(
        text = text,
        color = foreground,
        fontWeight = FontWeight.Bold,
        fontSize = 11.sp,
        modifier = Modifier
            .clip(RoundedCornerShape(50))
            .background(background)
            .padding(horizontal = 10.dp, vertical = 4.dp)
    )
}

@Composable
fun PickupStepper(
    current: PickupStep,
    compact: Boolean = false
) {
    val steps = listOf(
        PickupStep.AVISADO to "Avisado",
        PickupStep.PREPARANDO to "Preparando",
        PickupStep.LISTO to "Preparado"
    )
    val currentIndex = steps.indexOfFirst { it.first == current }

    Column(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            steps.forEachIndexed { index, _ ->
                val done = index < currentIndex || current == PickupStep.LISTO
                val state = when {
                    done || (index == currentIndex && current == PickupStep.LISTO) -> StepDotState.Done
                    index == currentIndex -> StepDotState.Current
                    else -> StepDotState.Upcoming
                }
                StepDot(state)
                if (index < steps.lastIndex) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .height(2.dp)
                            .background(
                                if (index < currentIndex || current == PickupStep.LISTO) {
                                    RecogeYaColors.Primary
                                } else {
                                    RecogeYaColors.Border
                                }
                            )
                    )
                }
            }
        }
        Spacer(Modifier.height(6.dp))
        Row(modifier = Modifier.fillMaxWidth()) {
            steps.forEachIndexed { index, (_, label) ->
                Text(
                    text = label,
                    fontSize = if (compact) 11.sp else 12.sp,
                    color = if (index <= currentIndex) RecogeYaColors.TextMain else RecogeYaColors.TextMuted,
                    fontWeight = if (index == currentIndex) FontWeight.SemiBold else FontWeight.Normal,
                    textAlign = when (index) {
                        0 -> TextAlign.Start
                        steps.lastIndex -> TextAlign.End
                        else -> TextAlign.Center
                    },
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

private enum class StepDotState { Done, Current, Upcoming }

@Composable
private fun StepDot(state: StepDotState) {
    when (state) {
        StepDotState.Done -> {
            Box(
                modifier = Modifier
                    .size(22.dp)
                    .clip(CircleShape)
                    .background(RecogeYaColors.Primary),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Filled.Check,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(14.dp)
                )
            }
        }
        StepDotState.Current -> {
            Box(
                modifier = Modifier
                    .size(22.dp)
                    .clip(CircleShape)
                    .background(RecogeYaColors.Primary),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(CircleShape)
                        .background(Color.White)
                )
            }
        }
        StepDotState.Upcoming -> {
            Box(
                modifier = Modifier
                    .size(22.dp)
                    .clip(CircleShape)
                    .background(RecogeYaColors.NeutralSoft)
                    .border(1.dp, RecogeYaColors.Border, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .size(7.dp)
                        .clip(CircleShape)
                        .background(Color(0xFFD1D5DB))
                )
            }
        }
    }
}

@Composable
fun FilledInitialsAvatar(
    initials: String,
    size: Dp = 42.dp
) {
    Box(
        modifier = Modifier
            .size(size)
            .clip(CircleShape)
            .background(RecogeYaColors.Primary),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = initials,
            color = Color.White,
            fontWeight = FontWeight.Bold,
            fontSize = (size.value * 0.32f).sp
        )
    }
}

@Composable
fun SoftInitialsAvatar(
    initials: String,
    size: Dp = 42.dp
) {
    Box(
        modifier = Modifier
            .size(size)
            .clip(CircleShape)
            .background(RecogeYaColors.PrimarySoft),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = initials,
            color = RecogeYaColors.Primary,
            fontWeight = FontWeight.Bold,
            fontSize = (size.value * 0.32f).sp
        )
    }
}

@Composable
fun BackLink(onClick: () -> Unit) {
    TextButton(onClick = onClick) {
        Icon(
            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
            contentDescription = "Volver",
            tint = RecogeYaColors.Primary
        )
        Spacer(Modifier.size(4.dp))
        Text("Volver", color = RecogeYaColors.Primary, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
fun RecogeYaBottomScreen(
    modifier: Modifier = Modifier,
    bottomContent: @Composable ColumnScope.() -> Unit,
    content: @Composable ColumnScope.() -> Unit
) {
    val dimens = LocalAppDimens.current
    Surface(color = RecogeYaColors.ScreenBg, modifier = modifier.fillMaxSize()) {
        BoxWithConstraints(
            modifier = Modifier
                .fillMaxSize()
                .windowInsetsPadding(WindowInsets.statusBars)
                .windowInsetsPadding(WindowInsets.navigationBars)
        ) {
            Column(
                modifier = Modifier
                    .widthIn(max = dimens.maxContent)
                    .fillMaxSize()
                    .align(Alignment.TopCenter)
                    .padding(horizontal = dimens.screenPad)
            ) {
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .verticalScroll(rememberScrollState()),
                    content = content
                )
                Column(content = bottomContent)
            }
        }
    }
}

@Composable
fun SectionTitle(text: String) {
    Text(
        text = text,
        fontSize = LocalAppDimens.current.section,
        fontWeight = FontWeight.Bold,
        color = RecogeYaColors.TextMain
    )
}

@Composable
fun FakeQrCode(
    data: String,
    modifier: Modifier = Modifier
) {
    val modules = 21
    val bits = remember(data) {
        val random = java.util.Random(data.hashCode().toLong())
        Array(modules) { BooleanArray(modules) { random.nextBoolean() } }.also { grid ->
            fun finder(ox: Int, oy: Int) {
                for (y in 0 until 7) {
                    for (x in 0 until 7) {
                        val onBorder = x == 0 || y == 0 || x == 6 || y == 6
                        val inCenter = x in 2..4 && y in 2..4
                        grid[oy + y][ox + x] = onBorder || inCenter
                    }
                }
            }
            finder(0, 0)
            finder(modules - 7, 0)
            finder(0, modules - 7)
        }
    }
    Box(
        modifier = modifier
            .background(Color.White, RoundedCornerShape(8.dp))
            .border(1.dp, RecogeYaColors.Border, RoundedCornerShape(8.dp))
            .padding(8.dp)
    ) {
        Canvas(Modifier.fillMaxSize()) {
            val cell = size.minDimension / modules
            bits.forEachIndexed { y, row ->
                row.forEachIndexed { x, on ->
                    if (on) {
                        drawRect(
                            color = Color.Black,
                            topLeft = Offset(x * cell, y * cell),
                            size = androidx.compose.ui.geometry.Size(cell, cell)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun MetaRow(
    items: List<Pair<androidx.compose.ui.graphics.vector.ImageVector, String>>
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        items.forEachIndexed { index, (icon, label) ->
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.weight(1f, fill = false)
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = RecogeYaColors.TextMuted,
                    modifier = Modifier.size(14.dp)
                )
                Spacer(Modifier.size(4.dp))
                Text(
                    text = label,
                    color = RecogeYaColors.TextMuted,
                    fontSize = 12.sp,
                    maxLines = 1
                )
            }
            if (index != items.lastIndex) {
                Text("•", color = RecogeYaColors.TextMuted, fontSize = 12.sp)
            }
        }
    }
}
