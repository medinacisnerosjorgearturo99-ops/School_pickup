package com.recogeaya.padres.ui.select

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
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import com.recogeaya.padres.data.ResponsibleKind
import com.recogeaya.padres.data.ResponsiblePerson
import com.recogeaya.padres.ui.components.AppCard
import com.recogeaya.padres.ui.components.BackLink
import com.recogeaya.padres.ui.components.RecogeYaBottomScreen
import com.recogeaya.padres.ui.components.SoftInitialsAvatar
import com.recogeaya.padres.ui.components.StatusChip
import com.recogeaya.padres.ui.theme.LocalAppDimens
import com.recogeaya.padres.ui.theme.RecogeYaColors
import com.recogeaya.padres.ui.theme.RecogeYaTheme

@Composable
fun SelectChildrenScreen(
    responsible: ResponsiblePerson,
    children: List<Child>,
    selectedIds: Set<String>,
    shareLocation: Boolean,
    onShareLocationChange: (Boolean) -> Unit,
    onToggleChild: (String) -> Unit,
    onNotify: () -> Unit,
    onBack: () -> Unit,
    onEditResponsible: () -> Unit,
    pickupEnabled: Boolean = true,
    pickupHint: String = "",
    pickupError: String? = null
) {
    val dimens = LocalAppDimens.current
    val selectedCount = selectedIds.size
    val notifyLabel = if (selectedCount == 1) {
        "NOTIFICAR RECOGIDA DE 1 ALUMNO"
    } else {
        "NOTIFICAR RECOGIDA DE $selectedCount ALUMNOS"
    }

    RecogeYaBottomScreen(
        bottomContent = {
            Spacer(Modifier.height(8.dp))
            Button(
                onClick = onNotify,
                enabled = selectedCount > 0 && pickupEnabled,
                modifier = Modifier.fillMaxWidth().height(54.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = RecogeYaColors.Primary,
                    disabledContainerColor = RecogeYaColors.Border
                )
            ) {
                Text(
                    if (!pickupEnabled) "AÚN NO ES HORA DE SALIDA" else notifyLabel,
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp
                )
            }
            if (pickupHint.isNotBlank()) {
                Spacer(Modifier.height(6.dp))
                Text(pickupHint, color = RecogeYaColors.TextMuted, fontSize = 12.sp)
            }
            if (!pickupError.isNullOrBlank()) {
                Spacer(Modifier.height(6.dp))
                Text(pickupError, color = RecogeYaColors.Warning, fontSize = 12.sp)
            }
            Spacer(Modifier.height(12.dp))
        }
    ) {
        Spacer(Modifier.height(4.dp))
        BackLink(onBack)
        Text(
            "Seleccionar hijos",
            fontWeight = FontWeight.Bold,
            fontSize = dimens.title,
            color = RecogeYaColors.TextMain
        )
        Spacer(Modifier.height(12.dp))

        AppCard {
            Row(
                modifier = Modifier.padding(dimens.cardPad),
                verticalAlignment = Alignment.CenterVertically
            ) {
                SoftInitialsAvatar(responsible.initials, size = 40.dp)
                Spacer(Modifier.width(10.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text("Responsable de hoy", color = RecogeYaColors.TextMuted, fontSize = 12.sp)
                    Text(responsible.name, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    if (responsible.isTemporary) {
                        Text(responsible.relation, color = RecogeYaColors.Warning, fontSize = 12.sp)
                    }
                }
                TextButton(onClick = onEditResponsible) {
                    Text("Editar", color = RecogeYaColors.Primary, fontWeight = FontWeight.SemiBold)
                }
            }
        }

        Spacer(Modifier.height(14.dp))
        if (children.isEmpty()) {
            AppCard {
                Column(Modifier.padding(dimens.cardPad)) {
                    Text("Sin alumnos asignados", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    Spacer(Modifier.height(6.dp))
                    Text(
                        "Cuando la escuela dé de alta tu correo como responsable, aquí aparecerán los niños a tu cargo.",
                        color = RecogeYaColors.TextMuted,
                        fontSize = 13.sp
                    )
                }
            }
            Spacer(Modifier.height(10.dp))
        } else {
            children.forEach { child ->
                SelectableChildCard(
                    child = child,
                    selected = child.id in selectedIds,
                    onToggle = { onToggleChild(child.id) }
                )
                Spacer(Modifier.height(10.dp))
            }
        }

        Spacer(Modifier.height(14.dp))
        AppCard {
            Row(
                modifier = Modifier.padding(dimens.cardPad),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("Compartir ubicación", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    Spacer(Modifier.height(4.dp))
                    Text(
                        "Solo durante esta recogida. Se deja de compartir al llegar o cancelar.",
                        color = RecogeYaColors.TextMuted,
                        fontSize = 13.sp
                    )
                }
                Switch(
                    checked = shareLocation,
                    onCheckedChange = onShareLocationChange,
                    colors = SwitchDefaults.colors(
                        checkedThumbColor = RecogeYaColors.Card,
                        checkedTrackColor = RecogeYaColors.Primary
                    )
                )
            }
        }

        Spacer(Modifier.height(16.dp))
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
                    Icon(
                        Icons.Filled.Check,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top
                ) {
                    Text(child.fullName, fontWeight = FontWeight.Bold, fontSize = 16.sp, modifier = Modifier.weight(1f))
                    Spacer(Modifier.width(8.dp))
                    if (selected) {
                        StatusChip("SELECCIONADO", RecogeYaColors.SuccessSoft, RecogeYaColors.Success)
                    } else {
                        StatusChip("NO SELECCIONADO", RecogeYaColors.NeutralSoft, RecogeYaColors.TextMuted)
                    }
                }
                Text(child.gradeGroup, color = RecogeYaColors.TextMuted, fontSize = 13.sp)
                Spacer(Modifier.height(6.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(Icons.Filled.Person, null, tint = RecogeYaColors.TextMuted, modifier = Modifier.size(14.dp))
                    Text("Prof. ${child.teacher}", color = RecogeYaColors.TextMuted, fontSize = 12.sp)
                    Text("•", color = RecogeYaColors.TextMuted, fontSize = 12.sp)
                    Icon(Icons.Filled.Home, null, tint = RecogeYaColors.TextMuted, modifier = Modifier.size(14.dp))
                    Text("Salón ${child.classroom}", color = RecogeYaColors.TextMuted, fontSize = 12.sp)
                }
            }
        }
    }
}

@Preview(showBackground = true, widthDp = 411, heightDp = 891)
@Preview(showBackground = true, widthDp = 320, heightDp = 640)
@Composable
private fun SelectPreview() {
    RecogeYaTheme {
        SelectChildrenScreen(
            responsible = ResponsiblePerson(
                id = "",
                name = "Responsable",
                initials = "R",
                relation = "Padre",
                kind = ResponsibleKind.PRIMARY
            ),
            children = emptyList(),
            selectedIds = emptySet(),
            shareLocation = true,
            onShareLocationChange = {},
            onToggleChild = {},
            onNotify = {},
            onBack = {},
            onEditResponsible = {}
        )
    }
}
