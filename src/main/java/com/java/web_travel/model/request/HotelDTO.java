package com.java.web_travel.model.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data; // Dùng @Data cho tiện (Gồm cả Getter, Setter, ToString...)
import lombok.NoArgsConstructor;

@Data // Thay @Getter @Setter bằng @Data để đầy đủ nhất
@AllArgsConstructor
@NoArgsConstructor // Nên thêm cái này để tránh lỗi JSON parse
public class HotelDTO {
    @NotBlank(message = "ARGUMENT_NOT_VALID")
    private String hotelName;

    @NotNull(message ="ARGUMENT_NOT_VALID" )
    private Double priceFrom; // Nên dùng Double (Object) thay vì double (primitive)

    @NotNull(message = "ARGUMENT_NOT_VALID")
    private String address;

    @Min(value = 1 ,message = "NUMBER_FLOOR_NOT_VALID")
    private int numberFloor;

    @NotNull(message = "Số phòng một tầng không được để trống")
    @Min(value = 1, message = "Một tầng phải có ít nhất 1 phòng")
    @Max(value = 100, message = "Số phòng một tầng không được vượt quá 100")
    private Integer numberRoomPerFloor;

    // --- THÊM TRƯỜNG NÀY ĐỂ HẾT LỖI getHotelGroupId ---
    private Long hotelGroupId;
}