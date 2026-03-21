package com.ctse.notification.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Integration with User Service: fetch user details for notification content.
 */
@Component
public class UserServiceClient {

    private final RestTemplate rest = new RestTemplate();
    private final String userServiceUrl;

    public UserServiceClient(@Value("${user.service.url:http://localhost:3001}") String userServiceUrl) {
        this.userServiceUrl = userServiceUrl.endsWith("/") ? userServiceUrl : userServiceUrl + "/";
    }

    public UserInfo getUser(String userId) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> body = rest.getForObject(userServiceUrl + "users/" + userId, Map.class);
            if (body == null) return null;
            UserInfo u = new UserInfo();
            u.setId((String) body.get("id"));
            u.setEmail((String) body.get("email"));
            u.setName((String) body.get("name"));
            return u;
        } catch (Exception e) {
            return null;
        }
    }

    public static class UserInfo {
        private String id;
        private String email;
        private String name;
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }
}
