package com.example.app.entity.enums;

/**
 * Contest state computed from timestamps.
 * NOT stored in DB - calculated at runtime.
 */
public enum ContestState {
    UPCOMING,   // now < startTime
    RUNNING,    // startTime <= now < endTime
    FINISHED    // now >= endTime
}
