package com.recogeaya.tv.ui

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.clickable
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.ChatBubbleOutline
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Tv
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.recogeaya.tv.TvViewModel
import com.recogeaya.tv.sync.TvPickup
import com.recogeaya.tv.sync.TvRosterStudent
import com.recogeaya.tv.sync.TvScreenOption
import com.recogeaya.tv.sync.arrivalLabel
import com.recogeaya.tv.sync.hasArrived
import com.recogeaya.tv.sync.hasLocation
import com.recogeaya.tv.sync.isPrepareNow

object TvColors {
    val Bg = Color(0xFF071018)
    val Card = Color(0xFF101A28)
    val Line = Color(0xFF1D2B40)
    val Text = Color(0xFFF4F7FB)
    val Muted = Color(0xFF8B9BB4)
    val Blue = Color(0xFF2152FF)
    val BlueSoft = Color(0xFF1A2F6B)
    val Green = Color(0xFF22C55E)
    val GreenSoft = Color(0xFF163428)
    val Orange = Color(0xFFF59E0B)
    val OrangeSoft = Color(0xFF3A2A12)
    val Accent = Color(0xFF7EA2FF)
}

@Composable
fun TvTheme(content: @Composable () -> Unit) {
    Surface(color = TvColors.Bg, content = content)
}

@Composable
fun TvDashboardScreen(
    viewModel: TvViewModel,
    modifier: Modifier = Modifier
) {
    val ui by viewModel.ui.collectAsStateWithLifecycle()
    var selectedPickup by remember { mutableStateOf<TvPickup?>(null) }
    BackHandler {
        if (!ui.pairing) viewModel.showPairing()
    }
    if (ui.pairing) {
        PairingOverlay(
            screens = ui.screens,
            error = ui.pairingError,
            busy = ui.pairingBusy,
            connected = ui.connected,
            onSelect = viewModel::pairWith,
            onCode = viewModel::pairWithCode,
            modifier = modifier
        )
        return
    }
    if (!ui.dashboard.pickupOpen) {
        Column(modifier.fillMaxSize().background(TvColors.Bg).padding(20.dp)) {
            Header(
                school = ui.dashboard.classroom.school,
                grade = ui.dashboard.classroom.grade,
                teacherLine = "${ui.dashboard.classroom.teacher} • ${ui.dashboard.classroom.classroom}",
                clock = ui.clock,
                dateLabel = ui.dateLabel,
                connected = ui.connected,
                pairingCode = ui.dashboard.classroom.pairingCode,
                onChangeClassroom = viewModel::showPairing
            )
            WaitingClockScreen(
                clock = ui.clock,
                dateLabel = ui.dateLabel,
                dismissalTime = ui.dashboard.classroom.dismissalTime,
                modifier = Modifier.weight(1f)
            )
        }
        return
    }
    val pickups = ui.dashboard.pickups
    val prepare = pickups.filter { it.isPrepareNow() }
    val upcoming = pickups.filterNot { it.isPrepareNow() }.sortedBy { it.etaMinutes ?: 99 }
    val classroom = ui.dashboard.classroom
    val roster = ui.dashboard.roster
    val pickupIds = pickups.map { it.childId }.toSet()

    BoxWithConstraints(
        modifier = modifier
            .fillMaxSize()
            .background(TvColors.Bg)
            .padding(20.dp)
    ) {
        val wide = maxWidth >= 900.dp
        Column(Modifier.fillMaxSize()) {
            Header(
                school = classroom.school,
                grade = classroom.grade,
                teacherLine = "${classroom.teacher} • ${classroom.classroom}",
                clock = ui.clock,
                dateLabel = ui.dateLabel,
                connected = ui.connected,
                pairingCode = classroom.pairingCode,
                onChangeClassroom = viewModel::showPairing
            )
            Spacer(Modifier.height(16.dp))
            if (wide) {
                Row(Modifier.fillMaxSize(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    MainPanel(
                        prepare = prepare,
                        upcoming = upcoming,
                        onAction = viewModel::setAction,
                        onSelect = { selectedPickup = it },
                        modifier = Modifier.weight(1.7f).fillMaxHeight()
                    )
                    Sidebar(
                        total = if (roster.isNotEmpty()) roster.size else classroom.totalStudents,
                        prepareCount = prepare.size,
                        pickups = pickups,
                        roster = roster,
                        pickupIds = pickupIds,
                        zone = classroom.zone,
                        modifier = Modifier.weight(0.78f).fillMaxHeight()
                    )
                }
            } else {
                Column(
                    Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    MainPanel(prepare, upcoming, viewModel::setAction, { selectedPickup = it }, Modifier.fillMaxWidth())
                    Sidebar(
                        total = if (roster.isNotEmpty()) roster.size else classroom.totalStudents,
                        prepareCount = prepare.size,
                        pickups = pickups,
                        roster = roster,
                        pickupIds = pickupIds,
                        zone = classroom.zone,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        }
        selectedPickup?.let { pickup ->
            val live = pickups.find { it.childId == pickup.childId } ?: pickup
            ParentLocationDialog(
                pickup = live,
                zoneLat = classroom.zoneLat,
                zoneLng = classroom.zoneLng,
                onAction = viewModel::setAction,
                onDismiss = { selectedPickup = null }
            )
        }
    }
}

@Composable
private fun Header(
    school: String,
    grade: String,
    teacherLine: String,
    clock: String,
    dateLabel: String,
    connected: Boolean,
    pairingCode: String,
    onChangeClassroom: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
            Box(
                modifier = Modifier
                    .size(52.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(TvColors.Blue),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Filled.School, contentDescription = null, tint = Color.White)
            }
            Spacer(Modifier.width(12.dp))
            Column {
                Text(school, color = TvColors.Text, fontWeight = FontWeight.Bold, fontSize = 22.sp)
                Text("PANEL DE SALIDA • SCHOOL PICKUP", color = TvColors.Accent, fontWeight = FontWeight.Bold, fontSize = 12.sp)
            }
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.weight(1f)) {
            Text(grade, color = TvColors.Text, fontWeight = FontWeight.Bold, fontSize = 24.sp)
            Text(teacherLine, color = TvColors.Muted, fontSize = 14.sp)
        }
        Column(
            horizontalAlignment = Alignment.End,
            modifier = Modifier
                .weight(1f)
                .clickable(onClick = onChangeClassroom)
        ) {
            Text(clock, color = TvColors.Text, fontWeight = FontWeight.ExtraBold, fontSize = 32.sp)
            if (dateLabel.isNotBlank()) {
                Text(dateLabel, color = TvColors.Muted, fontSize = 12.sp)
            }
            Text(
                if (connected) "● EN TIEMPO REAL" else "● SIN CONEXIÓN",
                color = if (connected) TvColors.Green else TvColors.Orange,
                fontWeight = FontWeight.Bold,
                fontSize = 13.sp
            )
            Text("Código $pairingCode · cambiar salón", color = TvColors.Muted, fontSize = 11.sp)
        }
    }
}

@Composable
private fun MainPanel(
    prepare: List<TvPickup>,
    upcoming: List<TvPickup>,
    onAction: (String, String) -> Unit,
    onSelect: (TvPickup) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(22.dp))
            .background(TvColors.Card)
            .border(1.dp, TvColors.Line, RoundedCornerShape(22.dp))
            .padding(20.dp)
    ) {
        SectionLabel(Icons.AutoMirrored.Filled.Send, "Preparar ahora")
        Spacer(Modifier.height(8.dp))
        Row(Modifier.fillMaxWidth().padding(bottom = 8.dp)) {
            HeaderCell("ALUMNOS QUE NECESITAN TU ATENCIÓN", 1.4f)
            HeaderCell("RESPONSABLE", 1f)
            HeaderCell("LLEGADA ESTIMADA", 0.9f)
            HeaderCell("ESTADO", 0.8f)
        }
        Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState())) {
            prepare.forEach { student ->
                PrepareRow(student, onAction, onSelect)
            }
            Spacer(Modifier.height(18.dp))
            SectionLabel(Icons.Filled.AccessTime, "Próximos")
            upcoming.forEachIndexed { index, student ->
                UpcomingRow(number = index + 1, student = student, onAction = onAction, onSelect = onSelect)
            }
            if (upcoming.isEmpty()) {
                Text("No hay más alumnos en camino.", color = TvColors.Muted, fontSize = 13.sp)
            }
        }
        Spacer(Modifier.height(12.dp))
    }
}

@Composable
private fun RowScope.HeaderCell(text: String, weight: Float) {
    Text(
        text = text,
        color = TvColors.Muted,
        fontSize = 11.sp,
        fontWeight = FontWeight.Bold,
        modifier = Modifier.weight(weight),
        maxLines = 1
    )
}

@Composable
private fun PrepareRow(student: TvPickup, onAction: (String, String) -> Unit, onSelect: (TvPickup) -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onSelect(student) }
            .padding(vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(modifier = Modifier.weight(1.4f), verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .clip(CircleShape)
                    .background(TvColors.BlueSoft)
                    .then(
                        if (student.fromParentApp) Modifier.border(2.dp, TvColors.Blue, CircleShape)
                        else Modifier
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(student.initials, color = Color(0xFFC9D7FF), fontWeight = FontWeight.Bold, fontSize = 13.sp)
            }
            Spacer(Modifier.width(10.dp))
            Column {
                Text(student.fullName, color = TvColors.Text, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Text(student.gradeGroup, color = TvColors.Muted, fontSize = 12.sp)
                if (student.hasLocation()) {
                    Text("GPS en vivo · toca para ver mapa", color = TvColors.Green, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
                if (student.verificationCode.isNotBlank()) {
                    Text("Código ${student.verificationCode}", color = TvColors.Accent, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
        Text(student.responsibleName, color = TvColors.Text, modifier = Modifier.weight(1f), fontSize = 14.sp)
        Box(modifier = Modifier.weight(0.9f), contentAlignment = Alignment.CenterStart) {
            ArrivalPill(student)
        }
        Box(modifier = Modifier.weight(0.8f), contentAlignment = Alignment.CenterStart) {
            when (student.action) {
                "LISTO" -> InfoPill("PREPARADO", TvColors.GreenSoft, TvColors.Green)
                "PREPARANDO" -> Button(
                    onClick = { onAction(student.childId, "LISTO") },
                    colors = ButtonDefaults.buttonColors(containerColor = TvColors.Green, contentColor = Color.White),
                    shape = RoundedCornerShape(12.dp)
                ) { Text("Preparado", fontWeight = FontWeight.Bold, fontSize = 12.sp) }
                else -> Button(
                    onClick = { onAction(student.childId, "PREPARANDO") },
                    colors = ButtonDefaults.buttonColors(containerColor = TvColors.Blue, contentColor = Color.White),
                    shape = RoundedCornerShape(12.dp)
                ) { Text("Preparando", fontWeight = FontWeight.Bold, fontSize = 12.sp) }
            }
        }
    }
}

@Composable
private fun UpcomingRow(number: Int, student: TvPickup, onAction: (String, String) -> Unit, onSelect: (TvPickup) -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onSelect(student) }
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(28.dp)
                .clip(CircleShape)
                .background(Color(0xFF182538)),
            contentAlignment = Alignment.Center
        ) {
            Text("$number", color = TvColors.Muted, fontWeight = FontWeight.Bold, fontSize = 12.sp)
        }
        Spacer(Modifier.width(10.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(student.fullName, color = TvColors.Text, fontWeight = FontWeight.Bold)
            Text("Responsable: ${student.responsibleName}", color = TvColors.Muted, fontSize = 12.sp)
            if (student.hasLocation()) {
                Text("GPS en vivo · toca para ver mapa", color = TvColors.Green, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
            if (student.verificationCode.isNotBlank()) {
                Text("Código ${student.verificationCode}", color = TvColors.Accent, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }
        ArrivalPill(student)
        Spacer(Modifier.width(10.dp))
        Button(
            onClick = { onAction(student.childId, "PREPARANDO") },
            colors = ButtonDefaults.buttonColors(containerColor = TvColors.Blue, contentColor = Color.White),
            shape = RoundedCornerShape(12.dp)
        ) { Text("Preparando", fontWeight = FontWeight.Bold, fontSize = 12.sp) }
    }
}

@Composable
private fun Sidebar(
    total: Int,
    prepareCount: Int,
    pickups: List<TvPickup>,
    roster: List<TvRosterStudent>,
    pickupIds: Set<String>,
    zone: String,
    modifier: Modifier = Modifier
) {
    val listo = pickups.count { it.action == "LISTO" }
    val prep = pickups.count { it.action == "PREPARANDO" }
    val wait = pickups.count { it.action == "PREPARAR" }

    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        SideCard {
            Text("Resumen del grupo", color = TvColors.Text, fontWeight = FontWeight.Bold, fontSize = 15.sp)
            Spacer(Modifier.height(12.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                Stat(total.toString(), "ALUMNOS", TvColors.Text)
                Stat((wait + prep).toString(), "PENDIENTES", TvColors.Text)
                Stat(prepareCount.toString(), "PREPARAR AHORA", TvColors.Accent)
            }
        }
        SideCard {
            Text("Estados", color = TvColors.Text, fontWeight = FontWeight.Bold, fontSize = 15.sp)
            Spacer(Modifier.height(10.dp))
            StateLine(TvColors.Green, "LISTOS", listo)
            StateLine(TvColors.Blue, "PREPARANDO", prep)
            StateLine(TvColors.Orange, "EN ESPERA", wait)
        }
        SideCard {
            Text("Instrucciones", color = TvColors.Text, fontWeight = FontWeight.Bold, fontSize = 15.sp)
            Spacer(Modifier.height(8.dp))
            Text("1. Revisa la pantalla constantemente.", color = TvColors.Muted, fontSize = 13.sp)
            Text("2. Prepara al alumno cuando aparezca en “Preparar ahora”.", color = TvColors.Muted, fontSize = 13.sp)
            Text("3. Dirígelo a la zona de entrega cuando esté listo.", color = TvColors.Muted, fontSize = 13.sp)
        }
        SideCard {
            InfoMini(Icons.Filled.LocationOn, "Zona de entrega", zone)
        }
        SideCard {
            Text("Lista del grupo", color = TvColors.Text, fontWeight = FontWeight.Bold, fontSize = 15.sp)
            Spacer(Modifier.height(8.dp))
            if (roster.isEmpty()) {
                Text("Esperando padrón del admin…", color = TvColors.Muted, fontSize = 13.sp)
            } else {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(220.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    roster.forEach { student ->
                        val active = student.id in pickupIds
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(28.dp)
                                    .clip(CircleShape)
                                    .background(if (active) TvColors.BlueSoft else Color(0xFF182538)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(student.initials, color = if (active) TvColors.Accent else TvColors.Muted, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                            Spacer(Modifier.width(8.dp))
                            Text(
                                student.fullName,
                                color = if (active) TvColors.Text else TvColors.Muted,
                                fontSize = 13.sp,
                                fontWeight = if (active) FontWeight.Bold else FontWeight.Medium,
                                maxLines = 1
                            )
                        }
                    }
                }
            }
        }
        SideCard {
            InfoMini(Icons.Filled.ChatBubbleOutline, "Comunicación", "Si tienes dudas, contacta a Coordinación.")
        }
    }
}

@Composable
private fun SideCard(content: @Composable () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(22.dp))
            .background(TvColors.Card)
            .border(1.dp, TvColors.Line, RoundedCornerShape(22.dp))
            .padding(16.dp),
        content = { content() }
    )
}

@Composable
private fun Stat(value: String, label: String, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, color = color, fontWeight = FontWeight.ExtraBold, fontSize = 28.sp)
        Text(label, color = TvColors.Muted, fontSize = 11.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun StateLine(color: Color, label: String, count: Int) {
    Row(Modifier.fillMaxWidth().padding(vertical = 4.dp), horizontalArrangement = Arrangement.SpaceBetween) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(10.dp).clip(CircleShape).background(color))
            Spacer(Modifier.width(8.dp))
            Text(label, color = TvColors.Text, fontWeight = FontWeight.Bold)
        }
        Text("$count", color = TvColors.Text, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun InfoMini(icon: ImageVector, title: String, subtitle: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(TvColors.BlueSoft),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, null, tint = TvColors.Accent)
        }
        Spacer(Modifier.width(10.dp))
        Column {
            Text(title, color = TvColors.Muted, fontSize = 12.sp)
            Text(subtitle, color = TvColors.Text, fontWeight = FontWeight.Bold, fontSize = 15.sp)
        }
    }
}

@Composable
private fun SectionLabel(icon: ImageVector, text: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, null, tint = TvColors.Accent)
        Spacer(Modifier.width(8.dp))
        Text(text, color = TvColors.Text, fontWeight = FontWeight.ExtraBold, fontSize = 20.sp)
    }
}

@Composable
private fun InfoPill(text: String, background: Color, foreground: Color) {
    Text(
        text = text,
        color = foreground,
        fontWeight = FontWeight.ExtraBold,
        fontSize = 12.sp,
        modifier = Modifier
            .clip(RoundedCornerShape(50))
            .background(background)
            .padding(horizontal = 12.dp, vertical = 7.dp)
    )
}

@Composable
private fun ArrivalPill(student: TvPickup) {
    val arrived = student.hasArrived()
    val live = !arrived && student.hasLocation()
    InfoPill(
        text = student.arrivalLabel(),
        background = when {
            arrived -> TvColors.GreenSoft
            live -> TvColors.BlueSoft
            else -> TvColors.OrangeSoft
        },
        foreground = when {
            arrived -> TvColors.Green
            live -> TvColors.Blue
            else -> TvColors.Orange
        }
    )
}

@Composable
private fun PairingOverlay(
    screens: List<TvScreenOption>,
    error: String?,
    busy: Boolean,
    connected: Boolean,
    onSelect: (TvScreenOption) -> Unit,
    onCode: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val enterFocus = remember { FocusRequester() }
    var selectedId by remember(screens) { mutableStateOf(screens.firstOrNull()?.id) }
    var code by remember { mutableStateOf("") }
    val selected = screens.find { it.id == selectedId } ?: screens.firstOrNull()

    LaunchedEffect(Unit) {
        runCatching { enterFocus.requestFocus() }
    }

    fun confirm() {
        if (busy) return
        if (code.isNotBlank()) onCode(code) else if (selected != null) onSelect(selected)
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(TvColors.Bg)
            .padding(32.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .width(680.dp)
                .clip(RoundedCornerShape(28.dp))
                .background(TvColors.Card)
                .border(1.dp, TvColors.Line, RoundedCornerShape(28.dp))
                .padding(28.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(TvColors.Blue),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Filled.Tv, contentDescription = null, tint = Color.White)
                }
                Spacer(Modifier.width(14.dp))
                Column {
                    Text("Elegir salón", color = TvColors.Text, fontWeight = FontWeight.ExtraBold, fontSize = 26.sp)
                    Text(
                        when {
                            !connected && screens.isEmpty() -> "Sin conexión con el servidor. Sincroniza el padrón en Dirección y revisa internet de la TV."
                            screens.isEmpty() -> "Escribe el código de Dirección o espera a que aparezcan los salones."
                            else -> "Usa el código de la pantalla o elige el grupo de esta TV."
                        },
                        color = TvColors.Muted,
                        fontSize = 14.sp
                    )
                }
            }
            Spacer(Modifier.height(18.dp))
            OutlinedTextField(
                value = code,
                onValueChange = { code = it.uppercase() },
                enabled = !busy,
                singleLine = true,
                label = { Text("Código de vinculación") },
                placeholder = { Text("TV-A01") },
                modifier = Modifier
                    .fillMaxWidth()
                    .focusRequester(enterFocus),
                keyboardOptions = KeyboardOptions(
                    capitalization = KeyboardCapitalization.Characters,
                    imeAction = ImeAction.Done
                ),
                keyboardActions = KeyboardActions(onDone = { if (code.isNotBlank()) onCode(code) }),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = TvColors.Text,
                    unfocusedTextColor = TvColors.Text,
                    focusedBorderColor = TvColors.Accent,
                    unfocusedBorderColor = TvColors.Line,
                    focusedLabelColor = TvColors.Accent,
                    unfocusedLabelColor = TvColors.Muted,
                    cursorColor = TvColors.Accent,
                    focusedPlaceholderColor = TvColors.Muted,
                    unfocusedPlaceholderColor = TvColors.Muted
                )
            )
            Spacer(Modifier.height(12.dp))
            if (error != null) {
                Text(error, color = TvColors.Orange, fontSize = 13.sp)
                Spacer(Modifier.height(10.dp))
            }
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 280.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(screens, key = { it.id }) { screen ->
                    val active = screen.id == selected?.id
                    Button(
                        onClick = { selectedId = screen.id },
                        enabled = !busy,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (active) TvColors.BlueSoft else Color(0xFF0C1624),
                            contentColor = TvColors.Text
                        ),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(2.dp, if (active) TvColors.Accent else TvColors.Line, RoundedCornerShape(16.dp))
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(Modifier.weight(1f), horizontalAlignment = Alignment.Start) {
                                Text(screen.groupLabel, fontWeight = FontWeight.Bold, fontSize = 17.sp)
                                Text("Salón ${screen.classroom}", color = TvColors.Muted, fontSize = 13.sp)
                            }
                            Text(screen.pairingCode, color = TvColors.Accent, fontWeight = FontWeight.ExtraBold)
                        }
                    }
                }
            }
            Spacer(Modifier.height(16.dp))
            Button(
                onClick = { confirm() },
                enabled = !busy && (code.isNotBlank() || selected != null),
                colors = ButtonDefaults.buttonColors(containerColor = TvColors.Blue),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp)
            ) {
                Text(
                    if (busy) "Entrando…" else if (code.isNotBlank()) "Vincular $code" else "Entrar a ${selected?.groupLabel ?: "este salón"}",
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 18.sp
                )
            }
        }
    }
}
