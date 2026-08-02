package com.bjtu.raillinebackend.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;


@Entity(name = "ledger")
@Table
@lombok.Data
public class ledger {
    @Id
    @Column(name = "id")
    private String id;

    @Column(name = "line_name")
    private String lineName;

    @Column(name = "location")
    private String location;

    @Column(name = "type_name")
    private String typeName;

    @Column(name = "record_date")
    private LocalDate recordDate;

    @Column(name = "severity")
    private String severity;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "recorder")
    private String recorder;

    @Column(name = "suggestion", columnDefinition = "TEXT")
    private String suggestion;

    @Column(name = "history", columnDefinition = "TEXT")
    private String history;

    // getters/setters ...
}