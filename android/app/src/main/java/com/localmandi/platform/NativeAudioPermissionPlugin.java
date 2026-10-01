package com.localmandi.platform;

import android.Manifest;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PermissionState;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "NativeAudioPermission",
    permissions = {
        @Permission(
            alias = "microphone",
            strings = { Manifest.permission.RECORD_AUDIO, Manifest.permission.MODIFY_AUDIO_SETTINGS }
        )
    }
)
public class NativeAudioPermissionPlugin extends Plugin {

    @PluginMethod
    public void checkPermission(PluginCall call) {
        JSObject ret = new JSObject();
        PermissionState state = getPermissionState("microphone");
        ret.put("granted", state == PermissionState.GRANTED);
        ret.put("state", state != null ? state.toString() : "PROMPT");
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (getPermissionState("microphone") == PermissionState.GRANTED) {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            ret.put("state", PermissionState.GRANTED.toString());
            call.resolve(ret);
        } else {
            requestPermissionForAlias("microphone", call, "microphoneCallback");
        }
    }

    @PermissionCallback
    private void microphoneCallback(PluginCall call) {
        PermissionState state = getPermissionState("microphone");
        JSObject ret = new JSObject();
        ret.put("granted", state == PermissionState.GRANTED);
        ret.put("state", state != null ? state.toString() : "DENIED");
        call.resolve(ret);
    }
}
