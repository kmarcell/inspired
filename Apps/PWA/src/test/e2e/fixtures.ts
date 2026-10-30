import { test as baseTest, expect } from '@playwright/test';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { clonePersona, cleanupClone } = require('../../../../../infrastructure/scripts/lib/clonePersona');

export type CloneFixture = {
  clone: {
    userId: string;
    email: string;
    password: string;
    idMap: Record<string, string>;
  };
};

export const test = baseTest.extend<{
  clonedPersona: (sourceUserId: string) => Promise<{
    userId: string;
    email: string;
    password: string;
    idMap: Record<string, string>;
  }>;
}>({
  clonedPersona: async ({}, use, testInfo) => {
    const activeClones: any[] = [];

    const spawner = async (sourceUserId: string) => {
      const sanitizedTitle = testInfo.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().slice(0, 30);
      const testId = `${sanitizedTitle}_${testInfo.parallelIndex}_${Date.now()}`;
      const clone = await clonePersona(sourceUserId, testId);
      activeClones.push(clone);
      return clone;
    };

    await use(spawner);

    // Teardown
    await Promise.allSettled(activeClones.map((clone) => cleanupClone(clone)));
  },
});

export { expect };
