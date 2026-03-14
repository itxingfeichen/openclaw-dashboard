#!/usr/bin/env node

/**
 * 数据库种子数据脚本 - Database Seed Script
 * 
 * 用途：为开发和测试环境填充初始数据
 * Usage: node scripts/seed-data.js
 * 
 * 包含：
 * - 默认用户（admin, developer, viewer）
 * - 系统配置项
 * - 示例 Agent
 * - 示例技能
 * - 示例任务
 */

import { getDatabase, closeDatabase } from '../src/database/index.js';
import { seedDatabase } from './seed-database.js';

async function main() {
  console.log('🌱 开始填充数据库种子数据...\n');
  
  try {
    const db = await getDatabase();
    await seedDatabase(db);
    
    console.log('\n✅ 数据库种子数据填充完成！\n');
    console.log('默认用户:');
    console.log('  - admin / admin123 (管理员)');
    console.log('  - developer / admin123 (开发者)');
    console.log('  - viewer / admin123 (访客)');
    console.log('\n⚠️  提示：生产环境请修改默认密码！\n');
    
    await closeDatabase();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 种子数据填充失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
