package com.java.web_travel.model.request;
import lombok.Data;
import java.util.List;

@Data
public class AssignGroupRequest {
    private Long groupId;
    private List<Long> hotelIds;
}