package com.bjtu.raillinebackend.service;

import java.util.Arrays;
import java.util.List;

record DiseaseTypeSelection(boolean enabled, List<String> values) {
    static DiseaseTypeSelection fromCsv(String csv) {
        List<String> values = csv == null ? List.of() : Arrays.stream(csv.split(","))
                .map(String::trim).filter(value -> !value.isEmpty()).distinct().toList();
        // Keep the IN parameter bound even when the filter is disabled.
        return new DiseaseTypeSelection(!values.isEmpty(), values.isEmpty() ? List.of("") : values);
    }
}
