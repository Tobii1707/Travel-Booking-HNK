package com.java.web_travel.exception;

import com.java.web_travel.enums.ErrorCode;
import com.java.web_travel.model.response.ApiReponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(value = RuntimeException.class)
    public ResponseEntity<String> runtimeExceptionHandler(RuntimeException e) {
        return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
    }
    @ExceptionHandler(value = AppException.class)
    public ResponseEntity<ApiReponse> appExceptionHandler(AppException e) {
        ErrorCode errorCode = e.getErrorCode();

        ApiReponse apiReponse = new ApiReponse();
        apiReponse.setCode(errorCode.getCode());
        apiReponse.setMessage(errorCode.getMessage());

        return ResponseEntity.status(errorCode.getHttpStatusCode()).body(apiReponse) ;
    }
    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    public ResponseEntity<ApiReponse> methodArgumentNotValidExceptionHandler(MethodArgumentNotValidException e) {
        String message = e.getFieldError().getDefaultMessage();  // lấy tên lỗi
        ErrorCode errorCode = ErrorCode.valueOf(message); // lấy error code
        ApiReponse apiReponse = new ApiReponse();
        apiReponse.setCode(errorCode.getCode());
        apiReponse.setMessage(errorCode.getMessage());

        return ResponseEntity.status(errorCode.getHttpStatusCode()).body(apiReponse) ;
    }
    @ExceptionHandler(value = IllegalArgumentException.class)
    public ResponseEntity<ApiReponse> illegalArgumentExceptionHandler(IllegalArgumentException e) {
        ErrorCode errorCode = ErrorCode.valueOf(e.getMessage());
        ApiReponse apiReponse = new ApiReponse();
        apiReponse.setCode(errorCode.getCode());
        apiReponse.setMessage(errorCode.getMessage());
        return ResponseEntity.status(errorCode.getHttpStatusCode()).body(apiReponse) ;
    }
}
