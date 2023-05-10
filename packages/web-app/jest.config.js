module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {//the content you'd placed at "global"
            babel: true,
            tsconfig: 'tsconfig.test.json',
        }]
    }
};
