package com.bjtu.raillinebackend.controller;

import com.bjtu.raillinebackend.entity.detection;
import com.bjtu.raillinebackend.entity.ledger;
import com.bjtu.raillinebackend.repository.DetectionRepository;
import com.bjtu.raillinebackend.repository.LedgerRepository;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
public class ExportController {

    private final DetectionRepository detectionRepo;
    private final LedgerRepository ledgerRepo;

    public ExportController(DetectionRepository detectionRepo, LedgerRepository ledgerRepo) {
        this.detectionRepo = detectionRepo;
        this.ledgerRepo = ledgerRepo;
    }

    @GetMapping("/api/export-detection")
    public void exportDetection(HttpServletResponse response) throws IOException {

        List<detection> list = detectionRepo.findAll();
        System.out.println(list.size());
        Workbook wb = new XSSFWorkbook();
        Sheet sheet = wb.createSheet("自有检测数据");

        writeDetectionSheet(sheet, list);
        setResponseHeader(response, "自有检测数据.xlsx");
        wb.write(response.getOutputStream());
        wb.close();
    }

    @GetMapping("/api/export-ledger")
    public void exportLedger(HttpServletResponse response) throws IOException {
        List<ledger> list = ledgerRepo.findAll();
        System.out.println("台账数据数量: " + list.size());
        Workbook wb = new XSSFWorkbook();
        Sheet sheet = wb.createSheet("高铁台账数据");
        writeLedgerSheet(sheet, list);
        setResponseHeader(response, "高铁台账数据.xlsx");
        wb.write(response.getOutputStream());
        wb.close();
    }

    @GetMapping("/api/export-all")
    public void exportAll(HttpServletResponse response) throws IOException {
        List<detection> det = detectionRepo.findAll();

        List<ledger> led = ledgerRepo.findAll();

        Workbook wb = new XSSFWorkbook();
        writeDetectionSheet(wb.createSheet("自有检测数据"), det);
        writeLedgerSheet(wb.createSheet("高铁台账数据"), led);

        setResponseHeader(response, "检测与台账.xlsx");
        wb.write(response.getOutputStream());
        wb.close();
    }

    // ========== 工具方法 ==========

    private void writeDetectionSheet(Sheet sheet, List<detection> data) {
        String[] headers = {"病害ID","线路名称","位置","病害类型","发现时间","严重程度","病害描述","检测人员"};
        Row h = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) h.createCell(i).setCellValue(headers[i]);

        int r = 1;
        for (detection d : data) {
            Row row = sheet.createRow(r++);
            row.createCell(0).setCellValue(nvl(d.getId()));
            row.createCell(1).setCellValue(nvl(d.getLineName()));
            row.createCell(2).setCellValue(nvl(d.getLocation()));
            row.createCell(3).setCellValue(nvl(d.getTypeName()));
            row.createCell(4).setCellValue(d.getDetectDate()==null ? "" : d.getDetectDate().toString());
            row.createCell(5).setCellValue(nvl(d.getSeverity()));
            row.createCell(6).setCellValue(nvl(d.getDescription()));
            row.createCell(7).setCellValue(nvl(d.getInspector()));
        }
        // 简单列宽
        for (int i = 0; i < headers.length; i++) sheet.setColumnWidth(i, (i>=6? 40:16)*256);

    }

    private void writeLedgerSheet(Sheet sheet, List<ledger> data) {
        String[] headers = {"病害ID","线路名称","位置","病害类型","发现时间","严重程度","病害描述","记录人员"};
        Row h = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) h.createCell(i).setCellValue(headers[i]);

        int r = 1;
        for (ledger l : data) {
            Row row = sheet.createRow(r++);
            row.createCell(0).setCellValue(nvl(l.getId()));
            row.createCell(1).setCellValue(nvl(l.getLineName()));
            row.createCell(2).setCellValue(nvl(l.getLocation()));
            row.createCell(3).setCellValue(nvl(l.getTypeName()));
            row.createCell(4).setCellValue(l.getRecordDate()==null ? "" : l.getRecordDate().toString());
            row.createCell(5).setCellValue(nvl(l.getSeverity()));
            row.createCell(6).setCellValue(nvl(l.getDescription()));
            row.createCell(7).setCellValue(nvl(l.getRecorder()));
        }
        for (int i = 0; i < headers.length; i++) sheet.setColumnWidth(i, (i>=6? 40:16)*256);
    }

    private String nvl(String s) { return s == null ? "" : s; }

    private void setResponseHeader(HttpServletResponse response, String filename) throws IOException {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        String enc = URLEncoder.encode(filename, StandardCharsets.UTF_8);
        response.setHeader("Content-Disposition", "attachment; filename=" + enc);
    }


}
