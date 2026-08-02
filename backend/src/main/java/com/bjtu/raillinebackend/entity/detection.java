package com.bjtu.raillinebackend.entity;

// entity/Detection.java

import jakarta.persistence.*;


import java.time.LocalDate;


@Entity(name = "detection")
@Table
@lombok.Data
public class detection {
    @Id
    @Column(name = "id")
    private String id;

    @Column(name = "line_name")
    private String lineName;

    @Column(name = "location")
    private String location;

    @Column(name = "type_name")
    private String typeName;

    @Column(name = "detect_date")
    private LocalDate detectDate;

    @Column(name = "severity")
    private String severity;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "inspector")
    private String inspector;

    @Column(name = "suggestion", columnDefinition = "TEXT")
    private String suggestion;

    @Column(name = "history", columnDefinition = "TEXT")
    private String history;

    // getters/setters ...
}