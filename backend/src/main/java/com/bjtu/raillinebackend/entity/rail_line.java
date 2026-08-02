package com.bjtu.raillinebackend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name="rail_line")
@Data public class rail_line {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;
    private String code;
    private String name;
    @Column(name="km_min") private Integer kmMin;
    @Column(name="km_max") private Integer kmMax;
}
