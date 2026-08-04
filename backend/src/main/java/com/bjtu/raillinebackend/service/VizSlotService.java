package com.bjtu.raillinebackend.service;

import com.bjtu.raillinebackend.entity.Viz2DSlot;
import com.bjtu.raillinebackend.repository.VizSlotRepository;
import org.springframework.stereotype.Service;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Comparator;
import java.util.List;

import lombok.extern.slf4j.Slf4j;

/*
* 槽位快照入库
* */

@Slf4j
@Service
public class VizSlotService {
    private final VizSlotRepository repo;

    // 根目录（与上面的静态映射一致）
    private static final Path VIZ_OUT_DIR = Paths.get("C:/Users/Administrator/Desktop/高铁DAS/JH_Codebase王舒伦/output");
    private static final Path SNAP_DIR    = VIZ_OUT_DIR.resolve("snapshots");

    public VizSlotService(VizSlotRepository repo) { this.repo = repo; }

    public List<Viz2DSlot> getAll() { return repo.findAllByOrderBySlotIdAsc(); }

    public Viz2DSlot updateSlot(Integer slotId, Viz2DSlot slot) {
        slot.setSlotId(slotId);

        // 如果前端传的是“当前产物”路径，则自动做一次快照，避免四槽位都指向同一文件
        String path = slot.getImagePath();
        if (path != null && path.endsWith("/viz2d.png")) {
            try {
                snapshotFiles(slotId);                     // ⬅ 复用快照逻辑
                // 将 imagePath 覆盖成快照文件的公共URL
                String fname = latestSnapshotPngNameFor(slotId);
                if (fname != null) {
                    slot.setImagePath("/viz-out/snapshots/" + fname);
                }
            } catch (IOException e) {
                log.error("Failed to copy viz2d.png for slot {}: {}", slotId, e.getMessage(), e);
            }
        }

        return repo.save(slot);   // upsert
    }

    public void clearSlot(Integer slotId) { repo.deleteById(slotId); }

    /** 新增：显式“把当前结果快照到槽位”并回填时间/区间等字段 */
    public Viz2DSlot snapshotCurrent2dToSlot(int slotId) throws IOException {
        Files.createDirectories(SNAP_DIR);
        // 1) 复制三个产物
        SnapshotResult r = snapshotFiles(slotId);

        // 2) 解析 meta/defects，生成显示用字段
        String startLabel = readMetaLabel(r.metaPath, "start_label");
        String endLabel   = readMetaLabel(r.metaPath, "end_label");
        String dateStr    = extractLatestDatetime(r.defectsPath);

        // 3) 保存到数据库
        Viz2DSlot entity = repo.findBySlotId(slotId).orElseGet(() -> {
            Viz2DSlot v = new Viz2DSlot();
            v.setSlotId(slotId);
            return v;
        });

        entity.setImagePath("/viz-out/snapshots/" + r.pngPath.getFileName()); // 供前端访问的相对URL
        entity.setDateStr(dateStr);
        entity.setStartLabel(startLabel);
        entity.setEndLabel(endLabel);

        return repo.save(entity);
    }

    /* ---------- 私有辅助 ---------- */

    private static class SnapshotResult {
        Path pngPath;
        Path metaPath;
        Path defectsPath;
    }

    /** 实际的文件复制（png + meta + defects） */
    private SnapshotResult snapshotFiles(int slotId) throws IOException {
        Path srcPng  = VIZ_OUT_DIR.resolve("viz2d.png");
        Path srcMeta = VIZ_OUT_DIR.resolve("viz2d_meta.json");
        Path srcDef  = VIZ_OUT_DIR.resolve("defects.json");
        Path slotDataDir = VIZ_OUT_DIR.resolve("slot" + slotId);

        if (!Files.exists(srcPng)) {
            throw new FileNotFoundException("viz2d.png not found: " + srcPng);
        }

        Files.createDirectories(slotDataDir);

        String ts = new java.text.SimpleDateFormat("yyyyMMdd-HHmmss").format(new java.util.Date());
        String base = "slot" + slotId + "-" + ts;

        Path dstPng  = SNAP_DIR.resolve(base + ".png");
        Path dstMeta = SNAP_DIR.resolve(base + "_meta.json");
        Path dstDef  = SNAP_DIR.resolve(base + "_defects.json");

        Files.copy(srcPng,  dstPng,  StandardCopyOption.REPLACE_EXISTING);
        safeCopy(srcMeta, dstMeta);
        safeCopy(srcDef,  dstDef);

        copy2dDataFor3d(slotDataDir);

        SnapshotResult r = new SnapshotResult();
        r.pngPath    = dstPng;
        r.metaPath   = dstMeta;
        r.defectsPath= dstDef;
        return r;
    }

    private String latestSnapshotPngNameFor(int slotId) throws IOException {
        if (!Files.exists(SNAP_DIR)) return null;
        try (var s = Files.list(SNAP_DIR)) {
            return s.filter(p -> p.getFileName().toString().startsWith("slot"+slotId+"-") &&
                            p.getFileName().toString().endsWith(".png"))
                    .max(Comparator.comparing(Path::getFileName))
                    .map(p -> p.getFileName().toString())
                    .orElse(null);
        }
    }

    private void safeCopy(Path src, Path dst) {
        try { if (src != null && Files.exists(src)) {
            Files.copy(src, dst, StandardCopyOption.REPLACE_EXISTING);
        }} catch (IOException ignore) {}
    }

    private void copy2dDataFor3d(Path slotDataDir) throws IOException {
        String[] artifactNames = {
                "amps_stack.npy",
                "x_labels.npy",
                "total_time_seconds.npy",
                "y_ticks_like_2d.npy",
                "defects.json",
                "viz2d_meta.json"
        };

        for (String name : artifactNames) {
            Path src = VIZ_OUT_DIR.resolve(name);
            if (Files.exists(src)) {
                Files.copy(src, slotDataDir.resolve(name), StandardCopyOption.REPLACE_EXISTING);
            }
        }
    }

    private String readMetaLabel(Path metaJson, String key) {
        try {
            if (metaJson == null || !Files.exists(metaJson)) return null;
            var mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            var node = mapper.readTree(metaJson.toFile());
            return node.hasNonNull(key) ? node.get(key).asText() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private String extractLatestDatetime(Path defectsJson) {
        try {
            if (defectsJson == null || !Files.exists(defectsJson)) return null;
            var mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            var arr = mapper.readTree(defectsJson.toFile());
            long max = Long.MIN_VALUE; String latest = null;
            if (arr.isArray()) {
                for (var n : arr) {
                    String s = n.hasNonNull("datetime") ? n.get("datetime").asText() : null;
                    if (s == null) continue;
                    long t;
                    try {
                        // 兼容 "YYYY-MM-DD HH:mm:ss"
                        s = s.contains("T") ? s : s.replace(" ", "T");
                        t = java.time.LocalDateTime.parse(s).atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli();
                    } catch (Exception e) {
                        continue;
                    }
                    if (t > max) { max = t; latest = n.get("datetime").asText(); }
                }
            }
            return latest;
        } catch (Exception e) {
            return null;
        }
    }
}
