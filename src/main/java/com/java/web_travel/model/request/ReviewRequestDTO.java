package com.java.web_travel.model.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReviewRequestDTO {

    @NotNull(message = "Mã đơn hàng (Order ID) không được để trống")
    private Long orderId;

    @NotNull
    @Min(value = 1, message = "Đánh giá chuyến bay thấp nhất là 1 sao")
    @Max(value = 5, message = "Đánh giá chuyến bay cao nhất là 5 sao")
    private Integer flightRating;

    @NotNull
    @Min(value = 1, message = "Đánh giá khách sạn thấp nhất là 1 sao")
    @Max(value = 5, message = "Đánh giá khách sạn cao nhất là 5 sao")
    private Integer hotelRating;

    @NotNull
    @Min(value = 1, message = "Đánh giá website thấp nhất là 1 sao")
    @Max(value = 5, message = "Đánh giá website cao nhất là 5 sao")
    private Integer websiteRating;

    @NotBlank(message = "INVALID_COMMENT")
    private String comment;
}