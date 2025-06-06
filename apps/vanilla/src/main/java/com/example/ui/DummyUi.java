// src/main/java/com/example/ui/DummyUi.java
package com.example.ui;

import com.example.core.CoreService;    // <-- forbidden import (will fail)

public class DummyUi {
    private final CoreService svc = new CoreService();
}
