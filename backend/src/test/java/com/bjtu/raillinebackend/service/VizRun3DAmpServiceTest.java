package com.bjtu.raillinebackend.service;

import com.bjtu.raillinebackend.repository.VizSlotRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.task.AsyncTaskExecutor;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Path;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;

class VizRun3DAmpServiceTest {
    @TempDir
    Path directory;

    private VizRun3DAmpService service;

    @AfterEach
    void shutdown() {
        if (service != null) service.shutdownTimeoutScheduler();
    }

    @Test
    void failedJobRemainsQueryableAndReleasesItsSlot() {
        AtomicReference<Runnable> queued = new AtomicReference<>();
        AsyncTaskExecutor executor = mock(AsyncTaskExecutor.class);
        doAnswer(invocation -> {
            queued.set(invocation.getArgument(0));
            return null;
        }).when(executor).execute(any(Runnable.class));
        doAnswer(invocation -> {
            queued.set(invocation.getArgument(0));
            return null;
        }).when(executor).submit(any(Runnable.class));
        service = new VizRun3DAmpService(mock(VizSlotRepository.class), executor);
        ReflectionTestUtils.setField(service, "baseOutDir", directory.resolve("output").toString());
        ReflectionTestUtils.setField(service, "source2dDir", directory.resolve("missing-data").toString());
        ReflectionTestUtils.setField(service, "maxBufferedLogLines", 10);

        String runUuid = service.start(1, "zh");
        assertEquals("queued", service.status(runUuid).status());
        assertThrows(IllegalStateException.class, () -> service.start(1, "zh"));

        queued.get().run();
        assertEquals("error", service.status(runUuid).status());
        service.start(1, "zh");
    }
}
