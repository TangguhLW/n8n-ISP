import { defineConfig } from '@playwright/test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { scryptSync } from 'node:crypto';
const testRoot=mkdtempSync(resolve(tmpdir(),'ath-browser-'));
const salt='browser-fixture-salt';
export default defineConfig({
  testDir:'./tests',testMatch:'**/*.e2e.ts',workers:1,fullyParallel:false,
  timeout:60000,expect:{timeout:10000},
  use:{baseURL:'http://127.0.0.1:3001',channel:'msedge',headless:true,viewport:{width:1440,height:1000},trace:'retain-on-failure'},
  reporter:[['list'],['html',{open:'never'}]],
  webServer:{command:'node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3001',url:'http://127.0.0.1:3001/api/health',reuseExistingServer:false,timeout:30000,
    env:{ATH_DATA_DIR:resolve(testRoot,'data'),ATH_BACKUP_DIR:resolve(testRoot,'backups'),ATH_SESSION_SECRET:'browser-test-session-secret-'.repeat(3),ATH_ADMIN_PASSWORD_HASH:`${salt}:${scryptSync('browser-test-password',salt,64).toString('hex')}`,N8N_API_KEY:''}
  }
});
