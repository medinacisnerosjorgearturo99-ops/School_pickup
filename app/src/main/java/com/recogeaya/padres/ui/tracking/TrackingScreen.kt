package com.recogeaya.padres.ui.tracking

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.recogeaya.padres.data.Child
import com.recogeaya.padres.data.ChildPickupProgress
import com.recogeaya.padres.data.PickupStep
import com.recogeaya.padres.ui.combinedChildrenTitle
import com.recogeaya.padres.ui.components.AppCard
import com.recogeaya.padres.ui.components.BackLink
import com.recogeaya.padres.ui.components.ChildAvatar
import com.recogeaya.padres.ui.components.PickupStepper
import com.recogeaya.padres.ui.components.RecogeYaBottomScreen
import com.recogeaya.padres.ui.components.StatusChip
import com.recogeaya.padres.ui.theme.LocalAppDimens
import com.recogeaya.padres.ui.theme.RecogeYaColors
import com.recogeaya.padres.ui.theme.RecogeYaTheme

@Composable
fun TrackingScreen(
    children: List<Child>,
    progress: List<ChildPickupProgress>,
    tvConnected: Boolean,
    receptionPhone: String = "",
    locationSharing: Boolean = false,
    distanceMeters: Int? = null,
    locationEtaMinutes: Int? = null,
    onArrived: () -> Unit,
    onCancel: () -> Unit,
    onBack: () -> Unit
) {
    val dimens = LocalAppDimens.current
    val context = LocalContext.current
    var showCancelDialog by remember { mutableStateOf(false) }
    val overallStep = progress.minByOrNull { it.step.ordinal }?.step ?: PickupStep.AVISADO
    val zone = progress.firstOrNull { !it.zone.isNullOrBlank() }?.zone.orEmpty()
    val zoneLabel = zone.ifBlank { "Zona de entrega" }
    val phone = receptionPhone.trim()

    RecogeYaBottomScreen(
        bottomContent = {
            Spacer(Modifier.height(8.dp))
            Button(
                onClick = onArrived,
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = RecogeYaColors.Primary)
            ) {
                Text(
                    if (zone.isBlank()) "Ya llegué" else "Ya llegué a $zone",
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(Modifier.height(8.dp))
            if (phone.isNotBlank()) {
                OutlinedButton(
                    onClick = {
                        val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone"))
                        context.startActivity(intent)
                    },
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = RecogeYaColors.TextMain)
                ) {
                    Icon(Icons.Filled.Phone, contentDescription = null, tint = RecogeYaColors.TextMain)
                    Spacer(Modifier.width(8.dp))
                    Text("Llamar a Recepción", fontWeight = FontWeight.SemiBold)
                }
            }
            TextButton(
                onClick = { showCancelDialog = true },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Cancelar solicitud", color = RecogeYaColors.TextMuted)
            }
        }
    ) {
        Spacer(Modifier.height(4.dp))
        BackLink(onBack)
        Text(
            "Seguimiento de recogida",
            fontWeight = FontWeight.Bold,
            fontSize = dimens.title,
            color = RecogeYaColors.TextMain
        )
        Text(
            combinedChildrenTitle(children),
            color = RecogeYaColors.TextMuted,
            fontSize = 14.sp
        )
        if (tvConnected) {
            Text(
                "Sincronizado con el panel de salida",
                color = RecogeYaColors.Success,
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold
            )
        }

        Spacer(Modifier.height(16.dp))
        AppCard {
            Column(Modifier.padding(dimens.cardPad)) {
                PickupStepper(current = overallStep)
            }
        }

        Spacer(Modifier.height(12.dp))
        children.forEach { child ->
            val childProgress = progress.firstOrNull { it.childId == child.id }
                ?: ChildPickupProgress(child.id, PickupStep.AVISADO, zone = zone)
            ChildTrackingCard(child, childProgress)
            Spacer(Modifier.height(10.dp))
        }

        if (locationSharing || distanceMeters != null || locationEtaMinutes != null) {
            AppCard {
                Column(Modifier.padding(dimens.cardPad)) {
                    Text("Tu ubicación", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Spacer(Modifier.height(4.dp))
                    Text(
                        if (locationSharing) {
                            "Se comparte con el salón solo durante esta recogida."
                        } else {
                            "Ya no se comparte ubicación."
                        },
                        color = RecogeYaColors.TextMuted,
                        fontSize = 13.sp
                    )
                    if (distanceMeters != null) {
                        Spacer(Modifier.height(6.dp))
                        Text(
                            formatDistance(distanceMeters),
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 15.sp
                        )
                    }
                    if (locationEtaMinutes != null) {
                        Spacer(Modifier.height(2.dp))
                        Text(
                            if (locationEtaMinutes == 0) "Estás en la zona de entrega" else "Llegas en ~$locationEtaMinutes min",
                            color = RecogeYaColors.TextMuted,
                            fontSize = 13.sp
                        )
                    } else if (locationSharing) {
                        Spacer(Modifier.height(2.dp))
                        Text("Buscando señal GPS…", color = RecogeYaColors.TextMuted, fontSize = 13.sp)
                    }
                }
            }
            Spacer(Modifier.height(12.dp))
        }

        if (zone.isNotBlank()) {
            AppCard {
                Column(Modifier.padding(dimens.cardPad)) {
                    Text(zoneLabel, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                }
            }
        }
        Spacer(Modifier.height(16.dp))
    }

    if (showCancelDialog) {
        AlertDialog(
            onDismissRequest = { showCancelDialog = false },
            title = { Text("¿Cancelar la recogida?") },
            text = { Text("La escuela dejará de preparar a los alumnos seleccionados.") },
            confirmButton = {
                TextButton(onClick = {
                    showCancelDialog = false
                    onCancel()
                }) { Text("Sí, cancelar") }
            },
            dismissButton = {
                TextButton(onClick = { showCancelDialog = false }) { Text("Seguir") }
            }
        )
    }
}

@Composable
private fun ChildTrackingCard(child: Child, progress: ChildPickupProgress) {
    AppCard {
        Row(
            modifier = Modifier.padding(LocalAppDimens.current.cardPad),
            verticalAlignment = Alignment.CenterVertically
        ) {
            ChildAvatar(size = 42.dp)
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(child.fullName, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Text(child.gradeGroup, color = RecogeYaColors.TextMuted, fontSize = 13.sp)
                Spacer(Modifier.height(4.dp))
                val detail = when (progress.step) {
                    PickupStep.LISTO -> progress.zone?.takeIf { it.isNotBlank() } ?: "Zona de entrega"
                    PickupStep.PREPARANDO -> progress.readyEtaMinutes?.let { "~$it min" } ?: "Preparando"
                    PickupStep.AVISADO -> "Avisado"
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        if (progress.step == PickupStep.LISTO) Icons.Filled.LocationOn else Icons.Filled.Schedule,
                        null,
                        tint = RecogeYaColors.TextMuted,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(Modifier.width(4.dp))
                    Text(detail, color = RecogeYaColors.TextMuted, fontSize = 12.sp)
                }
            }
            when (progress.step) {
                PickupStep.LISTO -> StatusChip("LISTO", RecogeYaColors.SuccessSoft, RecogeYaColors.Success)
                PickupStep.PREPARANDO -> StatusChip("PREPARANDO", RecogeYaColors.WarningSoft, RecogeYaColors.Warning)
                PickupStep.AVISADO -> StatusChip("AVISADO", RecogeYaColors.PrimarySoft, RecogeYaColors.Primary)
            }
        }
    }
}

private fun formatDistance(meters: Int): String {
    if (meters < 1000) return "$meters m de la zona"
    val km = meters / 1000.0
    return "${"%.1f".format(km)} km de la zona"
}

@Preview(showBackground = true, widthDp = 411, heightDp = 891)
@Preview(showBackground = true, widthDp = 320, heightDp = 640)
@Composable
private fun TrackingPreview() {
    RecogeYaTheme {
        TrackingScreen(
            children = emptyList(),
            progress = emptyList(),
            tvConnected = false,
            onArrived = {},
            onCancel = {},
            onBack = {}
        )
    }
}
