package com.example.course_platform;

import io.gatling.javaapi.core.*;
import io.gatling.javaapi.http.*;

import java.time.Duration;

import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;

public class MixedSimulation extends Simulation {

    HttpProtocolBuilder httpProtocol = http
            .baseUrl("http://localhost:8080")
            .acceptHeader("application/json");

    ChainBuilder guestFlow = exec(
            http("GET /courses/preview")
                    .get("/courses/preview")
                    .check(status().is(200))
    )
            .pause(1)
            .exec(
                    http("GET /courses/3/full")
                            .get("/courses/3/full")
                            .check(status().is(200))
            );

    ChainBuilder studentFlow = exec(
            http("Login Student")
                    .post("/auth/login")
                    .body(StringBody("{\"email\":\"student@test.com\",\"password\":\"123\"}"))
                    .asJson()
                    .check(status().is(200))
                    .check(jsonPath("$.token").saveAs("token"))
    )
            .pause(1)
            .exec(
                    http("GET /users/my-courses")
                            .get("/users/my-courses")
                            .header("Authorization", "Bearer ${token}")
                            .check(status().is(200))
            )
            .pause(1)
            .exec(
                    http("GET /courses/3/lessons")
                            .get("/courses/3/lessons")
                            .header("Authorization", "Bearer ${token}")
                            .check(status().is(200))
            );

    ChainBuilder teacherFlow = exec(
            http("Login Teacher")
                    .post("/auth/login")
                    .body(StringBody("{\"email\":\"teacher@test.com\",\"password\":\"123\"}"))
                    .asJson()
                    .check(status().is(200))
                    .check(jsonPath("$.token").saveAs("token"))
    )
            .pause(1)
            .exec(
                    http("GET /submissions/pending")
                            .get("/submissions/pending")
                            .header("Authorization", "Bearer ${token}")
                            .check(status().is(200))
            );

    ChainBuilder adminFlow = exec(
            http("Login Admin")
                    .post("/auth/login")
                    .body(StringBody("{\"email\":\"admin@test.com\",\"password\":\"123\"}"))
                    .asJson()
                    .check(status().is(200))
                    .check(jsonPath("$.token").saveAs("token"))
    )
            .pause(1)
            .exec(
                    http("GET /admin/users")
                            .get("/admin/users")
                            .header("Authorization", "Bearer ${token}")
                            .check(status().is(200))
            );

    {
        setUp(
                scenario("Guest").exec(guestFlow).injectOpen(
                        rampUsers(200).during(Duration.ofSeconds(30)),
                        constantUsersPerSec(50).during(Duration.ofMinutes(2))
                ),
                scenario("Student").exec(studentFlow).injectOpen(
                        rampUsers(80).during(Duration.ofSeconds(30)),
                        constantUsersPerSec(15).during(Duration.ofMinutes(2))
                ),
                scenario("Teacher").exec(teacherFlow).injectOpen(
                        rampUsers(30).during(Duration.ofSeconds(30)),
                        constantUsersPerSec(5).during(Duration.ofMinutes(2))
                ),
                scenario("Admin").exec(adminFlow).injectOpen(
                        rampUsers(10).during(Duration.ofSeconds(30))
                )
        ).protocols(httpProtocol);
    }
}
