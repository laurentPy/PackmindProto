// src/test/java/com/example/ArchRules.java
package com.example;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.lang.ArchRule;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import org.junit.jupiter.api.Test;

public class ArchRules {

    @Test
    void ui_should_not_access_core() {
        JavaClasses imported = new ClassFileImporter()
                               .importPackages("com.example");
        ArchRule rule = noClasses()
            .that().resideInAPackage("..ui..")
            .should().accessClassesThat().resideInAPackage("..core..")
            .because("UI must talk to core via API layer");
        rule.check(imported);
    }
}
