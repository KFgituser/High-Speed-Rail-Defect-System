package com.bjtu.raillinebackend.service;

import com.bjtu.raillinebackend.dto.FileItem;
import com.bjtu.raillinebackend.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.FileTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class NpyAnalysisServiceTest {

    @TempDir
    Path npyDirectory;

    @Test
    void listsOnlyNpyFilesInNewestFirstOrder() throws Exception {
        Path oldFile = Files.writeString(npyDirectory.resolve("old.npy"), "old");
        Path newFile = Files.writeString(npyDirectory.resolve("new.NPY"), "newer");
        Files.writeString(npyDirectory.resolve("ignore.txt"), "ignore");
        Files.setLastModifiedTime(oldFile, FileTime.fromMillis(1_000));
        Files.setLastModifiedTime(newFile, FileTime.fromMillis(2_000));

        NpyAnalysisService service = new NpyAnalysisService(
                npyDirectory.toString(), npyDirectory.resolve("plots").toString(), "python", "script.py", 1_000);
        List<FileItem> files = service.listNpyFiles();

        assertEquals(List.of("new.NPY", "old.npy"), files.stream().map(FileItem::getName).toList());
        assertEquals(5L, files.get(0).getSize());
    }

    @Test
    void rejectsTraversalAndNonNpyFilenamesBeforeRunningPython() {
        NpyAnalysisService service = new NpyAnalysisService(
                npyDirectory.toString(), npyDirectory.resolve("plots").toString(), "python", "script.py", 1_000);

        assertThrows(IllegalArgumentException.class, () -> service.analyze("../secret.npy"));
        assertThrows(IllegalArgumentException.class, () -> service.analyze("C:\\secret.npy"));
        assertThrows(IllegalArgumentException.class, () -> service.analyze("not-npy.txt"));
    }

    @Test
    void reportsMissingNpyFileClearly() {
        NpyAnalysisService service = new NpyAnalysisService(
                npyDirectory.toString(), npyDirectory.resolve("plots").toString(), "python", "script.py", 1_000);

        assertThrows(ResourceNotFoundException.class, () -> service.analyze("missing.npy"));
    }
}
