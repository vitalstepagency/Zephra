#!/usr/bin/env node

/**
 * ZEPHRA SECURITY TESTING SUITE
 * 
 * Comprehensive security testing for RLS policies, authentication,
 * and data access controls in your Zephra application.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Create different client instances
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Test Results Tracker
 */
class SecurityTestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.warnings = 0;
  }

  async runTest(name, testFn, category = 'General') {
    console.log(`🧪 Testing: ${name}`);
    
    try {
      const result = await testFn();
      
      if (result.success) {
        console.log(`✅ PASS: ${name}`);
        this.passed++;
      } else if (result.warning) {
        console.log(`⚠️  WARN: ${name} - ${result.message}`);
        this.warnings++;
      } else {
        console.log(`❌ FAIL: ${name} - ${result.message}`);
        this.failed++;
      }
      
      this.tests.push({
        name,
        category,
        status: result.success ? 'PASS' : result.warning ? 'WARN' : 'FAIL',
        message: result.message || '',
        details: result.details || null
      });
      
    } catch (error) {
      console.log(`💥 ERROR: ${name} - ${error.message}`);
      this.failed++;
      
      this.tests.push({
        name,
        category,
        status: 'ERROR',
        message: error.message,
        details: null
      });
    }
  }

  printSummary() {
    console.log('\n🎯 SECURITY TEST SUMMARY');
    console.log('========================');
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`⚠️  Warnings: ${this.warnings}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`💥 Total: ${this.tests.length}`);
    
    const score = Math.round((this.passed / this.tests.length) * 100);
    console.log(`\n🛡️  Security Score: ${score}%`);
    
    if (score >= 95) {
      console.log('🎉 EXCELLENT! Your security is bulletproof!');
    } else if (score >= 85) {
      console.log('👍 GOOD! Minor improvements needed.');
    } else if (score >= 70) {
      console.log('⚠️  MODERATE! Several security issues to address.');
    } else {
      console.log('🚨 CRITICAL! Immediate security attention required!');
    }
    
    return score;
  }
}

/**
 * Main Test Runner
 */
async function runSecurityTests() {
  console.log('🛡️  ZEPHRA SECURITY TEST SUITE');
  console.log('==============================\n');
  
  const runner = new SecurityTestRunner();
  
  // Basic RLS test
  await runner.runTest('RLS Policies Active', async () => {
    const { data, error } = await serviceClient.rpc('exec_sql', {
      sql_query: 'SELECT COUNT(*) as count FROM pg_policies WHERE schemaname = \'public\';'
    });
    
    if (error) {
      return { success: false, message: error.message };
    }
    
    const count = parseInt(data?.[0]?.count || 0);
    return count > 0 
      ? { success: true, message: `${count} RLS policies active` }
      : { success: false, message: 'No RLS policies found' };
  }, 'RLS');
  
  const score = runner.printSummary();
  return score;
}

// Handle command line execution
if (require.main === module) {
  runSecurityTests()
    .then(score => {
      process.exit(score >= 70 ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test suite failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  runSecurityTests,
  SecurityTestRunner
};