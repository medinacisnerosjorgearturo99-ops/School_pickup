package com.recogeaya.padres.ui.responsible

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
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
import com.recogeaya.padres.data.SampleData
import com.recogeaya.padres.ui.components.AppCard
import com.recogeaya.padres.ui.components.BackLink
import com.recogeaya.padres.ui.components.FilledInitialsAvatar
import com.recogeaya.padres.ui.components.RecogeYaBottomScreen
import com.recogeaya.padres.ui.components.SoftInitialsAvatar
import com.recogeaya.padres.ui.components.StatusChip
import com.recogeaya.padres.ui.theme.LocalAppDimens
import com.recogeaya.padres.ui.theme.RecogeYaColors
import com.recogeaya.padres.ui.theme.RecogeYaTheme

@Composable
fun ResponsiblePickerScreen(
    selectedChildren: List<Child>,
    people: List<ResponsiblePerson>,
    selectedId: String,
    onSelect: (String) -> Unit,
    onAddTemporary: (String, String) -> Unit,
    onSave: () -> Unit,
    onBack: () -> Unit
) {
    val dimens = LocalAppDimens.current
    var showAddDialog by remember { mutableStateOf(false) }

    RecogeYaBottomScreen(
        bottomContent = {
            Spacer(Modifier.height(8.dp))
            Button(
                onClick = onSave,
                modifier = Modifier.fillMaxWidth().height(54.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = RecogeYaColors.Primary)
            ) {
                Text("Guardar responsable", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            }
            TextButton(onClick = onBack, modifier = Modifier.fillMaxWidth()) {
                Text("Cancelar", color = RecogeYaColors.Primary, fontWeight = FontWeight.SemiBold)
            }
            Spacer(Modifier.height(4.dp))
        }
    ) {
        Spacer(Modifier.height(4.dp))
        BackLink(onBack)
        Text(
            "Responsable de hoy",
            fontWeight = FontWeight.Bold,
            fontSize = dimens.title,
            color = RecogeYaColors.TextMain
        )
        Text(
            "Selecciona quién recogerá a tus hijos hoy.",
            color = RecogeYaColors.TextMuted,
            fontSize = 14.sp
        )

        Spacer(Modifier.height(16.dp))
        AppCard {
            Column(Modifier.padding(dimens.cardPad)) {
                Text("Alumnos seleccionados", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Spacer(Modifier.height(10.dp))
                selectedChildren.forEachIndexed { index, child ->
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        FilledInitialsAvatar(child.initials, size = 36.dp)
                        Spacer(Modifier.width(10.dp))
                        Column {
                            Text(child.fullName, fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                            Text(child.gradeGroup, color = RecogeYaColors.TextMuted, fontSize = 12.sp)
                        }
                    }
                    if (index != selectedChildren.lastIndex) Spacer(Modifier.height(10.dp))
                }
            }
        }

        Spacer(Modifier.height(18.dp))
        Text("Responsables autorizados", fontWeight = FontWeight.Bold, fontSize = 16.sp)
        Spacer(Modifier.height(10.dp))

        people.forEach { person ->
            ResponsibleCard(
                person = person,
                selected = person.id == selectedId,
                onSelect = { onSelect(person.id) }
            )
            Spacer(Modifier.height(10.dp))
        }

        AppCard {
            Column(Modifier.padding(dimens.cardPad)) {
                Row(verticalAlignment = Alignment.Top) {
                    Icon(
                        Icons.Filled.PersonAdd,
                        contentDescription = null,
                        tint = RecogeYaColors.Primary,
                        modifier = Modifier.size(28.dp)
                    )
                    Spacer(Modifier.width(10.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Otra persona por hoy", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Text(
                            "Autoriza temporalmente a otra persona para esta recogida.",
                            color = RecogeYaColors.TextMuted,
                            fontSize = 13.sp
                        )
                    }
                }
                Spacer(Modifier.height(12.dp))
                OutlinedButton(
                    onClick = { showAddDialog = true },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = RecogeYaColors.Primary)
                ) {
                    Text("Agregar responsable temporal", fontWeight = FontWeight.SemiBold)
                }
            }
        }

        Spacer(Modifier.height(12.dp))
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .background(RecogeYaColors.InfoSoft)
                .padding(14.dp),
            verticalAlignment = Alignment.Top
        ) {
            Icon(Icons.Filled.Info, null, tint = RecogeYaColors.Primary)
            Spacer(Modifier.width(10.dp))
            Text(
                "Si eliges una persona temporal, no necesita la app: le pasas el código o el QR.",
                color = RecogeYaColors.TextMain,
                fontSize = 13.sp
            )
        }
        Spacer(Modifier.height(16.dp))
    }

    if (showAddDialog) {
        AddTemporaryDialog(
            onDismiss = { showAddDialog = false },
            onConfirm = { name, relation ->
                onAddTemporary(name, relation)
                showAddDialog = false
            }
        )
    }
}

@Composable
private fun ResponsibleCard(
    person: ResponsiblePerson,
    selected: Boolean,
    onSelect: () -> Unit
) {
    AppCard(onClick = onSelect) {
        Row(
            modifier = Modifier.padding(LocalAppDimens.current.cardPad),
            verticalAlignment = Alignment.CenterVertically
        ) {
            SoftInitialsAvatar(person.initials)
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(person.name, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Text(person.relation, color = RecogeYaColors.TextMuted, fontSize = 13.sp)
            }
            if (selected) {
                StatusChip("SELECCIONADA", RecogeYaColors.SuccessSoft, RecogeYaColors.Success)
            } else if (person.kind == ResponsibleKind.TEMPORARY) {
                StatusChip("TEMPORAL", RecogeYaColors.WarningSoft, RecogeYaColors.Warning)
            } else {
                StatusChip(person.authorizedLabel, RecogeYaColors.PrimarySoft, RecogeYaColors.Primary)
            }
            Spacer(Modifier.width(10.dp))
            Box(
                modifier = Modifier
                    .size(24.dp)
                    .clip(CircleShape)
                    .background(if (selected) RecogeYaColors.Primary else Color.Transparent)
                    .border(1.5.dp, if (selected) RecogeYaColors.Primary else RecogeYaColors.Border, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                if (selected) {
                    Icon(Icons.Filled.Check, null, tint = Color.White, modifier = Modifier.size(14.dp))
                }
            }
        }
    }
}

@Composable
private fun AddTemporaryDialog(
    onDismiss: () -> Unit,
    onConfirm: (String, String) -> Unit
) {
    var name by remember { mutableStateOf("Patricia Pérez") }
    var relation by remember { mutableStateOf("Tía") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Responsable temporal") },
        text = {
            Column {
                Text(
                    "Esta persona solo podrá recoger en esta salida y necesitará código o QR.",
                    color = RecogeYaColors.TextMuted,
                    fontSize = 13.sp
                )
                Spacer(Modifier.height(12.dp))
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Nombre") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    value = relation,
                    onValueChange = { relation = it },
                    label = { Text("Parentesco") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            TextButton(onClick = { onConfirm(name, relation) }) { Text("Agregar") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancelar") }
        }
    )
}

@Preview(showBackground = true, widthDp = 411, heightDp = 891)
@Preview(showBackground = true, widthDp = 320, heightDp = 640)
@Composable
private fun ResponsiblePreview() {
    RecogeYaTheme {
        ResponsiblePickerScreen(
            selectedChildren = SampleData.children.take(2),
            people = SampleData.authorizedPeople,
            selectedId = "sofia",
            onSelect = {},
            onAddTemporary = { _, _ -> },
            onSave = {},
            onBack = {}
        )
    }
}
