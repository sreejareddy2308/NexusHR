package com.zidio.hr.nexus.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class NotificationRequest {

    @NotBlank
    @Email
    private String recipientEmail;

    @NotBlank
    @Size(max = 150)
    private String title;

    @NotBlank
    @Size(max = 2000)
    private String message;

    @NotBlank
    @Size(max = 50)
    private String type;

    public String getRecipientEmail() {
        return recipientEmail;
    }

    public void setRecipientEmail(String recipientEmail) {
        this.recipientEmail = recipientEmail;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}

