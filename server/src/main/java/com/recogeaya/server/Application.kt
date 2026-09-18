package com.recogeaya.server

import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpMethod
import io.ktor.http.HttpStatusCode
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.application.install
import io.ktor.server.engine.embeddedServer
import io.ktor.server.http.content.staticResources
import io.ktor.server.netty.Netty
import io.ktor.server.plugins.calllogging.CallLogging
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation
import io.ktor.server.plugins.cors.routing.CORS
import io.ktor.server.plugins.statuspages.StatusPages
import io.ktor.server.request.receive
import io.ktor.server.request.receiveText
import io.ktor.server.response.respond
import io.ktor.server.response.respondText
import io.ktor.server.routing.delete
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.put
import io.ktor.server.routing.routing
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.Json
import java.nio.file.Path

fun main() {
    RecogeYaDb.open(Path.of("data", "recogeya.db"))
    runBlocking {
        SchoolRoster.restore()
        PickupStore.restore()
    }
    embeddedServer(Netty, port = 8080, host = "0.0.0.0") {
        install(ContentNegotiation) {
            json(
                Json {
                    ignoreUnknownKeys = true
                    encodeDefaults = true
                }
            )
        }
        install(CORS) {
            anyHost()
            allowHeader(HttpHeaders.ContentType)
            allowMethod(HttpMethod.Get)
            allowMethod(HttpMethod.Post)
            allowMethod(HttpMethod.Put)
            allowMethod(HttpMethod.Delete)
            allowMethod(HttpMethod.Options)
        }
        install(CallLogging)
        install(StatusPages) {
            exception<Throwable> { call, cause ->
                call.respondText(
                    """{"error":"${cause.message ?: "error"}"}""",
                    ContentType.Application.Json,
                    HttpStatusCode.InternalServerError
                )
            }
        }

        routing {
            get("/api/state") {
                val screenId = call.request.queryParameters["screenId"]
                call.respond(PickupStore.dashboard(screenId))
            }
            get("/api/tv/pair/{code}") {
                val code = call.parameters["code"].orEmpty()
                val screen = SchoolRoster.screenByCode(code)
                    ?: return@get call.respond(HttpStatusCode.NotFound)
                call.respond(PickupStore.dashboard(screen.id))
            }
            get("/api/tv/screens") {
                call.respond(ScreensResponse(SchoolRoster.screensForPicker()))
            }
            get("/api/tv/{screenId}") {
                val screenId = call.parameters["screenId"]
                call.respond(PickupStore.dashboard(screenId))
            }
            post("/api/school/sync") {
                val body = call.receive<SchoolSyncRequest>()
                SchoolRoster.replace(body)
                call.respond(PickupStore.dashboard(SchoolRoster.defaultScreenId()))
            }
            get("/api/school/admin") {
                val raw = RecogeYaDb.get("admin")
                    ?: return@get call.respond(HttpStatusCode.NoContent)
                call.respondText(raw, ContentType.Application.Json)
            }
            put("/api/school/admin") {
                val body = call.receiveText()
                RecogeYaDb.put("admin", body)
                call.respond(mapOf("ok" to true))
            }
            post("/api/parent/login") {
                val body = call.receive<ParentLoginRequest>()
                val result = SchoolRoster.login(body.email, body.password)
                if (!result.ok) {
                    call.respond(HttpStatusCode.Unauthorized, result)
                    return@post
                }
                call.respond(result)
            }
            get("/api/parent/state") {
                val ids = call.request.queryParameters["ids"].orEmpty()
                    .split(",")
                    .map { it.trim() }
                    .filter { it.isNotEmpty() }
                val pickups = PickupStore.forChildren(ids)
                val meta = SchoolRoster.parentStateMeta(ids)
                call.respond(
                    ParentStateResponse(
                        pickups = pickups,
                        zone = pickups.firstOrNull { it.zone.isNotBlank() }?.zone ?: meta.first,
                        receptionPhone = meta.second,
                        zoneLat = meta.third?.first,
                        zoneLng = meta.third?.second
                    )
                )
            }
            get("/api/pickups/history") {
                call.respond(PickupHistoryResponse(PickupStore.history()))
            }
            post("/api/pickups") {
                val body = call.receive<NotifyPickupRequest>()
                call.respond(PickupStore.notifyPickup(body))
            }
            post("/api/pickups/location") {
                val body = call.receive<LocationUpdateRequest>()
                PickupStore.updateLocation(body)
                call.respond(PickupStore.forChildren(body.childIds))
            }
            post("/api/pickups/{id}/action") {
                val id = call.parameters["id"] ?: return@post call.respond(HttpStatusCode.BadRequest)
                val body = call.receive<ActionRequest>()
                val updated = PickupStore.setAction(id, body.action)
                    ?: return@post call.respond(HttpStatusCode.NotFound)
                call.respond(updated)
            }
            post("/api/pickups/{id}/arrived") {
                val id = call.parameters["id"] ?: return@post call.respond(HttpStatusCode.BadRequest)
                val body = runCatching { call.receive<ArrivedRequest>() }.getOrDefault(ArrivedRequest())
                val updated = PickupStore.setArrived(id, body.arrived, body.etaMinutes)
                    ?: return@post call.respond(HttpStatusCode.NotFound)
                call.respond(updated)
            }
            delete("/api/pickups/{id}") {
                val id = call.parameters["id"] ?: return@delete call.respond(HttpStatusCode.BadRequest)
                PickupStore.cancel(id)
                call.respond(HttpStatusCode.NoContent)
            }
            get("/") {
                val html = javaClass.classLoader.getResource("static/index.html")?.readText()
                    ?: return@get call.respond(HttpStatusCode.NotFound)
                call.respondText(html, ContentType.Text.Html)
            }
            staticResources("/static", "static")
        }
    }.start(wait = true)
}
