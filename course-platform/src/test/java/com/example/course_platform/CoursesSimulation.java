package com.example.course_platform;

import io.gatling.javaapi.core.*;
import io.gatling.javaapi.http.*;

import java.time.Duration;

import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;

public class CoursesSimulation extends Simulation {

    HttpProtocolBuilder httpProtocol = http
            .baseUrl("http://localhost:8080")
            .acceptHeader("application/json");

    // Просмотр курсов гостем
    ChainBuilder getCoursesPreview = exec(
            http("GET /courses/preview")
                    .get("/courses/preview")
                    .check(status().is(200))
                    .check(jsonPath("$[*].id").exists())
    );

    // Просмотр полной информации о курсе
    ChainBuilder getCourseFull = exec(
            http("GET /courses/3/full")
                    .get("/courses/3/full")
                    .check(status().is(200))
    );

    // Логин для авторизованного просмотра
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

    // Просмотр курса с авторизацией
    ChainBuilder getCourseWithAuth = exec(login)
            .pause(1)
            .exec(
                    http("GET /courses/3")
                            .get("/courses/3")
                            .header("Authorization", "Bearer ${token}")
                            .check(status().is(200))
            );

    PopulationBuilder previewPopulation = scenario("Get Courses Preview")
            .exec(getCoursesPreview)
            .injectOpen(
                    rampUsers(200).during(Duration.ofSeconds(30)),
                    constantUsersPerSec(50).during(Duration.ofMinutes(2))
            );

    PopulationBuilder fullPopulation = scenario("Get Course Full")
            .exec(getCourseFull)
            .injectOpen(
                    rampUsers(100).during(Duration.ofSeconds(30)),
                    constantUsersPerSec(20).during(Duration.ofMinutes(1))
            );

    PopulationBuilder authPopulation = scenario("Get Course With Auth")
            .exec(getCourseWithAuth)
            .injectOpen(
                    rampUsers(50).during(Duration.ofSeconds(30))
            );

    {
        setUp(
                previewPopulation,
                fullPopulation,
                authPopulation
        ).protocols(httpProtocol);
    }
}
