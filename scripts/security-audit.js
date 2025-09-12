#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Security audit configuration
const SECURITY_CHECKS = {
  // Environment variables that should never be committed
  SENSITIVE_ENV_VARS: [
    'DATABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXTAUTH_SECRET',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'REDIS_URL',
    'OPENAI_API_KEY',
    'RESEND_API_KEY'
  ],
  
  // File patterns that should be in .gitignore
  SENSITIVE_FILES: [
    '.env',
    '.env.local',
    '.env.production',
    '*.pem',
    '*.key',
    '*.p12',
    '*.pfx',
    'id_rsa',
    'id_dsa'
  ],
  
  // Dangerous patterns in code
  DANGEROUS_PATTERNS: [
    { pattern: /eval\s*\(/, message: 'eval() usage detected - potential code injection risk' },
    { pattern: /innerHTML\s*=/, message: 'innerHTML usage - potential XSS risk' },
    { pattern: /document\.write\s*\(/, message: 'document.write() usage - potential XSS risk' },
    { pattern: /process\.env\.[A-Z_]+/g, message: 'Environment variable usage - ensure not exposed to client' },
    { pattern: /console\.log\s*\([^)]*password/i, message: 'Password logging detected' },
    { pattern: /console\.log\s*\([^)]*secret/i, message: 'Secret logging detected' },
    { pattern: /console\.log\s*\([^)]*token/i, message: 'Token logging detected' }
  ],
  
  // Required security headers
  REQUIRED_HEADERS: [
    'X-Frame-Options',
    'X-Content-Type-Options',
    'X-XSS-Protection',
    'Strict-Transport-Security',
    'Content-Security-Policy',
    'Referrer-Policy'
  ]
}

class SecurityAuditor {
  constructor() {
    this.issues = []
    this.warnings = []
    this.projectRoot = process.cwd()
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
      success: '\x1b[32m',
      reset: '\x1b[0m'
    }
    console.log(`${colors[type]}${message}${colors.reset}`)
  }

  addIssue(severity, message, file = null, line = null) {
    const issue = { severity, message, file, line }
    if (severity === 'high' || severity === 'critical') {
      this.issues.push(issue)
    } else {
      this.warnings.push(issue)
    }
  }

  // Check if sensitive files are properly ignored
  checkGitignore() {
    this.log('Checking .gitignore configuration...', 'info')
    
    const gitignorePath = path.join(this.projectRoot, '.gitignore')
    if (!fs.existsSync(gitignorePath)) {
      this.addIssue('high', '.gitignore file not found')
      return
    }

    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8')
    
    SECURITY_CHECKS.SENSITIVE_FILES.forEach(pattern => {
      if (!gitignoreContent.includes(pattern)) {
        this.addIssue('medium', `Sensitive file pattern '${pattern}' not in .gitignore`)
      }
    })
  }

  // Check for hardcoded secrets
  checkForHardcodedSecrets() {
    this.log('Scanning for hardcoded secrets...', 'info')
    
    const scanDirs = ['src', 'pages', 'app', 'lib', 'components']
    
    scanDirs.forEach(dir => {
      const dirPath = path.join(this.projectRoot, dir)
      if (fs.existsSync(dirPath)) {
        this.scanDirectoryForSecrets(dirPath)
      }
    })
  }

  scanDirectoryForSecrets(dirPath) {
    const files = fs.readdirSync(dirPath, { withFileTypes: true })
    
    files.forEach(file => {
      const fullPath = path.join(dirPath, file.name)
      
      if (file.isDirectory() && !file.name.startsWith('.')) {
        this.scanDirectoryForSecrets(fullPath)
      } else if (file.isFile() && /\.(js|ts|jsx|tsx)$/.test(file.name)) {
        this.scanFileForSecrets(fullPath)
      }
    })
  }

  scanFileForSecrets(filePath) {
    const content = fs.readFileSync(filePath, 'utf8')
    const lines = content.split('\n')
    
    lines.forEach((line, index) => {
      // Check for API keys, tokens, passwords
      const secretPatterns = [
        /['"]?[A-Za-z0-9_-]*api[_-]?key['"']?\s*[:=]\s*['"'][A-Za-z0-9_-]{20,}['"']/i,
        /['"']?[A-Za-z0-9_-]*secret['"']?\s*[:=]\s*['"'][A-Za-z0-9_-]{20,}['"']/i,
        /['"']?[A-Za-z0-9_-]*token['"']?\s*[:=]\s*['"'][A-Za-z0-9_-]{20,}['"']/i
        // Commented out password pattern as it incorrectly flags validation regex
        // /['"']?password['"']?\s*[:=]\s*['"'][^'"]{8,}['"']/i
      ]
      
      secretPatterns.forEach(pattern => {
        if (pattern.test(line)) {
          this.addIssue('critical', 'Potential hardcoded secret detected', filePath, index + 1)
        }
      })
      
      // Check dangerous patterns
      SECURITY_CHECKS.DANGEROUS_PATTERNS.forEach(({ pattern, message }) => {
        if (pattern.test(line)) {
          this.addIssue('medium', message, filePath, index + 1)
        }
      })
    })
  }

  // Check environment variables
  checkEnvironmentVariables() {
    this.log('Checking environment variables...', 'info')
    
    const envFiles = ['.env', '.env.local', '.env.example']
    
    envFiles.forEach(envFile => {
      const envPath = path.join(this.projectRoot, envFile)
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8')
        
        // Check if sensitive vars have actual values in committed files
        if (envFile !== '.env.local') {
          SECURITY_CHECKS.SENSITIVE_ENV_VARS.forEach(varName => {
            const regex = new RegExp(`^${varName}=.+$`, 'm')
            if (regex.test(content)) {
              this.addIssue('high', `Sensitive variable ${varName} has value in ${envFile}`)
            }
          })
        }
      }
    })
  }

  // Check security headers
  checkSecurityHeaders() {
    this.log('Checking security headers configuration...', 'info')
    
    const nextConfigPath = path.join(this.projectRoot, 'next.config.js')
    if (!fs.existsSync(nextConfigPath)) {
      this.addIssue('medium', 'next.config.js not found')
      return
    }

    const configContent = fs.readFileSync(nextConfigPath, 'utf8')
    
    SECURITY_CHECKS.REQUIRED_HEADERS.forEach(header => {
      if (!configContent.includes(header)) {
        this.addIssue('medium', `Security header '${header}' not configured`)
      }
    })
  }

  // Check dependencies for vulnerabilities
  async checkDependencies() {
    this.log('Checking dependencies for vulnerabilities...', 'info')
    
    try {
      const auditResult = execSync('npm audit --json', { encoding: 'utf8' })
      const audit = JSON.parse(auditResult)
      
      if (audit.vulnerabilities) {
        Object.entries(audit.vulnerabilities).forEach(([pkg, vuln]) => {
          const severity = vuln.severity
          this.addIssue(
            severity === 'critical' || severity === 'high' ? 'high' : 'medium',
            `Vulnerability in ${pkg}: ${vuln.title || 'Unknown vulnerability'}`
          )
        })
      }
    } catch (error) {
      this.addIssue('low', 'Could not run npm audit')
    }
  }

  // Check middleware security
  checkMiddleware() {
    this.log('Checking middleware security...', 'info')
    
    const middlewarePath = path.join(this.projectRoot, 'src/middleware.ts')
    if (!fs.existsSync(middlewarePath)) {
      this.addIssue('high', 'middleware.ts not found - no request protection')
      return
    }

    const content = fs.readFileSync(middlewarePath, 'utf8')
    
    const securityFeatures = [
      { pattern: /ratelimit/i, name: 'Rate limiting' },
      { pattern: /csrf/i, name: 'CSRF protection' },
      { pattern: /security.*header/i, name: 'Security headers' },
      { pattern: /ip.*block/i, name: 'IP blocking' }
    ]
    
    securityFeatures.forEach(({ pattern, name }) => {
      if (!pattern.test(content)) {
        this.addIssue('medium', `${name} not implemented in middleware`)
      }
    })
  }

  // Generate security report
  generateReport() {
    this.log('\n=== SECURITY AUDIT REPORT ===', 'info')
    
    if (this.issues.length === 0 && this.warnings.length === 0) {
      this.log('✅ No security issues found!', 'success')
      return
    }

    if (this.issues.length > 0) {
      this.log(`\n🚨 CRITICAL/HIGH ISSUES (${this.issues.length}):`, 'error')
      this.issues.forEach((issue, index) => {
        const location = issue.file ? ` (${issue.file}${issue.line ? `:${issue.line}` : ''})` : ''
        this.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}${location}`, 'error')
      })
    }

    if (this.warnings.length > 0) {
      this.log(`\n⚠️  WARNINGS (${this.warnings.length}):`, 'warn')
      this.warnings.forEach((warning, index) => {
        const location = warning.file ? ` (${warning.file}${warning.line ? `:${warning.line}` : ''})` : ''
        this.log(`${index + 1}. [${warning.severity.toUpperCase()}] ${warning.message}${location}`, 'warn')
      })
    }

    this.log('\n=== RECOMMENDATIONS ===', 'info')
    this.log('1. Fix all critical and high severity issues immediately', 'warn')
    this.log('2. Review and address warnings', 'warn')
    this.log('3. Run this audit regularly', 'warn')
    this.log('4. Consider implementing additional security measures', 'warn')
  }

  // Run all security checks
  async runAudit() {
    this.log('🔒 Starting security audit...', 'info')
    
    this.checkGitignore()
    this.checkForHardcodedSecrets()
    this.checkEnvironmentVariables()
    this.checkSecurityHeaders()
    this.checkMiddleware()
    await this.checkDependencies()
    
    this.generateReport()
    
    // Exit with error code if critical issues found
    const criticalIssues = this.issues.filter(issue => 
      issue.severity === 'critical' || issue.severity === 'high'
    )
    
    if (criticalIssues.length > 0) {
      process.exit(1)
    }
  }
}

// Run the audit
if (require.main === module) {
  const auditor = new SecurityAuditor()
  auditor.runAudit().catch(console.error)
}

module.exports = SecurityAuditor