package com.bjtu.raillinebackend.entity;

import jakarta.persistence.*;
import lombok.Data;


@Entity
@Table(name = "disease_type")
@Data
public class diseaseType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String code;  // 英文/唯一标识
    private String name;  // 中文显示名
}