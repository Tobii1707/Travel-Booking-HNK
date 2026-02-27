package com.java.web_travel.model.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReviewResponse {
    private Long id;
    private Long orderId;
    private Long userId;
    private String authorName;
    private Integer flightRating;
    private Integer hotelRating;
    private Integer websiteRating;
    private String comment;
    private String hotelName;
    private String flightName;
}