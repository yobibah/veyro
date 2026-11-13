# Veyro

Veyro is an Expo app with a native Android module for focus sessions and app blocking.

## Android: notifications and uninstall protection

The active focus session uses an Android foreground service and a dedicated low-importance notification channel. The notification is marked ongoing, shows the blocked app count and local end time, and uses Android's notification chronometer for the countdown. Android and some device manufacturers may still let the user stop a foreground service or disable notifications. On Android 13 and newer, allow Veyro notifications when prompted.

The active flag, selected package names, and schedules are stored natively in Android `SharedPreferences`, outside the app cache. Clearing Veyro's cache therefore does not clear the policy or stop blocking. Clearing app storage/data is a different operation and erases app preferences; on a Device Owner device, Veyro also applies Android's app-management restriction during the session to block those Settings actions where supported.

The notification and reboot recovery require a development or production build; Expo Go does not contain Veyro's native module.

Veyro cannot prevent its own uninstall as a regular app. The native module applies `DevicePolicyManager.setUninstallBlocked` and the `DISALLOW_APPS_CONTROL` restriction only when Veyro is provisioned as the **Device Owner**. `DISALLOW_APPS_CONTROL` also prevents disabling apps and force-stopping them through normal Settings screens. These restrictions affect app management on the device and are cleared when the configured session ends. ADB or device reset can still bypass/remove device policy.

Android does not provide an ordinary accessibility app with a reliable way to prevent the user from turning off its accessibility service. Device Owner mode can restrict app management, but it does not make Veyro's blocking service impossible to disable on every Android version or manufacturer build.

Device Owner provisioning is intended for a dedicated or fully managed device. It generally requires a freshly reset device with no accounts or other device owner, installing the signed Veyro build, then provisioning it before normal setup. For development, install the build and run:

```bash
adb shell dpm set-device-owner com.veyro.app/expo.modules.veyroandroid.VeyroDeviceAdminReceiver
```

Check the resulting policy with `adb shell dpm list-owners`. To remove the owner for development, end the focus session and run `adb shell dpm remove-active-admin com.veyro.app/expo.modules.veyroandroid.VeyroDeviceAdminReceiver` (or factory reset if the device disallows removal). Do not provision a personal daily-use device as Device Owner without understanding Android's managed-device setup and reset requirements.

## Development

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **src/app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **example** directory and create a blank **src/app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
