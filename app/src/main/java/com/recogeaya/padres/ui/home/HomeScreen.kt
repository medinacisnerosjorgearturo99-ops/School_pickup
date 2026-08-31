package com.recogeaya.padres.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.VerifiedUser
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.recogeaya.padres.data.Child
import com.recogeaya.padres.data.ParentProfile
import com.recogeaya.padres.data.PickupActivityItem
import com.recogeaya.padres.data.SampleData
import com.recogeaya.padres.data.School
import com.recogeaya.padres.ui.components.AppCard
import com.recogeaya.padres.ui.components.ChildAvatar
import com.recogeaya.padres.ui.components.InitialsAvatar
import com.recogeaya.padres.ui.components.RecogeYaBottomScreen
import com.recogeaya.padres.ui.components.StatusChip
import com.recogeaya.padres.ui.greetingForHour
import com.recogeaya.padres.ui.theme.LocalAppDimens
import com.recogeaya.padres.ui.theme.RecogeYaColors
import com.recogeaya.padres.ui.theme.RecogeYaTheme
import java.util.Calendar

@Composable
fun HomeScreen(
    parent: ParentProfile,
    childrenBySchool: List<Pair<School, List<Child>>>,
    selectedIds: Set<String>,
    activities: List<PickupActivityItem>,
    onToggleChild: (String) -> Unit,
    onPickupClick: () -> Unit,
    onLogout: () -> Unit
) {
    val dimens = LocalAppDimens.current
    val greeting = greetingForHour(Calendar.getInstance().get(Calendar.HOUR_OF_DAY))
    val selectedCount = selectedIds.size
    val pickupLabel = if (selectedCount == 0) {
        "SELECCIONA A TUS HIJOS"
    } else if (selectedCount == 1) {
        "VOY POR 1 ALUMNO"
    } else {
        "VOY POR $selectedCount ALUMNOS"
    }

    RecogeYaBottomScreen(
        bottomContent = {
            Spacer(Modifier.height(8.dp))
            Button(
                onClick = onPickupClick,
                enabled = selectedCount > 0,
                modifier = Modifier.fillMaxWidth().height(54.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = RecogeYaColors.Primary,
                    disabledContainerColor = RecogeYaColors.Border
                )
            ) {
                Icon(Icons.Filled.DirectionsCar, contentDescription = null, modifier = Modifier.size(20.dp))
                Spacer(Modifier.width(8.dp))
                Text(pickupLabel, fontWeight = FontWeight.Bold, fontSize = 14.sp)
            }
            Spacer(Modifier.height(10.dp))
        }
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "¡$greeting, ${parent.name}!",
                    color = RecogeYaColors.TextMain,
                    fontWeight = FontWeight.Bold,
                    fontSize = dimens.title,
                    lineHeight = (dimens.title.value + 4).sp
                )
                Text(
                    "Selecciona a quién vas a recoger hoy.",
                    color = RecogeYaColors.TextMuted,
                    fontSize = 14.sp
                )
            }
            Spacer(Modifier.width(8.dp))
            InitialsAvatar(parent.initials)
            IconButton(onClick = onLogout) {
                Icon(Icons.Filled.Logout, contentDescription = "Cerrar sesión", tint = RecogeYaColors.TextMuted)
            }
        }

        Spacer(Modifier.height(20.dp))
        childrenBySchool.forEach { (school, kids) ->
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Filled.School, null, tint = RecogeYaColors.Primary, modifier = Modifier.size(20.dp))
                Spacer(Modifier.width(8.dp))
                Text(school.name, fontWeight = FontWeight.Bold, fontSize = dimens.section)
            }
            Spacer(Modifier.height(10.dp))
            kids.forEach { child ->
                SelectableChildCard(
                    child = child,
                    selected = child.id in selectedIds,
                    onToggle = { onToggleChild(child.id) }
                )
                Spacer(Modifier.height(10.dp))
            }
            Spacer(Modifier.height(8.dp))
        }

        Text("Actividad reciente", fontWeight = FontWeight.Bold, fontSize = dimens.section)
        Spacer(Modifier.height(12.dp))
        AppCard {
            Column(Modifier.padding(horizontal = 16.dp, vertical = 4.dp)) {
                activities.forEachIndexed { index, item ->
                    ActivityRow(item)
                    if (index != activities.lastIndex) {
                        HorizontalDivider(color = RecogeYaColors.Border)
                    }
                }
            }
        }
        Spacer(Modifier.height(12.dp))
    }
}

@Composable
private fun SelectableChildCard(
    child: Child,
    selected: Boolean,
    onToggle: () -> Unit
) {
    AppCard(onClick = onToggle) {
        Row(
            modifier = Modifier.padding(LocalAppDimens.current.cardPad),
            verticalAlignment = Alignment.Top
        ) {
            Box(
                modifier = Modifier
                    .size(26.dp)
                    .clip(CircleShape)
                    .background(if (selected) RecogeYaColors.Primary else Color.Transparent)
                    .border(
                        1.5.dp,
                        if (selected) RecogeYaColors.Primary else RecogeYaColors.Border,
                        CircleShape
                    )
                    .clickable(onClick = onToggle),
                contentAlignment = Alignment.Center
            ) {
                if (selected) {
                    Icon(Icons.Filled.Check, null, tint = Color.White, modifier = Modifier.size(16.dp))
                }
            }
            Spacer(Modifier.width(12.dp))
            ChildAvatar()
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top
                ) {
                    Text(
                        child.fullName,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        modifier = Modifier.weight(1f)
                    )
                    Spacer(Modifier.width(8.dp))
                    if (selected) {
                        StatusChip("SELECCIONADO", RecogeYaColors.SuccessSoft, RecogeYaColors.Success)
                    } else {
                        StatusChip("ACTIVO", RecogeYaColors.PrimarySoft, RecogeYaColors.Primary)
                    }
                }
                Text(child.gradeGroup, color = RecogeYaColors.TextMuted, fontSize = 13.sp)
                Spacer(Modifier.height(6.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.Person, null, tint = RecogeYaColors.TextMuted, modifier = Modifier.size(14.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("Prof. ${child.teacher}", color = RecogeYaColors.TextMuted, fontSize = 12.sp, maxLines = 1)
                    Text("  •  ", color = RecogeYaColors.TextMuted, fontSize = 12.sp)
                    Icon(Icons.Filled.Home, null, tint = RecogeYaColors.TextMuted, modifier = Modifier.size(14.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("Salón ${child.classroom}", color = RecogeYaColors.TextMuted, fontSize = 12.sp, maxLines = 1)
                }
            }
        }
    }
}

@Composable
private fun ActivityRow(item: PickupActivityItem) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 12.dp),
        verticalAlignment = Alignment.Top
    ) {
        Icon(
            imageVector = Icons.Filled.VerifiedUser,
            contentDescription = null,
            tint = RecogeYaColors.Success,
            modifier = Modifier
                .size(36.dp)
                .clip(CircleShape)
                .background(RecogeYaColors.SuccessSoft)
                .padding(8.dp)
        )
        Spacer(Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(item.title, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = RecogeYaColors.TextMain)
            Text(item.description, color = RecogeYaColors.TextMuted, fontSize = 12.sp, lineHeight = 16.sp)
        }
        Spacer(Modifier.width(8.dp))
        Text(item.timestamp, color = RecogeYaColors.TextMuted, fontSize = 12.sp)
    }
}

@Preview(showBackground = true, widthDp = 411, heightDp = 891)
@Preview(showBackground = true, widthDp = 320, heightDp = 640)
@Composable
private fun HomePreview() {
    RecogeYaTheme {
        HomeScreen(
            parent = SampleData.account.profile,
            childrenBySchool = SampleData.childrenGroupedBySchool(),
            selectedIds = setOf("lucas"),
            activities = SampleData.activities,
            onToggleChild = {},
            onPickupClick = {},
            onLogout = {}
        )
    }
}
