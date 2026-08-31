package com.recogeaya.tv

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.recogeaya.tv.ui.TvDashboardScreen
import com.recogeaya.tv.ui.TvTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setContent {
            TvTheme {
                val vm: TvViewModel = viewModel()
                TvDashboardScreen(viewModel = vm, modifier = Modifier.fillMaxSize())
            }
        }
    }
}
