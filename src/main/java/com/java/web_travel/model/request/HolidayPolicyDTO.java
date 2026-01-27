package com.java.web_travel.model.request;
import lombok.Data;
import java.time.LocalDate;

@Data
public class HolidayPolicyDTO {
    private String name;
    private LocalDate startDate;
    private LocalDate endDate;
    private Double increasePercentage;
    private Long groupId;
}