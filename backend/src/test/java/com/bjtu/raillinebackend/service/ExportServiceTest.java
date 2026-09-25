package com.bjtu.raillinebackend.service;

import com.bjtu.raillinebackend.dto.DetectionResponse;
import com.bjtu.raillinebackend.dto.DiseaseDetailResponse;
import com.bjtu.raillinebackend.dto.ExportFilter;
import com.bjtu.raillinebackend.dto.LedgerResponse;
import com.bjtu.raillinebackend.entity.Detection;
import com.bjtu.raillinebackend.entity.Ledger;
import com.bjtu.raillinebackend.entity.Severity;
import com.bjtu.raillinebackend.repository.DetectionRepository;
import com.bjtu.raillinebackend.repository.LedgerRepository;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ExportServiceTest {
    @Test
    void combinedExportUsesTheVisibleFiltersForEachTable() throws Exception {
        DetectionRepository detections = mock(DetectionRepository.class);
        LedgerRepository ledgers = mock(LedgerRepository.class);
        ExportService service = new ExportService(detections, ledgers);
        ExportFilter filter = new ExportFilter();
        filter.setLine("京沪高铁");
        filter.setTypes("裂纹,破损");
        filter.setMinMileage(500123);
        filter.setMaxMileage(820456);
        filter.setDetectionType("裂纹");
        filter.setDetectionSeverity(Severity.严重);
        filter.setLedgerType("破损");
        filter.setLedgerSeverity(Severity.轻微);
        filter.setStart(LocalDate.of(2025, 1, 1));
        filter.setEnd(LocalDate.of(2025, 12, 31));

        Detection detection = new Detection();
        detection.setId("D-1");
        Ledger ledger = new Ledger();
        ledger.setId("L-1");
        when(detections.search(any(), any(), anyBoolean(), any(), any(), any(), any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(detection)));
        when(ledgers.search(any(), any(), anyBoolean(), any(), any(), any(), any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(ledger)));

        ByteArrayOutputStream output = new ByteArrayOutputStream();
        service.writeAll(output, filter);

        verify(detections).search(eq("京沪高铁"), eq("裂纹"), eq(true), eq(List.of("裂纹", "破损")),
                eq(Severity.严重), eq(filter.getStart()), eq(filter.getEnd()), eq(null),
                eq(500123), eq(820456), any(Pageable.class));
        verify(ledgers).search(eq("京沪高铁"), eq("破损"), eq(true), eq(List.of("裂纹", "破损")),
                eq(Severity.轻微), eq(filter.getStart()), eq(filter.getEnd()), eq(null),
                eq(500123), eq(820456), any(Pageable.class));
        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(output.toByteArray()))) {
            assertEquals("D-1", workbook.getSheet("自有检测数据").getRow(1).getCell(0).getStringCellValue());
            assertEquals("L-1", workbook.getSheet("高铁台账数据").getRow(1).getCell(0).getStringCellValue());
        }
    }

    @Test
    void detailExportIncludesBothDetectionAndLedgerFields() throws Exception {
        ExportService service = new ExportService(mock(DetectionRepository.class), mock(LedgerRepository.class));
        DiseaseDetailResponse detail = new DiseaseDetailResponse(
                new DetectionResponse("D-1", "京沪高铁", "K1+000", "裂纹", null,
                        Severity.严重, "description", "inspector", "repair", "history"),
                new LedgerResponse("D-1", "京沪高铁", "K1+000", "裂纹", null,
                        Severity.严重, "description", "recorder", "ledger repair", "ledger history"));

        ByteArrayOutputStream output = new ByteArrayOutputStream();
        service.writeDetail(output, detail);

        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(output.toByteArray()))) {
            assertEquals("repair", workbook.getSheet("检测详情").getRow(8).getCell(1).getStringCellValue());
            assertEquals("ledger history", workbook.getSheet("台账详情").getRow(9).getCell(1).getStringCellValue());
        }
    }
}
