import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/resumes/**/*.service.ts',
    '**/matching/resume-scoring.service.ts',
    '**/chat-builder/chat-questionnaire.service.ts',
    '**/users/entitlements.service.ts',
  ],
  coverageDirectory: '../coverage',
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@hireup/shared$': '<rootDir>/../../../packages/shared/src/index.ts',
  },
};

export default config;
