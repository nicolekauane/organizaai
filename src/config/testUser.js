const configuredUserId = process.env.EXPO_PUBLIC_TEST_USER_ID;

export const TEST_USER_ID =
  typeof configuredUserId === 'string' && /^[1-9]\d*$/.test(configuredUserId.trim())
    ? configuredUserId.trim()
    : null;