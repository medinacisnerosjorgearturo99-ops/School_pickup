package com.recogeaya.padres.ui.temporary

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
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.recogeaya.padres.data.Child
import com.recogeaya.padres.data.ResponsibleKind
import com.recogeaya.padres.data.ResponsiblePerson
import com.recogeaya.padres.ui.components.AppCard
import com.recogeaya.padres.ui.components.BackLink
import com.recogeaya.padres.ui.components.ChildAvatar
import com.recogeaya.padres.ui.components.RecogeYaBottomScreen
import com.recogeaya.padres.ui.components.SoftInitialsAvatar
import com.recogeaya.padres.ui.theme.LocalAppDimens
import com.recogeaya.padres.ui.theme.RecogeYaColors
import com.recogeaya.padres.ui.theme.RecogeYaTheme

@Composable
fun TemporaryVerificationScreen(
    children: List<Child>,
    responsible: ResponsiblePerson,
    code: String,
    shareMessage: String,
    onChangeResponsible: () -> Unit,
    onContinueTracking: () -> Unit,
    onDone: () -> Unit,
    onBack: () -> Unit
) {
    val dimens = LocalAppDimens.current
    val context = LocalContext.current

    RecogeYaBottomScreen(
        bottomContent = {
            Spacer(Modifier.height(8.dp))
            OutlinedButton(
                onClick = {
                    val intent = android.content.Intent(android.content.Intent.ACTION_SEND).apply {
                        type = "text/plain"
                        putExtra(android.content.Intent.EXTRA_TEXT, shareMessage)
                    }
                    context.startActivity(android.content.Intent.createChooser(intent, "Compartir código"))
                },
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(16.dp)
            ) {
                Icon(Icons.Filled.Share, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text("Compartir código", fontWeight = FontWeight.Bold)
            }
            Spacer(Modifier.height(8.dp))
            Button(
                onClick = onContinueTracking,
                modifier = Modifier.fillMaxWidth().height(54.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = RecogeYaColors.Primary)
            ) {
                Text("Ver seguimiento", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            }
            TextButton(onClick = onDone, modifier = Modifier.fillMaxWidth()) {
                Text("Listo", color = RecogeYaColors.TextMuted)
            }
        }
    ) {
        Spacer(Modifier.height(4.dp))
        BackLink(onBack)
        Text(
            "Responsable temporal",
            fontWeight = FontWeight.Bold,
            fontSize = dimens.title,
            color = RecogeYaColors.TextMain
        )
        Spacer(Modifier.height(12.dp))

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .background(RecogeYaColors.WarningBanner)
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Filled.CheckCircle, null, tint = RecogeYaColors.Warning)
            Spacer(Modifier.width(10.dp))
            Text(
                "Responsable temporal autorizado",
                fontWeight = FontWeight.SemiBold,
                fontSize = 14.sp
            )
        }

        Spacer(Modifier.height(16.dp))
        Text("Alumno a recoger", fontWeight = FontWeight.Bold, fontSize = 16.sp)
        Spacer(Modifier.height(8.dp))
        children.forEach { child ->
            AppCard {
                Row(
                    modifier = Modifier.padding(dimens.cardPad),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    ChildAvatar(size = 42.dp)
                    Spacer(Modifier.width(12.dp))
                    Column {
                        Text(child.fullName, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Text(child.gradeGroup, color = RecogeYaColors.TextMuted, fontSize = 13.sp)
                    }
                }
            }
            Spacer(Modifier.height(8.dp))
        }

        Text("Quién recogerá", fontWeight = FontWeight.Bold, fontSize = 16.sp)
        Spacer(Modifier.height(8.dp))
        AppCard {
            Row(
                modifier = Modifier.padding(dimens.cardPad),
                verticalAlignment = Alignment.CenterVertically
            ) {
                SoftInitialsAvatar(responsible.initials)
                Spacer(Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(responsible.name, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Text(responsible.relation, color = RecogeYaColors.TextMuted, fontSize = 13.sp)
                }
                TextButton(onClick = onChangeResponsible) {
                    Text("Cambiar", color = RecogeYaColors.Primary, fontWeight = FontWeight.SemiBold)
                }
            }
        }

        Spacer(Modifier.height(16.dp))
        Text("Verificación temporal", fontWeight = FontWeight.Bold, fontSize = 16.sp)
        Text(
            "Esta persona no necesita la app. Pásale el código por mensaje o muéstralo en la escuela.",
            color = RecogeYaColors.TextMuted,
            fontSize = 13.sp
        )
        Spacer(Modifier.height(10.dp))
        AppCard {
            Row(
                modifier = Modifier.padding(dimens.cardPad),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("CÓDIGO", color = RecogeYaColors.TextMuted, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    Text(
                        code,
                        fontWeight = FontWeight.Bold,
                        fontSize = 40.sp,
                        color = RecogeYaColors.Primary,
                        letterSpacing = 4.sp
                    )
                    Text("Válido para esta salida", color = RecogeYaColors.TextMuted, fontSize = 12.sp)
                }
            }
        }

        Spacer(Modifier.height(12.dp))
        Row(verticalAlignment = Alignment.Top) {
            Icon(Icons.Filled.Info, null, tint = RecogeYaColors.TextMuted, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(8.dp))
            Text(
                "El salón verá este código en la TV. Quien recoja solo tiene que mostrarlo.",
                color = RecogeYaColors.TextMuted,
                fontSize = 12.sp
            )
        }
        Spacer(Modifier.height(16.dp))
    }
}

@Preview(showBackground = true, widthDp = 411, heightDp = 891)
@Preview(showBackground = true, widthDp = 320, heightDp = 640)
@Composable
private fun TemporaryPreview() {
    RecogeYaTheme {
        TemporaryVerificationScreen(
            children = emptyList(),
            responsible = ResponsiblePerson(
                id = "",
                name = "Responsable temporal",
                initials = "RT",
                relation = "Autorizado",
                kind = ResponsibleKind.TEMPORARY
            ),
            code = "0000",
            shareMessage = "Código 0000",
            onChangeResponsible = {},
            onContinueTracking = {},
            onDone = {},
            onBack = {}
        )
    }
}
