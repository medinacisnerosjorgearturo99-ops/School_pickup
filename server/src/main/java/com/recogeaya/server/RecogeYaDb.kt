package com.recogeaya.server

import kotlinx.serialization.json.Json
import java.nio.file.Files
import java.nio.file.Path
import java.sql.Connection
import java.sql.DriverManager

object RecogeYaDb {
    val json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
    }

    private val lock = Any()
    private var connection: Connection? = null

    fun open(path: Path = Path.of("data", "recogeya.db")) {
        synchronized(lock) {
            Files.createDirectories(path.parent)
            val db = DriverManager.getConnection("jdbc:sqlite:${path.toAbsolutePath()}")
            db.createStatement().use { statement ->
                statement.execute("PRAGMA journal_mode=WAL")
                statement.execute("CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL)")
            }
            connection = db
        }
    }

    fun put(key: String, value: String) {
        synchronized(lock) {
            val db = connection ?: return
            db.prepareStatement("INSERT INTO kv(k, v) VALUES(?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v").use { statement ->
                statement.setString(1, key)
                statement.setString(2, value)
                statement.executeUpdate()
            }
        }
    }

    fun get(key: String): String? {
        synchronized(lock) {
            val db = connection ?: return null
            db.prepareStatement("SELECT v FROM kv WHERE k = ?").use { statement ->
                statement.setString(1, key)
                statement.executeQuery().use { rows ->
                    return if (rows.next()) rows.getString(1) else null
                }
            }
        }
    }
}
