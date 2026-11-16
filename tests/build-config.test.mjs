import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const configure = require('../app.config.js');
const base = require('../app.json').expo;

test('APK recusa URL ausente, loopback, credenciais e caminhos; HTTPS obrigatorio fora de teste local', () => {
  const saved = { ...process.env };
  try {
    process.env.EAS_BUILD_PROFILE = 'apk';
    for (const url of ['', 'http://localhost:3000', 'https://127.0.0.1', 'https://[::1]', 'https://user:pass@api.example.test', 'https://api.example.test/api', 'https://api.example.test?x=1', 'http://api.example.test']) {
      process.env.EXPO_PUBLIC_API_URL = url;
      assert.throws(() => configure({ config: structuredClone(base) }));
    }
    process.env.EXPO_PUBLIC_API_URL = 'https://api.example.test';
    assert.equal(configure({ config: structuredClone(base) }).android.package, base.android.package);
    process.env.EAS_BUILD_PROFILE = 'apk-local';
    process.env.EXPO_PUBLIC_API_URL = 'http://192.168.1.2:3000'; // fixture only; never a build default
    assert.ok(configure({ config: structuredClone(base) }).mods.android.manifest);
    process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3000';
    assert.throws(() => configure({ config: structuredClone(base) }));
  } finally {
    for (const key of ['EAS_BUILD_PROFILE', 'EXPO_PUBLIC_API_URL']) {
      if (saved[key] === undefined) delete process.env[key]; else process.env[key] = saved[key];
    }
  }
});
