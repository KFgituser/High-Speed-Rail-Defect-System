package com.bjtu.raillinebackend.service;

import com.bjtu.raillinebackend.dto.AnalysisImageResponse;
import com.bjtu.raillinebackend.dto.FileItem;
import com.bjtu.raillinebackend.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

@Service
public class NpyAnalysisService {
    private final Path npyDirectory;
    private final Path plotsDirectory;
    private final String pythonExecutable;
    private final String pythonScript;
    private final long processTimeoutMs;

    public NpyAnalysisService(
            @Value("${app.data.npyDir}") String npyDirectory,
            @Value("${app.data.plotsDir}") String plotsDirectory,
            @Value("${app.python.exe}") String pythonExecutable,
            @Value("${app.python.script}") String pythonScript,
            @Value("${app.visualization.process-timeout-ms:300000}") long processTimeoutMs) {
        this.npyDirectory = Path.of(npyDirectory).toAbsolutePath().normalize();
        this.plotsDirectory = Path.of(plotsDirectory).toAbsolutePath().normalize();
        this.pythonExecutable = pythonExecutable;
        this.pythonScript = pythonScript;
        this.processTimeoutMs = processTimeoutMs;
    }

    public List<FileItem> listNpyFiles() {
        if (!Files.isDirectory(npyDirectory)) {
            return List.of();
        }
        try (var files = Files.list(npyDirectory)) {
            return files.filter(Files::isRegularFile)
                    .filter(file -> file.getFileName().toString().toLowerCase(Locale.ROOT).endsWith(".npy"))
                    .sorted(Comparator.comparingLong(this::lastModified).reversed())
                    .map(this::toFileItem)
                    .toList();
        } catch (IOException exception) {
            throw new RuntimeException("Unable to list analysis files", exception);
        }
    }

    public AnalysisImageResponse analyze(String filename) {
        Path inputFile = resolveInputFile(filename);
        String baseName = filename.substring(0, filename.length() - ".npy".length());
        String outputName = baseName + "_" + System.currentTimeMillis() + ".png";
        Path outputFile = plotsDirectory.resolve(outputName).normalize();

        try {
            Files.createDirectories(plotsDirectory);
            ProcessBuilder processBuilder = new ProcessBuilder(
                    pythonExecutable, pythonScript,
                    "--input", inputFile.toString(),
                    "--out", outputFile.toString());
            processBuilder.redirectOutput(ProcessBuilder.Redirect.DISCARD);
            processBuilder.redirectError(ProcessBuilder.Redirect.DISCARD);

            Process process = processBuilder.start();
            boolean completed = process.waitFor(processTimeoutMs, TimeUnit.MILLISECONDS);
            if (!completed) {
                process.destroyForcibly();
                throw new RuntimeException("Analysis timed out");
            }
            if (process.exitValue() != 0 || !Files.isRegularFile(outputFile)) {
                throw new RuntimeException("Analysis did not produce an image");
            }
            return new AnalysisImageResponse("/plots/" + outputName);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Analysis was interrupted", exception);
        } catch (IOException exception) {
            throw new RuntimeException("Unable to run analysis", exception);
        }
    }

    private Path resolveInputFile(String filename) {
        if (filename == null || filename.isBlank()) {
            throw new IllegalArgumentException("filename is required");
        }
        Path suppliedPath = Path.of(filename);
        if (filename.indexOf('\\') >= 0 || filename.indexOf(':') >= 0
                || suppliedPath.isAbsolute() || suppliedPath.getNameCount() != 1
                || !suppliedPath.getFileName().toString().equals(filename)
                || !filename.toLowerCase(Locale.ROOT).endsWith(".npy")) {
            throw new IllegalArgumentException("filename must be a .npy file name");
        }

        try {
            Path dataRoot = npyDirectory.toRealPath();
            Path inputFile = dataRoot.resolve(filename).normalize();
            if (!inputFile.startsWith(dataRoot) || !Files.isRegularFile(inputFile)
                    || !inputFile.toRealPath().startsWith(dataRoot)) {
                throw new ResourceNotFoundException("Analysis file", filename);
            }
            return inputFile;
        } catch (IOException exception) {
            throw new ResourceNotFoundException("Analysis file", filename);
        }
    }

    private FileItem toFileItem(Path file) {
        FileItem item = new FileItem();
        String fileName = file.getFileName().toString();
        item.setName(fileName);
        try {
            item.setSize(Files.size(file));
            item.setLastModified(Files.getLastModifiedTime(file).toMillis());
        } catch (IOException exception) {
            throw new RuntimeException("Unable to read analysis file metadata", exception);
        }
        item.setThumbUrl("/thumbs/" + fileName.substring(0, fileName.length() - ".npy".length()) + ".png");
        return item;
    }

    private long lastModified(Path file) {
        try {
            return Files.getLastModifiedTime(file).toMillis();
        } catch (IOException exception) {
            return Long.MIN_VALUE;
        }
    }
}
