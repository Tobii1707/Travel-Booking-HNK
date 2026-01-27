package com.java.web_travel.model.request;
import lombok.Data;

@Data
public class BulkUpdatePriceRequest {
    private Long groupId;
    private Double percentage;
}