import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

type ExpoAppConfig = {
  expo: {
    scheme?: string;
    ios?: { bundleIdentifier?: string };
    android?: {
      package?: string;
      softwareKeyboardLayoutMode?: string;
    };
  };
};

function readExpoAppConfig(): ExpoAppConfig {
  return JSON.parse(readFileSync(join(process.cwd(), 'app.json'), 'utf8')) as ExpoAppConfig;
}

describe('Expo Android configuration', () => {
  const appConfig = readExpoAppConfig();

  it('sets android.package to com.nordyan.app', () => {
    assert.equal(appConfig.expo.android?.package, 'com.nordyan.app');
  });

  it('sets Android software keyboard layout mode to resize', () => {
    assert.equal(appConfig.expo.android?.softwareKeyboardLayoutMode, 'resize');
  });

  it('does not change the nordyan scheme or iOS bundle identifier', () => {
    assert.equal(appConfig.expo.scheme, 'nordyan');
    assert.equal(appConfig.expo.ios?.bundleIdentifier, 'com.nordyan.app');
  });
});
