package com.example.course_platform;

import io.gatling.javaapi.core.*;
import io.gatling.javaapi.http.*;

import java.time.Duration;

import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;

public class LessonsSimulation extends Simulation {

    HttpProtocolBuilder httpProtocol = http
            .baseUrl("http://localhost:8080")
            .acceptHeader("application/json");

    ChainBuilder login = exec(
            http("POST /auth/login")
                    .post("/auth/login")
                    .body(StringBody("{\n" +
                            "  \"email\": \"student@test.com\",\n" +
                            "  \"password\": \"123\"\n" +
                            "}"))
                    .asJson()
                    .check(status().is(200))
                    .check(jsonPath("$.token").saveAs("token"))
    );

    ChainBuilder getLessonsByCourse = exec(login)
            .pause(1)
            .exec(
                    http("GET /courses/3/lessons")
                            .get("/courses/3/lessons")
                            .header("Authorization", "Bearer ${token}")
                            .check(status().is(200))
            );

    ChainBuilder getLessonById = exec(login)
            .pause(1)
            .exec(
                    http("GET /courses/3/lessons/1")
                            .get("/courses/3/lessons/1")
                            .header("Authorization", "Bearer ${token}")
                            .check(status().is(200))
            );

    PopulationBuilder lessonsPopulation = scenario("Get Lessons By Course")
            .exec(getLessonsByCourse)
            .injectOpen(
                    rampUsers(100).during(Duration.ofSeconds(30)),
                    constantUsersPerSec(20).during(Duration.ofMinutes(1))
            );

    PopulationBuilder lessonPopulation = scenario("Get Lesson By Id")
            .exec(getLessonById)
            .injectOpen(
                    rampUsers(80).during(Duration.ofSeconds(30)),
                    constantUsersPerSec(15).during(Duration.ofMinutes(1))
            );

    {
        setUp(
                lessonsPopulation,
                lessonPopulation
        ).protocols(httpProtocol);
    }
}
