package com.bjtu.raillinebackend.entity;

import jakarta.persistence.*;
import lombok.Data;


@Entity
@Table(name = "users")
@Data
public class user {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;

    private String password;

    private String role; // ADMIN, INSPECTOR, MANAGER

    private String phone;
}
