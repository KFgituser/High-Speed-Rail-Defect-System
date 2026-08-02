package com.bjtu.raillinebackend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "viz_slots")
@Data
public class Viz2DSlot {
    @Id
    @Column(name = "slot_id")
    private Integer slotId;

    @Column(name = "run_id")
    private String runId;

    @Column(name = "image_path")
    private String imagePath;

    @Column(name = "date_str")
    private String dateStr;

    @Column(name = "start_label")
    private String startLabel;

    @Column(name = "end_label")
    private String endLabel;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private java.sql.Timestamp updatedAt;
}
