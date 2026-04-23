package com.example.course_platform;

import io.gatling.javaapi.core.*;
import io.gatling.javaapi.http.*;
import java.time.Duration;
import java.util.UUID;

import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;

public class AuthSimulation extends Simulation {

    HttpProtocolBuilder httpProtocol = http
            .baseUrl("http://localhost:8080")
            .header("Content-Type", "application/json")
            .acceptHeader("application/json");

    ChainBuilder register = exec(
            http("POST /auth/register")
                    .post("/auth/register")
                    .body(StringBody(session -> {
                        String email = "user_" + System.currentTimeMillis() + "_" + UUID.randomUUID() + "@test.com";
                        return String.format("{\"email\":\"%s\",\"password\":\"123456\",\"fullName\":\"Load Test User\",\"role\":\"STUDENT\"}", email);
                    }))
                    .asJson()
                    .check(status().is(200))
    ).pause(1);

    {
        setUp(
                scenario("Register User").exec(register)
                        .injectOpen(
                                rampUsers(30).during(Duration.ofSeconds(30)),
                                constantUsersPerSec(5).during(Duration.ofMinutes(1))
                        )
        ).protocols(httpProtocol);
    }
}