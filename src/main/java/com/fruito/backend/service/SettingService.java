package com.fruito.backend.service;

import com.fruito.backend.model.Setting;
import com.fruito.backend.repository.SettingRepository;
import org.springframework.stereotype.Service;

@Service
public class SettingService {
    private final SettingRepository settingRepository;

    public SettingService(SettingRepository settingRepository) {
        this.settingRepository = settingRepository;
    }

    public String getSetting(String key, String defaultValue) {
        return settingRepository.findByKey(key)
                .map(Setting::getValue)
                .orElse(defaultValue);
    }

    public Setting updateSetting(String key, String value) {
        Setting setting = settingRepository.findByKey(key).orElse(new Setting());
        setting.setKey(key);
        setting.setValue(value);
        return settingRepository.save(setting);
    }
    public String getDeliveryFee() {
        return getSetting("delivery_fee", "30");
    }
}
