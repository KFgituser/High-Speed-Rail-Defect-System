package com.bjtu.raillinebackend.entity;

import jakarta.persistence.*;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "viz3d_result")
public class Viz3DResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Setter
    @Column(name="slot_id")
    private Integer slotId;

    @Setter
    @Column(name="run_uuid")
    private String runUuid;

    @Setter
    @Column(length = 512, name="image_url")
    private String imageUrl;   // 供前端直接用：/viz3d-out/...

    @Setter
    @Column(name="start_label")
    private String startLabel;

    @Setter
    @Column(name="end_label")
    private String endLabel;

    @Setter
    @Column(name="created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }

    public Integer getSlotId() { return slotId; }

    public String getRunUuid() { return runUuid; }

    public String getImageUrl() { return imageUrl; }

    public String getStartLabel() { return startLabel; }

    public String getEndLabel() { return endLabel; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
