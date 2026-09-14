// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect } from 'react'
import { configManagementService } from '@/services/configManagement.service'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Label } from '@/components/atoms/label'
import { useToast } from '@/components/molecules/toaster/use-toast'
import { Spinner } from '@/components/atoms/spinner'
import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { pushSiteConfigEdit } from '@/utils/siteConfigHistory'
import { TbMail, TbEye, TbEyeOff, TbSend } from 'react-icons/tb'

interface EmailConfig {
  provider: 'none' | 'resend' | 'smtp'
  fromName: string
  fromEmail: string
  apiKey: string
  smtpConfig: {
    host: string
    port: number
    user: string
    pass: string
    secure: boolean
  }
}

const DEFAULT_EMAIL_CONFIG: EmailConfig = {
  provider: 'none',
  fromName: '',
  fromEmail: '',
  apiKey: '',
  smtpConfig: {
    host: '',
    port: 587,
    user: '',
    pass: '',
    secure: false,
  },
}

const EMAIL_CONFIG_KEY = 'EMAIL_CONFIG'

const EmailConfigSection: React.FC = () => {
  const { data: user, isLoading: isUserLoading } = useSelfProfileQuery()
  const [config, setConfig] = useState<EmailConfig>(DEFAULT_EMAIL_CONFIG)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [showSmtpPass, setShowSmtpPass] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isUserLoading || !user) return
    loadConfig()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUserLoading, !!user])

  const loadConfig = async () => {
    try {
      setIsLoading(true)
      const response = await configManagementService.getConfigs({
        key: EMAIL_CONFIG_KEY,
        category: 'email',
        scope: 'site',
      })

      if (response.results && response.results.length > 0) {
        const saved = response.results[0].value
        if (saved && typeof saved === 'object') {
          setConfig({
            ...DEFAULT_EMAIL_CONFIG,
            ...saved,
            smtpConfig: {
              ...DEFAULT_EMAIL_CONFIG.smtpConfig,
              ...(saved.smtpConfig || {}),
            },
          })
        }
      }
    } catch (error) {
      console.error('Failed to load email config:', error)
      toast({
        title: 'Load failed',
        description: 'Failed to load email configuration',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    // Validate
    if (config.provider !== 'none') {
      if (!config.fromEmail) {
        toast({
          title: 'Validation error',
          description: 'From Email is required',
          variant: 'destructive',
        })
        return
      }
      if (config.provider === 'resend' && !config.apiKey) {
        toast({
          title: 'Validation error',
          description: 'API Key is required for Resend',
          variant: 'destructive',
        })
        return
      }
      if (config.provider === 'smtp' && !config.smtpConfig.host) {
        toast({
          title: 'Validation error',
          description: 'SMTP Host is required',
          variant: 'destructive',
        })
        return
      }
    }

    try {
      setIsSaving(true)
      const response = await configManagementService.getConfigs({
        key: EMAIL_CONFIG_KEY,
        category: 'email',
        scope: 'site',
      })

      const valueBefore =
        response.results && response.results.length > 0
          ? response.results[0].value
          : undefined

      if (response.results && response.results.length > 0) {
        await configManagementService.updateConfigById(response.results[0].id!, {
          value: config,
        })
      } else {
        await configManagementService.createConfig({
          key: EMAIL_CONFIG_KEY,
          scope: 'site',
          category: 'email',
          value: config,
          valueType: 'object',
          secret: true,
        })
      }

      pushSiteConfigEdit({
        key: EMAIL_CONFIG_KEY,
        valueBefore,
        valueAfter: config,
        valueType: 'object',
        section: 'email',
      })

      toast({
        title: 'Saved',
        description: 'Email configuration saved successfully',
      })
    } catch (error) {
      console.error('Failed to save email config:', error)
      toast({
        title: 'Save failed',
        description: 'Failed to save email configuration',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: 'Validation error',
        description: 'Please enter a test email address',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsTesting(true)
      const { serverAxios } = await import('@/services/base')
      await serverAxios.post('/site-config/email/test', { to: testEmail })
      toast({
        title: 'Test email sent',
        description: `Test email sent to ${testEmail}`,
      })
    } catch (error: any) {
      toast({
        title: 'Test failed',
        description: error?.response?.data?.message || 'Failed to send test email. Make sure you save the config first.',
        variant: 'destructive',
      })
    } finally {
      setIsTesting(false)
    }
  }

  if (isUserLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size={32} />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Please sign in to manage email configuration.</p>
      </div>
    )
  }

  return (
    <>
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-foreground">Email Configuration</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure email service for sending transactional emails (welcome, password reset, etc.)
          </p>
        </div>
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving && <Spinner className="mr-2" size={16} />}
          Save
        </Button>
      </div>

      <div className="p-6 space-y-6">
        {/* Provider Selection */}
        <div>
          <Label className="text-sm font-medium">Email Provider</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Choose the email service to use for sending emails
          </p>
          <div className="grid grid-cols-3 gap-3 mt-1">
            {(['none', 'resend', 'smtp'] as const).map((provider) => (
              <button
                key={provider}
                onClick={() => {
                  const updated = { ...config, provider }
                  // Set default from email for Resend (sandbox domain works without verification)
                  if (provider === 'resend' && !config.fromEmail) {
                    updated.fromEmail = 'onboarding@resend.dev'
                    updated.fromName = updated.fromName || 'digital.auto'
                  }
                  setConfig(updated)
                }}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  config.provider === provider
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <div className="font-medium text-sm">
                  {provider === 'none' && 'Disabled'}
                  {provider === 'resend' && 'Resend'}
                  {provider === 'smtp' && 'Custom SMTP'}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {provider === 'none' && 'No email service configured'}
                  {provider === 'resend' && 'Modern email API service'}
                  {provider === 'smtp' && 'Use your own SMTP server'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {config.provider !== 'none' && (
          <>
            {/* Common Fields */}
            <div className="border-t border-border pt-6 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Sender Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    value={config.fromName}
                    onChange={(e) => setConfig({ ...config, fromName: e.target.value })}
                    placeholder="e.g., My App"
                  />
                </div>
                <div>
                  <Label htmlFor="fromEmail">From Email *</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={config.fromEmail}
                    onChange={(e) => setConfig({ ...config, fromEmail: e.target.value })}
                    placeholder={config.provider === 'resend' ? 'onboarding@resend.dev' : 'e.g., noreply@example.com'}
                  />
                  {config.provider === 'resend' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Use <code className="text-xs bg-muted px-1 rounded">onboarding@resend.dev</code> for testing. For production, verify your domain at resend.com/domains.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Resend Config */}
            {config.provider === 'resend' && (
              <div className="border-t border-border pt-6 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Resend Configuration</h3>
                <div>
                  <Label htmlFor="apiKey">API Key *</Label>
                  <div className="relative">
                    <Input
                      id="apiKey"
                      type={showApiKey ? 'text' : 'password'}
                      value={config.apiKey}
                      onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                      placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="font-mono text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showApiKey ? <TbEyeOff size={18} /> : <TbEye size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Get your API key from{' '}
                    <a
                      href="https://resend.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      resend.com/api-keys
                    </a>
                    . This value is stored encrypted.
                  </p>
                </div>
              </div>
            )}

            {/* SMTP Config */}
            {config.provider === 'smtp' && (
              <div className="border-t border-border pt-6 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">SMTP Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtpHost">SMTP Host *</Label>
                    <Input
                      id="smtpHost"
                      value={config.smtpConfig.host}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          smtpConfig: { ...config.smtpConfig, host: e.target.value },
                        })
                      }
                      placeholder="e.g., smtp.gmail.com"
                      className="font-mono text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={config.smtpConfig.port}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          smtpConfig: { ...config.smtpConfig, port: parseInt(e.target.value) || 587 },
                        })
                      }
                      placeholder="587"
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtpUser">SMTP Username</Label>
                    <Input
                      id="smtpUser"
                      value={config.smtpConfig.user}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          smtpConfig: { ...config.smtpConfig, user: e.target.value },
                        })
                      }
                      placeholder="username or email"
                      className="font-mono text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtpPass">SMTP Password</Label>
                    <div className="relative">
                      <Input
                        id="smtpPass"
                        type={showSmtpPass ? 'text' : 'password'}
                        value={config.smtpConfig.pass}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            smtpConfig: { ...config.smtpConfig, pass: e.target.value },
                          })
                        }
                        placeholder="SMTP password or app password"
                        className="font-mono text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSmtpPass(!showSmtpPass)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showSmtpPass ? <TbEyeOff size={18} /> : <TbEye size={18} />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      This value is stored encrypted.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="smtpSecure"
                    checked={config.smtpConfig.secure}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        smtpConfig: { ...config.smtpConfig, secure: e.target.checked },
                      })
                    }
                    className="rounded"
                  />
                  <Label htmlFor="smtpSecure" className="cursor-pointer">
                    Use TLS/SSL (typically for port 465)
                  </Label>
                </div>
              </div>
            )}

            {/* Test Email */}
            <div className="border-t border-border pt-6 space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <TbMail size={16} />
                Send Test Email
              </h3>
              <p className="text-xs text-muted-foreground">
                Save your configuration first, then send a test email to verify it works.
              </p>
              <div className="flex gap-2">
                <Input
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="recipient@example.com"
                  type="email"
                  className="max-w-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSendTestEmail}
                  disabled={isTesting || !testEmail}
                >
                  {isTesting ? <Spinner className="mr-2" size={16} /> : <TbSend className="mr-2" size={16} />}
                  Send Test
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default EmailConfigSection
