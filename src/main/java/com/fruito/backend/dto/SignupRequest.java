package com.fruito.backend.dto;

public class SignupRequest {

    private String email;
    private String password;
    private String phone;
    private String address;
    private String captchaToken;

    public String getEmail() { return email; }
    public String getPassword() { return password; }
    public String getPhone() { return phone; }
    public String getAddress() { return address; }
    public String getCaptchaToken() { return captchaToken; }

    public void setEmail(String email) { this.email = email; }
    public void setPassword(String password) { this.password = password; }
    public void setPhone(String phone) { this.phone = phone; }
    public void setAddress(String address) { this.address = address; }
    public void setCaptchaToken(String captchaToken) { this.captchaToken = captchaToken; }
}
