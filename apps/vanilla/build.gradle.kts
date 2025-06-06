plugins {
    id("java")
}

repositories {
    mavenCentral()
}

dependencies {
    // Use the JUnit API for writing tests
    testImplementation("org.junit.jupiter:junit-jupiter-api:5.10.0")
    // At runtime, load the matching JUnit engine
    testRuntimeOnly("org.junit.jupiter:junit-jupiter-engine:5.10.0")
    // ArchUnit JUnit5 integration (1.2.x or later)
    testImplementation("com.tngtech.archunit:archunit-junit5:1.2.0")
}

tasks.test {
    // Tell Gradle to use the JUnit Platform (Jupiter)
    useJUnitPlatform()
}
