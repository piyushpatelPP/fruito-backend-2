package com.fruito.backend.dto.order;

public class RazorpayOrderResponse {
    private final String razorpayOrderId;
    private final long amount;      // in paise
    private final String currency;

    public RazorpayOrderResponse(String razorpayOrderId, long amount, String currency) {
        this.razorpayOrderId = razorpayOrderId;
        this.amount = amount;
        this.currency = currency;
    }

    public String getRazorpayOrderId() { return razorpayOrderId; }
    public long getAmount() { return amount; }
    public String getCurrency() { return currency; }
}
