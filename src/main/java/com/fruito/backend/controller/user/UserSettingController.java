package com.fruito.backend.controller.user;

import com.fruito.backend.service.SettingService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user/settings")
public class UserSettingController {
    private final SettingService settingService;

    public UserSettingController(SettingService settingService) {
        this.settingService = settingService;
    }

    @GetMapping("/{key}")
    public String get(@PathVariable String key) {
        // We default to 2.0 for delivery_fee if not set
        if ("delivery_fee".equals(key)) {
            return settingService.getSetting(key, "2.0");
        }
        return settingService.getSetting(key, "");
    }
}
