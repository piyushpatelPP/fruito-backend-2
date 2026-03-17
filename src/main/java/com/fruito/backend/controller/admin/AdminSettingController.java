package com.fruito.backend.controller.admin;

import com.fruito.backend.model.Setting;
import com.fruito.backend.service.SettingService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/settings")
public class AdminSettingController {
    private final SettingService settingService;

    public AdminSettingController(SettingService settingService) {
        this.settingService = settingService;
    }

    // POST /admin/settings?key=delivery_fee&value=50
    @PostMapping
    public Setting update(@RequestParam String key, @RequestParam String value) {
        return settingService.updateSetting(key, value);
    }

    // PUT /admin/settings/delivery_fee?value=50  ← this is what the frontend calls
    @PutMapping("/delivery_fee")
    public Setting updateDeliveryFee(@RequestParam String value) {
        return settingService.updateSetting("delivery_fee", value);
    }
}
