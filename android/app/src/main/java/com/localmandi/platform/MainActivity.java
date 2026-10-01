package com.localmandi.platform;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeBiometricPlugin.class);
        registerPlugin(NativeAudioPermissionPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
