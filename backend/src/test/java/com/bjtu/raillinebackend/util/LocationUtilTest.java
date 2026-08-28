package com.bjtu.raillinebackend.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class LocationUtilTest {

    @Test
    void parsesKilometreMarkersToMetres() {
        assertEquals(500123, LocationUtil.parseToMeter("K500+123"));
        assertEquals(12005, LocationUtil.parseToMeter(" K12+005 "));
        assertEquals(7000, LocationUtil.parseToMeter("K7"));
    }

    @Test
    void returnsNullForMissingOrInvalidMarkers() {
        assertNull(LocationUtil.parseToMeter(null));
        assertNull(LocationUtil.parseToMeter("not-a-marker"));
    }
}
