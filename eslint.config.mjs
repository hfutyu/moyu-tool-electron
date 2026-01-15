import { defineConfig } from 'eslint/config'
import tseslint from '@electron-toolkit/eslint-config-ts'
import eslintConfigPrettier from '@electron-toolkit/eslint-config-prettier'
import eslintPluginVue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'

export default defineConfig(
  { ignores: ['**/node_modules', '**/dist', '**/out'] },
  tseslint.configs.recommended,
  eslintPluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        },
        extraFileExtensions: ['.vue'],
        parser: tseslint.parser
      }
    }
  },
  {
    files: ['**/*.{ts,mts,tsx,vue}'],
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',           // 允许使用 @ts-ignore
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',           // 忽略不安全的方法调用
      '@typescript-eslint/no-unsafe-return': 'off',         // 忽略不安全的返回值
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',  // 允许任意类型的成员访问
      '@typescript-eslint/no-unsafe-assignment': 'off',
      // 关闭未使用变量检查
      '@typescript-eslint/no-unused-vars': 'off',
      // 关闭函数返回类型显式声明检查
      '@typescript-eslint/explicit-function-return-type': 'off',
      // 关闭属性顺序检查
      'vue/attributes-order': 'off',
      // 关闭 any 类型检查
      '@typescript-eslint/no-explicit-any': 'off',
      // 关闭 prettier 检查
      'prettier/prettier': 'off',
      'vue/require-default-prop': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/block-lang': [
        'error',
        {
          script: {
            lang: 'ts'
          }
        }
      ]
    }
  },
  eslintConfigPrettier
)
