package com.bjtu.raillinebackend.dto;


import lombok.Data;

@Data
public class FileItem {
    private String name;
    private long size;
    private long lastModified;
    private String thumbUrl; // /thumbs/xxx.png
}
