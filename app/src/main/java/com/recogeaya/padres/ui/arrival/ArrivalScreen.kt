package com.recogeaya.padres.ui.arrival

import androidx.compose.foundation.background
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
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.recogeaya.padres.data.Child
import com.recogeaya.padres.ui.components.AppCard
import com.recogeaya.padres.ui.components.ChildAvatar
import com.recogeaya.padres.ui.components.RecogeYaBottomScreen
import com.recogeaya.padres.ui.components.StatusChip
import com.recogeaya.padres.ui.theme.LocalAppDimens
import com.recogeaya.padres.ui.theme.RecogeYaColors
import com.recogeaya.padres.ui.theme.RecogeYaTheme

@Composable
fun ArrivalScreen(
    children: List<Child>,
    zone: String,
    onDone: () -> Unit
) {
    val dimens = LocalAppDimens.current
    val zoneLabel = zone.ifBlank { "la zona de entrega" }

    RecogeYaBottomScreen(
        bottomContent = {
            Spacer(Modifier.height(8.dp))
            Button(
                onClick = onDone,
                modifier = Modifier.fillMaxWidth().height(54.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = RecogeYaColors.Primary)
            ) {
                Text("Entendido", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            }
            Spacer(Modifier.height(12.dp))
        }
    ) {
        Spacer(Modifier.height(24.dp))
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = Icons.Filled.Check,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier
                    .size(72.dp)
                    .clip(CircleShape)
                    .background(RecogeYaColors.Success)
                    .padding(16.dp)
            )
            Spacer(Modifier.height(16.dp))
            Text(
                "¡Tus hijos están listos!",
                fontWeight = FontWeight.Bold,
                fontSize = dimens.title,
                textAlign = TextAlign.Center
            )
            Text(
                "Dirígete a $zoneLabel",
                color = RecogeYaColors.TextMuted,
                fontSize = 16.sp
            )
        }

        Spacer(Modifier.height(20.dp))
        children.forEach { child ->
            AppCard {
                Row(
                    modifier = Modifier.padding(dimens.cardPad),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    ChildAvatar(size = 42.dp)
                    Spacer(Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(child.fullName, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Text(child.gradeGroup, color = RecogeYaColors.TextMuted, fontSize = 13.sp)
                    }
                    StatusChip("LISTO", RecogeYaColors.SuccessSoft, RecogeYaColors.Success)
                }
            }
            Spacer(Modifier.height(10.dp))
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .background(RecogeYaColors.SuccessSoft)
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Filled.Shield, null, tint = RecogeYaColors.Success)
            Spacer(Modifier.width(10.dp))
            Text(
                "No se requiere código para madre/padre principal.",
                color = RecogeYaColors.TextMain,
                fontSize = 13.sp,
                fontWeight = FontWeight.Medium
            )
        }

        Spacer(Modifier.height(10.dp))
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .background(RecogeYaColors.InfoSoft)
                .padding(14.dp),
            verticalAlignment = Alignment.Top
        ) {
            Icon(Icons.Filled.DirectionsCar, null, tint = RecogeYaColors.Primary)
            Spacer(Modifier.width(10.dp))
            Text(
                "El personal te recibirá en $zoneLabel.",
                color = RecogeYaColors.TextMain,
                fontSize = 13.sp
            )
        }
        Spacer(Modifier.height(16.dp))
    }
}

@Preview(showBackground = true, widthDp = 411, heightDp = 891)
@Composable
private fun ArrivalPreview() {
    RecogeYaTheme {
        ArrivalScreen(
            children = emptyList(),
            zone = "",
            onDone = {}
        )
    }
}
