'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation' // <--- 1. IMPORT ROUTER
import { ArrowRight, CheckCircle2, Eye, EyeOff, HeartPulse, Loader2, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter() // <--- 2. INITIALIZE ROUTER
  const [showPassword, setShowPassword] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSignedIn(true)
    setIsLoading(true)

    // <--- 3. REDIRECT TO DASHBOARD (/)
    setTimeout(() => {
      router.push('/')
    }, 600)
  }

  function handleAbdmLogin() {
    setIsLoading(true)
    setTimeout(() => {
      router.push('/')
    }, 500)
  }

  return (
    <main className="login-shell min-h-screen overflow-hidden text-white bg-slate-950">
      <div className="login-stars" aria-hidden="true" />
      <div className="login-orbit login-orbit-one" aria-hidden="true" />
      <div className="login-orbit login-orbit-two" aria-hidden="true" />

      <header className="relative z-10 flex items-center justify-between px-6 py-6 lg:px-10">
        <Link href="/" className="flex items-center gap-3" aria-label="Netra-AI home">
          <div className="login-brand-mark bg-emerald-500/20 p-2 rounded-xl border border-emerald-500/30 text-emerald-400">
            <HeartPulse />
          </div>
          <div>
            <div className="text-lg font-bold tracking-[-0.04em]">
              Netra<span className="text-[#80dbe5]">-AI</span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[#8799b4]">Retinal intelligence</div>
          </div>
        </Link>
        <div className="hidden items-center gap-2 text-xs text-[#90a2bb] sm:flex">
          <span className="size-1.5 rounded-full bg-[#70d8c4] shadow-[0_0_10px_#70d8c4]" />
          Secure clinical network
        </div>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-104px)] max-w-6xl items-center gap-12 px-6 pb-12 pt-4 lg:grid-cols-[1fr_430px] lg:px-10">
        <div className="hidden max-w-xl lg:block">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#46607b]/60 bg-[#13233a]/60 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9bb8d2]">
            <Sparkles className="size-3.5 text-[#80dbe5]" /> Mission control
          </div>
          <h1 className="max-w-lg text-5xl font-semibold leading-[1.05] tracking-[-0.055em] text-[#f4f8ff] xl:text-6xl">
            Clarity for every <span className="text-[#8be0e6]">care journey.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-[#a7b7cb]">
            Netra-AI helps frontline teams screen retinal images with confidence, even where specialist access is limited.
          </p>
          <div className="mt-10 flex flex-col gap-4 text-sm text-[#bbcadb]">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-4 text-[#78d4c2]" />
              AI-assisted screening calibrated for Indian cohorts
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-4 text-[#78d4c2]" />
              Encrypted patient records with ABDM connectivity
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-4 text-[#78d4c2]" />
              Designed for rural care teams and referral workflows
            </div>
          </div>
        </div>

        <div className="login-card rounded-2xl border border-[#415673]/55 bg-slate-900/90 p-6 shadow-2xl sm:p-8 backdrop-blur">
          <div className="mb-8">
            <div className="mb-5 inline-flex rounded-full border border-[#405a78] bg-[#172940] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#9cb9d5]">
              Clinical access
            </div>
            <h2 className="text-2xl font-semibold tracking-[-0.035em] text-white">Welcome back</h2>
            <p className="mt-2 text-sm leading-6 text-[#91a3bb]">Sign in to continue to your screening workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-xs font-semibold text-[#b4c4d5]">Work email</Label>
              <Input
                id="email"
                type="email"
                defaultValue="doctor@healthmission.in"
                placeholder="doctor@healthmission.in"
                required
                className="h-11 border-[#3b506a] bg-[#101c2d]/80 text-white placeholder:text-[#60738c] focus-visible:ring-[#80dbe5]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-[#b4c4d5]">Password</Label>
                <button type="button" className="text-xs font-semibold text-[#80dbe5] hover:text-white">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  defaultValue="••••••••"
                  placeholder="Enter your password"
                  required
                  className="h-11 border-[#3b506a] bg-[#101c2d]/80 pr-11 text-white placeholder:text-[#60738c] focus-visible:ring-[#80dbe5]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-3 text-[#7187a0] hover:text-white"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="mt-2 h-11 gap-2 bg-[#dff9fb] font-bold text-[#10283b] hover:bg-white transition"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Verifying Credentials...
                </>
              ) : signedIn ? (
                <>
                  Access Granted <CheckCircle2 className="size-4" />
                </>
              ) : (
                <>
                  Sign in to Netra-AI <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          <div className="my-7 flex items-center gap-3 text-[10px] uppercase tracking-[0.16em] text-[#657992]">
            <span className="h-px flex-1 bg-[#334963]" />
            or
            <span className="h-px flex-1 bg-[#334963]" />
          </div>

          <Button
            type="button"
            onClick={handleAbdmLogin}
            variant="outline"
            className="h-11 w-full border-[#415673] bg-transparent text-[#c8d5e3] hover:bg-[#1a2d45] hover:text-white"
          >
            Continue with ABDM
          </Button>

          <div className="mt-7 flex items-start gap-2.5 border-t border-[#2e4159] pt-5 text-[11px] leading-5 text-[#8093aa]">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#71d1bd]" />
            <span>Your session is protected with encrypted clinical-grade security.</span>
          </div>
        </div>
      </section>

      <footer className="relative z-10 flex items-center justify-between px-6 pb-5 text-[10px] uppercase tracking-[0.14em] text-[#657992] lg:px-10">
        <span className="hidden sm:block">Netra-AI / National Health Mission</span>
        <span className="flex items-center gap-2">
          <LockKeyhole className="size-3" /> HIPAA & ABDM Compliant
        </span>
      </footer>
    </main>
  )
}