package com.recogeaya.padres

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.recogeaya.padres.ui.ParentPickupViewModel
import com.recogeaya.padres.ui.arrival.ArrivalScreen
import com.recogeaya.padres.ui.home.HomeScreen
import com.recogeaya.padres.ui.login.LoginScreen
import com.recogeaya.padres.ui.responsible.ResponsiblePickerScreen
import com.recogeaya.padres.ui.select.SelectChildrenScreen
import com.recogeaya.padres.ui.temporary.TemporaryVerificationScreen
import com.recogeaya.padres.ui.theme.RecogeYaTheme
import com.recogeaya.padres.ui.tracking.TrackingScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setContent {
            RecogeYaTheme {
                RecogeYaApp(modifier = Modifier.fillMaxSize())
            }
        }
    }
}

private object Routes {
    const val Login = "login"
    const val Home = "home"
    const val Select = "select"
    const val Responsible = "responsible"
    const val Tracking = "tracking"
    const val Arrival = "arrival"
    const val Temporary = "temporary"
}

@Composable
fun RecogeYaApp(
    modifier: Modifier = Modifier,
    viewModel: ParentPickupViewModel = viewModel()
) {
    val navController = rememberNavController()
    val ui by viewModel.ui.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { grants ->
        val granted = grants[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
            grants[Manifest.permission.ACCESS_COARSE_LOCATION] == true
        viewModel.startPickup(shareIfPossible = granted)
        goAfterNotify(navController, viewModel)
    }

    LaunchedEffect(ui.loggedIn) {
        if (ui.loggedIn) {
            navController.navigate(Routes.Home) {
                popUpTo(Routes.Login) { inclusive = true }
            }
        } else {
            navController.navigate(Routes.Login) {
                popUpTo(0) { inclusive = true }
            }
        }
    }

    NavHost(
        navController = navController,
        startDestination = Routes.Login,
        modifier = modifier
    ) {
        composable(Routes.Login) {
            LoginScreen(
                error = ui.loginError,
                onLogin = { email, password -> viewModel.login(email, password) }
            )
        }
        composable(Routes.Home) {
            HomeScreen(
                parent = viewModel.parent,
                childrenBySchool = viewModel.childrenBySchool(),
                selectedIds = ui.selectedIds,
                activities = viewModel.activities,
                onToggleChild = viewModel::toggleChild,
                onPickupClick = { navController.navigate(Routes.Select) },
                onLogout = viewModel::logout
            )
        }
        composable(Routes.Select) {
            SelectChildrenScreen(
                responsible = viewModel.currentResponsible(),
                children = viewModel.children,
                selectedIds = ui.selectedIds,
                shareLocation = ui.shareLocation,
                onShareLocationChange = viewModel::setShareLocation,
                onToggleChild = viewModel::toggleChild,
                onNotify = {
                    if (!ui.shareLocation) {
                        viewModel.startPickup(shareIfPossible = false)
                        goAfterNotify(navController, viewModel)
                    } else {
                        val fine = ContextCompat.checkSelfPermission(
                            context,
                            Manifest.permission.ACCESS_FINE_LOCATION
                        ) == PackageManager.PERMISSION_GRANTED
                        val coarse = ContextCompat.checkSelfPermission(
                            context,
                            Manifest.permission.ACCESS_COARSE_LOCATION
                        ) == PackageManager.PERMISSION_GRANTED
                        if (fine || coarse) {
                            viewModel.startPickup(shareIfPossible = true)
                            goAfterNotify(navController, viewModel)
                        } else {
                            val permissions = buildList {
                                add(Manifest.permission.ACCESS_FINE_LOCATION)
                                add(Manifest.permission.ACCESS_COARSE_LOCATION)
                                if (Build.VERSION.SDK_INT >= 33) {
                                    add(Manifest.permission.POST_NOTIFICATIONS)
                                }
                            }
                            permissionLauncher.launch(permissions.toTypedArray())
                        }
                    }
                },
                onBack = { navController.popBackStack() },
                onEditResponsible = {
                    viewModel.beginEditResponsible()
                    navController.navigate(Routes.Responsible)
                }
            )
        }
        composable(Routes.Responsible) {
            ResponsiblePickerScreen(
                selectedChildren = viewModel.selectedChildren().ifEmpty { viewModel.children },
                people = viewModel.allResponsibles(),
                selectedId = ui.draftResponsibleId,
                onSelect = viewModel::selectDraftResponsible,
                onAddTemporary = viewModel::addTemporaryResponsible,
                onSave = {
                    viewModel.saveResponsible()
                    navController.popBackStack()
                },
                onBack = { navController.popBackStack() }
            )
        }
        composable(Routes.Tracking) {
            TrackingScreen(
                children = viewModel.selectedChildren(),
                progress = ui.progress,
                tvConnected = ui.tvConnected,
                receptionPhone = ui.receptionPhone,
                locationSharing = ui.locationSharing,
                distanceMeters = ui.distanceMeters,
                locationEtaMinutes = ui.locationEtaMinutes,
                onArrived = {
                    viewModel.markAllReady()
                    val destination = if (viewModel.currentResponsible().isTemporary) {
                        Routes.Temporary
                    } else {
                        Routes.Arrival
                    }
                    navController.navigate(destination)
                },
                onCancel = {
                    viewModel.cancelPickup()
                    navController.popBackStack(Routes.Home, inclusive = false)
                },
                onBack = { navController.popBackStack() }
            )
        }
        composable(Routes.Arrival) {
            ArrivalScreen(
                children = viewModel.selectedChildren(),
                zone = viewModel.pickupZone(),
                onDone = {
                    viewModel.cancelPickup()
                    navController.popBackStack(Routes.Home, inclusive = false)
                }
            )
        }
        composable(Routes.Temporary) {
            TemporaryVerificationScreen(
                children = viewModel.selectedChildren(),
                responsible = viewModel.currentResponsible(),
                code = ui.verificationCode,
                shareMessage = viewModel.shareMessage(),
                onChangeResponsible = {
                    viewModel.beginEditResponsible()
                    navController.navigate(Routes.Responsible)
                },
                onContinueTracking = {
                    navController.navigate(Routes.Tracking)
                },
                onDone = {
                    viewModel.cancelPickup()
                    navController.popBackStack(Routes.Home, inclusive = false)
                },
                onBack = { navController.popBackStack() }
            )
        }
    }
}

private fun goAfterNotify(navController: NavHostController, viewModel: ParentPickupViewModel) {
    val destination = if (viewModel.currentResponsible().isTemporary) {
        Routes.Temporary
    } else {
        Routes.Tracking
    }
    navController.navigate(destination) {
        popUpTo(Routes.Home)
    }
}
