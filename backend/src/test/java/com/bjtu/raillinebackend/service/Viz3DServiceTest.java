package com.bjtu.raillinebackend.service;

import com.bjtu.raillinebackend.dto.Viz3DStartRequest;
import com.bjtu.raillinebackend.repository.VizSlotRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.task.AsyncTaskExecutor;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;

class Viz3DServiceTest {
    @TempDir
    Path directory;

    private Viz3DService service;

    @AfterEach
    void shutdown() {
        if (service != null) service.shutdownTimeoutScheduler();
    }

    @Test
    void waitsForExecutorBeforeCreatingFilesAndRetainsFailureStatus() {
        AtomicReference<Runnable> queued = new AtomicReference<>();
        AsyncTaskExecutor executor = mock(AsyncTaskExecutor.class);
        doAnswer(invocation -> {
            queued.set(invocation.getArgument(0));
            return null;
        }).when(executor).execute(any(Runnable.class));
        service = new Viz3DService(mock(VizSlotRepository.class), executor);
        ReflectionTestUtils.setField(service, "out3dRoot", directory.resolve("runs").toString());
        ReflectionTestUtils.setField(service, "artifacts2dDir", directory.resolve("missing-data").toString());
        ReflectionTestUtils.setField(service, "maxBufferedLogLines", 10);

        Viz3DStartRequest request = new Viz3DStartRequest();
        request.setSlotId(1);
        String runUuid = service.start3D(request);

        assertNotNull(queued.get());
        assertEquals("queued", service.getStatus(runUuid).status());
        assertFalse(Files.exists(directory.resolve("runs")));
        assertThrows(IllegalStateException.class, () -> service.start3D(request));

        queued.get().run();
        assertEquals("error", service.getStatus(runUuid).status());
        assertNotNull(service.openStream(runUuid));
    }
}
