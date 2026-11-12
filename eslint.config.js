const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    ignores: ['dist/*'],
  },
  {
    // Esta regra garante a Clean Architecture
    files: ['src/domain/**/*.ts', 'src/domain/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['firebase/*', 'react', 'react-native', '@/infrastructure/*', '@/app/*', '@/contexts/*'],
              message: 'A camada de Domínio não pode depender de UI (React) ou Infraestrutura (Firebase).'
            }
          ]
        }
      ]
    }
  }
]);