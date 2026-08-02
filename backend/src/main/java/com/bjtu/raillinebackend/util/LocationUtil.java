package com.bjtu.raillinebackend.util;

public final class LocationUtil {
    private LocationUtil() {}

    /** K500+123 -> 500123；K12+005 -> 12005 */
    public static Integer parseToMeter(String kMark) {
        if (kMark == null) return null;
        String s = kMark.trim().toUpperCase().replace("K", "");
        String[] parts = s.split("\\+");
        try {
            int km = Integer.parseInt(parts[0].replaceAll("\\D", ""));
            int m  = 0;
            if (parts.length > 1) {
                m = Integer.parseInt(parts[1].replaceAll("\\D", ""));
            }
            return km * 1000 + m;
        } catch (Exception e) {
            return null; // 无法解析时返回 null，调用处做好判空
        }
    }
}
