package com.localmandi.platform;

import android.content.Context;
import androidx.annotation.NonNull;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.concurrent.Executor;

@CapacitorPlugin(name = "NativeBiometric")
public class NativeBiometricPlugin extends Plugin {

    @PluginMethod
    public void isAvailable(PluginCall call) {
        checkBiometry(call);
    }

    @PluginMethod
    public void checkBiometry(PluginCall call) {
        try {
            Context context = getContext();
            if (context == null) {
                JSObject errorResult = new JSObject();
                errorResult.put("isAvailable", false);
                errorResult.put("hasEnrolledBiometrics", false);
                errorResult.put("biometryType", "none");
                errorResult.put("code", "NO_CONTEXT");
                errorResult.put("reason", "Android application context is not available.");
                call.resolve(errorResult);
                return;
            }

            BiometricManager biometricManager = BiometricManager.from(context);

            int authenticators = BiometricManager.Authenticators.BIOMETRIC_STRONG;
            int canAuth = biometricManager.canAuthenticate(authenticators);
            if (canAuth != BiometricManager.BIOMETRIC_SUCCESS) {
                int weakAuth = biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG | BiometricManager.Authenticators.BIOMETRIC_WEAK);
                if (weakAuth == BiometricManager.BIOMETRIC_SUCCESS) {
                    canAuth = BiometricManager.BIOMETRIC_SUCCESS;
                } else if (canAuth == BiometricManager.BIOMETRIC_STATUS_UNKNOWN) {
                    canAuth = weakAuth;
                }
            }

            JSObject result = new JSObject();
            switch (canAuth) {
                case BiometricManager.BIOMETRIC_SUCCESS:
                    result.put("isAvailable", true);
                    result.put("hasEnrolledBiometrics", true);
                    result.put("biometryType", "fingerprint");
                    result.put("code", "SUCCESS");
                    result.put("reason", "Biometric authentication is ready and enrolled on this device.");
                    break;

                case BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED:
                    result.put("isAvailable", false);
                    result.put("hasEnrolledBiometrics", false);
                    result.put("biometryType", "none");
                    result.put("code", "NONE_ENROLLED");
                    result.put("reason", "No fingerprint or biometric is enrolled. Please register a fingerprint in Android Settings.");
                    break;

                case BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE:
                    result.put("isAvailable", false);
                    result.put("hasEnrolledBiometrics", false);
                    result.put("biometryType", "none");
                    result.put("code", "NO_HARDWARE");
                    result.put("reason", "This device does not have biometric hardware sensor.");
                    break;

                case BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE:
                    result.put("isAvailable", false);
                    result.put("hasEnrolledBiometrics", false);
                    result.put("biometryType", "none");
                    result.put("code", "HW_UNAVAILABLE");
                    result.put("reason", "Biometric sensor hardware is currently unavailable or busy. Please try again.");
                    break;

                case BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED:
                    result.put("isAvailable", false);
                    result.put("hasEnrolledBiometrics", false);
                    result.put("biometryType", "none");
                    result.put("code", "SECURITY_UPDATE_REQUIRED");
                    result.put("reason", "Security update is required for biometric authentication on this Android device.");
                    break;

                case BiometricManager.BIOMETRIC_STATUS_UNKNOWN:
                default:
                    result.put("isAvailable", false);
                    result.put("hasEnrolledBiometrics", false);
                    result.put("biometryType", "none");
                    result.put("code", "UNSUPPORTED");
                    result.put("reason", "Biometric authentication is not supported on this device.");
                    break;
            }

            call.resolve(result);
        } catch (Exception e) {
            JSObject res = new JSObject();
            res.put("isAvailable", false);
            res.put("hasEnrolledBiometrics", false);
            res.put("biometryType", "none");
            res.put("code", "EXCEPTION");
            res.put("reason", e.getMessage() != null ? e.getMessage() : "Error checking biometric availability.");
            call.resolve(res);
        }
    }

    @PluginMethod
    public void authenticate(final PluginCall call) {
        final FragmentActivity activity = (FragmentActivity) getActivity();
        if (activity == null) {
            JSObject res = new JSObject();
            res.put("authenticated", false);
            res.put("code", "NO_ACTIVITY");
            res.put("error", "Host Android Activity is not available.");
            call.resolve(res);
            return;
        }

        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    Context context = getContext();
                    BiometricManager biometricManager = BiometricManager.from(context);

                    int authenticators = BiometricManager.Authenticators.BIOMETRIC_STRONG;
                    int canAuth = biometricManager.canAuthenticate(authenticators);
                    if (canAuth != BiometricManager.BIOMETRIC_SUCCESS) {
                        int weakResult = biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG | BiometricManager.Authenticators.BIOMETRIC_WEAK);
                        if (weakResult == BiometricManager.BIOMETRIC_SUCCESS) {
                            authenticators = BiometricManager.Authenticators.BIOMETRIC_STRONG | BiometricManager.Authenticators.BIOMETRIC_WEAK;
                            canAuth = BiometricManager.BIOMETRIC_SUCCESS;
                        }
                    }

                    if (canAuth != BiometricManager.BIOMETRIC_SUCCESS) {
                        JSObject res = new JSObject();
                        res.put("authenticated", false);
                        if (canAuth == BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED) {
                            res.put("code", "NONE_ENROLLED");
                            res.put("error", "No fingerprint enrolled. Please enroll a fingerprint in Android Settings.");
                        } else if (canAuth == BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE) {
                            res.put("code", "NO_HARDWARE");
                            res.put("error", "No biometric sensor hardware found on this device.");
                        } else if (canAuth == BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE) {
                            res.put("code", "HW_UNAVAILABLE");
                            res.put("error", "Biometric sensor is busy or temporarily unavailable.");
                        } else {
                            res.put("code", "NOT_AVAILABLE");
                            res.put("error", "Biometric authentication is not available on this device.");
                        }
                        call.resolve(res);
                        return;
                    }

                    String title = call.getString("title", "Biometric Authentication");
                    String subtitle = call.getString("subtitle", "Verify your fingerprint to continue");
                    String description = call.getString("description", "Touch the fingerprint sensor");
                    String negativeButtonText = call.getString("negativeButtonText", "Cancel");

                    BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
                        .setTitle(title)
                        .setSubtitle(subtitle)
                        .setDescription(description)
                        .setAllowedAuthenticators(authenticators)
                        .setNegativeButtonText(negativeButtonText)
                        .build();

                    Executor executor = ContextCompat.getMainExecutor(activity);
                    BiometricPrompt biometricPrompt = new BiometricPrompt(
                        activity,
                        executor,
                        new BiometricPrompt.AuthenticationCallback() {
                            @Override
                            public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                                super.onAuthenticationError(errorCode, errString);
                                JSObject res = new JSObject();
                                res.put("authenticated", false);
                                if (errorCode == BiometricPrompt.ERROR_USER_CANCELED ||
                                    errorCode == BiometricPrompt.ERROR_NEGATIVE_BUTTON ||
                                    errorCode == BiometricPrompt.ERROR_CANCELED) {
                                    res.put("code", "USER_CANCELED");
                                    res.put("error", "Authentication cancelled by user.");
                                } else if (errorCode == BiometricPrompt.ERROR_LOCKOUT ||
                                           errorCode == BiometricPrompt.ERROR_LOCKOUT_PERMANENT) {
                                    res.put("code", "LOCKOUT");
                                    res.put("error", "Too many failed attempts. Please use your PIN or unlock your phone.");
                                } else {
                                    res.put("code", "AUTH_ERROR_" + errorCode);
                                    res.put("error", errString.toString());
                                }
                                call.resolve(res);
                            }

                            @Override
                            public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                                super.onAuthenticationSucceeded(result);
                                JSObject res = new JSObject();
                                res.put("authenticated", true);
                                res.put("code", "SUCCESS");
                                call.resolve(res);
                            }

                            @Override
                            public void onAuthenticationFailed() {
                                super.onAuthenticationFailed();
                                // The system BiometricPrompt UI displays "Not recognized. Try again." to the user
                            }
                        }
                    );

                    biometricPrompt.authenticate(promptInfo);

                } catch (Exception e) {
                    JSObject res = new JSObject();
                    res.put("authenticated", false);
                    res.put("code", "EXCEPTION");
                    res.put("error", e.getMessage() != null ? e.getMessage() : "Failed to open biometric prompt.");
                    call.resolve(res);
                }
            }
        });
    }
}
