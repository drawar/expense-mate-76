/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  testEnvironment: "jsdom",
  transform: {
    "^.+\.tsx?$": ["ts-jest", {}],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverage: true,
  collectCoverageFrom: [
    "src/core/rewards/**/*.{ts,tsx}",
    "src/components/rewards/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/index.{ts,tsx}",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  coverageThreshold: {
    "src/core/rewards/": {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
