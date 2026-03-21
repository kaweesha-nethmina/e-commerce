package com.ctse.notification.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class UserRegisteredEvent {

    @JsonProperty("user_id")
    private String userId;

    @JsonProperty("email")
    private String email;

    @JsonProperty("name")
    private String name;

    @JsonProperty("timestamp")
    private String timestamp;

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
}
