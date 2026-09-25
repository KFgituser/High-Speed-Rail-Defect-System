package com.bjtu.raillinebackend.service;

import com.bjtu.raillinebackend.dto.DetectionResponse;
import com.bjtu.raillinebackend.dto.DiseaseDetailResponse;
import com.bjtu.raillinebackend.dto.ExportFilter;
import com.bjtu.raillinebackend.dto.LedgerResponse;
import com.bjtu.raillinebackend.entity.Detection;
import com.bjtu.raillinebackend.entity.Ledger;
import com.bjtu.raillinebackend.repository.DetectionRepository;
import com.bjtu.raillinebackend.repository.LedgerRepository;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.OutputStream;

@Service
public class ExportService {
    private static final int EXPORT_BATCH_SIZE = 500;

    private final DetectionRepository detectionRepository;
    private final LedgerRepository ledgerRepository;

    public ExportService(DetectionRepository detectionRepository, LedgerRepository ledgerRepository) {
        this.detectionRepository = detectionRepository;
        this.ledgerRepository = ledgerRepository;
    }

    public void writeDetections(OutputStream output, ExportFilter filter) throws IOException {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100)) {
            writeDetectionSheet(workbook.createSheet("自有检测数据"), filter);
            workbook.write(output);
            workbook.dispose();
        }
    }

    public void writeLedgers(OutputStream output, ExportFilter filter) throws IOException {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100)) {
            writeLedgerSheet(workbook.createSheet("高铁台账数据"), filter);
            workbook.write(output);
            workbook.dispose();
        }
    }

    public void writeAll(OutputStream output, ExportFilter filter) throws IOException {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100)) {
            writeDetectionSheet(workbook.createSheet("自有检测数据"), filter);
            writeLedgerSheet(workbook.createSheet("高铁台账数据"), filter);
            workbook.write(output);
            workbook.dispose();
        }
    }

    public void writeDetail(OutputStream output, DiseaseDetailResponse detail) throws IOException {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100)) {
            if (detail.detection() != null) {
                writeDetectionDetail(workbook.createSheet("检测详情"), detail.detection());
            }
            if (detail.ledger() != null) {
                writeLedgerDetail(workbook.createSheet("台账详情"), detail.ledger());
            }
            workbook.write(output);
            workbook.dispose();
        }
    }

    private void writeDetectionSheet(Sheet sheet, ExportFilter filter) {
        String[] headers = {"病害ID", "线路名称", "位置", "病害类型", "发现时间", "严重程度", "病害描述", "检测人员"};
        writeHeaders(sheet, headers);
        int rowIndex = 1;
        Page<Detection> page;
        int pageNumber = 0;
        DiseaseTypeSelection selection = DiseaseTypeSelection.fromCsv(filter.getTypes());
        do {
            page = detectionRepository.search(filter.getLine(), filter.getDetectionType(),
                    selection.enabled(), selection.values(), filter.getDetectionSeverity(),
                    filter.getStart(), filter.getEnd(), filter.getQ(),
                    filter.getMinMileage(), filter.getMaxMileage(),
                    PageRequest.of(pageNumber++, EXPORT_BATCH_SIZE, Sort.by(Sort.Direction.DESC, "detectDate")));
            for (Detection detection : page.getContent()) {
                Row row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue(value(detection.getId()));
                row.createCell(1).setCellValue(value(detection.getLineName()));
                row.createCell(2).setCellValue(value(detection.getLocation()));
                row.createCell(3).setCellValue(value(detection.getTypeName()));
                row.createCell(4).setCellValue(detection.getDetectDate() == null ? "" : detection.getDetectDate().toString());
                row.createCell(5).setCellValue(value(detection.getSeverity()));
                row.createCell(6).setCellValue(value(detection.getDescription()));
                row.createCell(7).setCellValue(value(detection.getInspector()));
            }
        } while (page.hasNext());
        setColumnWidths(sheet, headers.length);
    }

    private void writeLedgerSheet(Sheet sheet, ExportFilter filter) {
        String[] headers = {"病害ID", "线路名称", "位置", "病害类型", "发现时间", "严重程度", "病害描述", "记录人员"};
        writeHeaders(sheet, headers);
        int rowIndex = 1;
        Page<Ledger> page;
        int pageNumber = 0;
        DiseaseTypeSelection selection = DiseaseTypeSelection.fromCsv(filter.getTypes());
        do {
            page = ledgerRepository.search(filter.getLine(), filter.getLedgerType(),
                    selection.enabled(), selection.values(), filter.getLedgerSeverity(),
                    filter.getStart(), filter.getEnd(), filter.getQ(),
                    filter.getMinMileage(), filter.getMaxMileage(),
                    PageRequest.of(pageNumber++, EXPORT_BATCH_SIZE, Sort.by(Sort.Direction.DESC, "recordDate")));
            for (Ledger ledger : page.getContent()) {
                Row row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue(value(ledger.getId()));
                row.createCell(1).setCellValue(value(ledger.getLineName()));
                row.createCell(2).setCellValue(value(ledger.getLocation()));
                row.createCell(3).setCellValue(value(ledger.getTypeName()));
                row.createCell(4).setCellValue(ledger.getRecordDate() == null ? "" : ledger.getRecordDate().toString());
                row.createCell(5).setCellValue(value(ledger.getSeverity()));
                row.createCell(6).setCellValue(value(ledger.getDescription()));
                row.createCell(7).setCellValue(value(ledger.getRecorder()));
            }
        } while (page.hasNext());
        setColumnWidths(sheet, headers.length);
    }

    private void writeHeaders(Sheet sheet, String[] headers) {
        Row headerRow = sheet.createRow(0);
        for (int index = 0; index < headers.length; index++) {
            headerRow.createCell(index).setCellValue(headers[index]);
        }
    }

    private void writeDetectionDetail(Sheet sheet, DetectionResponse detail) {
        writeDetailRows(sheet, new String[][] {
                {"病害ID", value(detail.id())}, {"线路名称", value(detail.lineName())},
                {"位置", value(detail.location())}, {"病害类型", value(detail.typeName())},
                {"发现时间", value(detail.detectDate())}, {"严重程度", value(detail.severity())},
                {"病害描述", value(detail.description())}, {"检测人员", value(detail.inspector())},
                {"处理建议", value(detail.suggestion())}, {"历史记录", value(detail.history())}
        });
    }

    private void writeLedgerDetail(Sheet sheet, LedgerResponse detail) {
        writeDetailRows(sheet, new String[][] {
                {"病害ID", value(detail.id())}, {"线路名称", value(detail.lineName())},
                {"位置", value(detail.location())}, {"病害类型", value(detail.typeName())},
                {"记录时间", value(detail.recordDate())}, {"严重程度", value(detail.severity())},
                {"病害描述", value(detail.description())}, {"记录人员", value(detail.recorder())},
                {"处理建议", value(detail.suggestion())}, {"历史记录", value(detail.history())}
        });
    }

    private void writeDetailRows(Sheet sheet, String[][] fields) {
        for (int index = 0; index < fields.length; index++) {
            Row row = sheet.createRow(index);
            row.createCell(0).setCellValue(fields[index][0]);
            row.createCell(1).setCellValue(fields[index][1]);
        }
        sheet.setColumnWidth(0, 20 * 256);
        sheet.setColumnWidth(1, 80 * 256);
    }

    private void setColumnWidths(Sheet sheet, int columnCount) {
        for (int index = 0; index < columnCount; index++) {
            sheet.setColumnWidth(index, (index >= 6 ? 40 : 16) * 256);
        }
    }

    private String value(Object input) {
        return input == null ? "" : input.toString();
    }
}
