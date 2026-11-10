const { defineConfig } = require('eslint/config');
const expo = require('eslint-config-expo/flat');
module.exports = defineConfig([expo, // Keep the existing calendar's selected-month synchronization unchanged.
  { files: ['src/components/DatePickerField.js'], rules: { 'react-hooks/set-state-in-effect': 'off' } }, { ignores: ['backend/**', 'dist/**', 'tests/**'] }]);
