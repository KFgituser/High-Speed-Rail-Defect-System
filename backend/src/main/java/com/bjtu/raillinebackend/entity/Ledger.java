package com.bjtu.raillinebackend.entity;

import jakarta.persistence.*;

import java.time.LocalDate;


@Entity(name = "ledger")
@Table
@lombok.Data
public class Ledger {
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

    @Enumerated(EnumType.STRING)
    @Column(name = "severity")
    private Severity severity;

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