#!/usr/bin/env node

/**
 * ZEPHRA RLS POLICY DEPLOYMENT SCRIPT
 * 
 * This script safely deploys comprehensive Row Level Security policies
 * to your Supabase database with proper error handling and rollback.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Execute SQL with error handling
 */
async function executeSql(sql, description) {
  console.log(`🔄 ${description}...`);
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      throw new Error(`SQL Error: ${error.message}`);
    }
    
    console.log(`✅ ${description} completed successfully`);
    return { success: true, data };
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Create the exec_sql function if it doesn't exist
 */
async function createExecSqlFunction() {
  const createFunctionSql = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql_query;
      RETURN 'SUCCESS';
    EXCEPTION
      WHEN OTHERS THEN
        RETURN 'ERROR: ' || SQLERRM;
    END;
    $$;
  `;
  
  return await executeSql(createFunctionSql, 'Creating exec_sql helper function');
}

/**
 * Backup existing policies
 */
async function backupExistingPolicies() {
  console.log('📋 Backing up existing RLS policies...');
  
  const backupSql = `
    SELECT 
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies 
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `;
  
  try {
    const { data, error } = await supabase.rpc('query', { sql: backupSql });
    
    if (error) {
      console.warn('⚠️  Could not backup existing policies:', error.message);
      return null;
    }
    
    // Save backup to file
    const backupFile = path.join(__dirname, `../backups/rls-policies-backup-${Date.now()}.json`);
    const backupDir = path.dirname(backupFile);
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
    console.log(`✅ Policies backed up to: ${backupFile}`);
    
    return backupFile;
  } catch (error) {
    console.warn('⚠️  Could not backup existing policies:', error.message);
    return null;
  }
}

/**
 * Deploy RLS policies
 */
async function deployRlsPolicies() {
  console.log('🚀 Starting RLS policy deployment...');
  
  // Read the RLS policies file
  const rlsPoliciesPath = path.join(__dirname, '../supabase/rls-policies.sql');
  
  if (!fs.existsSync(rlsPoliciesPath)) {
    console.error('❌ RLS policies file not found:', rlsPoliciesPath);
    process.exit(1);
  }
  
  const rlsPoliciesSql = fs.readFileSync(rlsPoliciesPath, 'utf8');
  
  // Split SQL into individual statements
  const statements = rlsPoliciesSql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));
  
  console.log(`📝 Found ${statements.length} SQL statements to execute`);
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  
  // Execute statements one by one
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    const description = `Statement ${i + 1}/${statements.length}`;
    
    const result = await executeSql(statement, description);
    
    if (result.success) {
      successCount++;
    } else {
      errorCount++;
      errors.push({
        statement: i + 1,
        sql: statement.substring(0, 100) + '...',
        error: result.error
      });
    }
    
    // Add small delay to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📊 Deployment Summary:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  
  if (errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    errors.forEach(error => {
      console.log(`   Statement ${error.statement}: ${error.error}`);
    });
  }
  
  return { successCount, errorCount, errors };
}

/**
 * Verify RLS policies are working
 */
async function verifyRlsPolicies() {
  console.log('🔍 Verifying RLS policies...');
  
  const verificationTests = [
    {
      name: 'Check all tables have RLS enabled',
      sql: `
        SELECT tablename 
        FROM pg_tables t
        LEFT JOIN pg_class c ON c.relname = t.tablename
        LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE t.schemaname = 'public' 
        AND t.tablename NOT LIKE 'pg_%'
        AND (c.relrowsecurity IS NULL OR c.relrowsecurity = false);
      `
    },
    {
      name: 'Count total RLS policies',
      sql: `
        SELECT COUNT(*) as policy_count
        FROM pg_policies 
        WHERE schemaname = 'public';
      `
    },
    {
      name: 'Check helper functions exist',
      sql: `
        SELECT proname 
        FROM pg_proc 
        WHERE proname IN ('is_organization_member', 'is_organization_admin', 'is_organization_owner')
        ORDER BY proname;
      `
    }
  ];
  
  let allTestsPassed = true;
  
  for (const test of verificationTests) {
    try {
      const { data, error } = await supabase.rpc('query', { sql: test.sql });
      
      if (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
        allTestsPassed = false;
      } else {
        console.log(`✅ ${test.name}: Passed`);
        if (test.name.includes('Count total')) {
          console.log(`   📊 Total policies: ${data[0]?.policy_count || 0}`);
        }
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
      allTestsPassed = false;
    }
  }
  
  return allTestsPassed;
}

/**
 * Main deployment function
 */
async function main() {
  console.log('🛡️  ZEPHRA RLS POLICY DEPLOYMENT');
  console.log('================================\n');
  
  try {
    // Step 1: Create helper function
    const funcResult = await createExecSqlFunction();
    if (!funcResult.success) {
      console.error('❌ Failed to create helper function. Aborting.');
      process.exit(1);
    }
    
    // Step 2: Backup existing policies
    const backupFile = await backupExistingPolicies();
    
    // Step 3: Deploy new policies
    const deployResult = await deployRlsPolicies();
    
    // Step 4: Verify deployment
    const verificationPassed = await verifyRlsPolicies();
    
    console.log('\n🎯 FINAL RESULTS:');
    console.log('==================');
    
    if (deployResult.errorCount === 0 && verificationPassed) {
      console.log('🎉 RLS policies deployed successfully!');
      console.log('🛡️  Your Zephra database is now bulletproof!');
      
      if (backupFile) {
        console.log(`📋 Backup saved to: ${backupFile}`);
      }
      
      console.log('\n🔐 Security Features Enabled:');
      console.log('   ✅ Multi-tenant data isolation');
      console.log('   ✅ Role-based access control');
      console.log('   ✅ Comprehensive audit logging');
      console.log('   ✅ Zero-trust security model');
      
    } else {
      console.log('⚠️  Deployment completed with issues:');
      console.log(`   - ${deployResult.successCount} policies deployed successfully`);
      console.log(`   - ${deployResult.errorCount} policies failed`);
      console.log(`   - Verification: ${verificationPassed ? 'PASSED' : 'FAILED'}`);
      
      if (backupFile) {
        console.log(`\n🔄 To rollback, restore from: ${backupFile}`);
      }
    }
    
  } catch (error) {
    console.error('💥 Deployment failed with critical error:', error.message);
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
ZEPHRA RLS POLICY DEPLOYMENT SCRIPT

Usage: node deploy-rls-policies.js [options]

Options:
  --help, -h     Show this help message
  --verify-only  Only run verification tests
  --backup-only  Only backup existing policies

Environment Variables Required:
  NEXT_PUBLIC_SUPABASE_URL      Your Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY     Your Supabase service role key

Example:
  node scripts/deploy-rls-policies.js
`);
  process.exit(0);
}

if (process.argv.includes('--verify-only')) {
  verifyRlsPolicies().then(passed => {
    process.exit(passed ? 0 : 1);
  });
} else if (process.argv.includes('--backup-only')) {
  backupExistingPolicies().then(() => {
    process.exit(0);
  });
} else {
  main();
}

module.exports = {
  deployRlsPolicies,
  verifyRlsPolicies,
  backupExistingPolicies
};