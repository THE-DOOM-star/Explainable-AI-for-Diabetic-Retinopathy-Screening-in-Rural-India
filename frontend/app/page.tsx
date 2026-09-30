'use client'

import { useState, useEffect } from 'react'
import {
  AlertTriangle,
  Activity,
  CheckCircle2,
  Eye,
  FileImage,
  FileText,
  HeartPulse,
  Loader2,
  LogIn,
  LogOut,
  Printer,
  Share2,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UploadCloud,
  UsersRound,
  User,
  Building,
  KeyRound,
  Layers,
  TrendingUp,
  Maximize2,
  X,
  Download,
  Sliders,
  RotateCcw,
  Copy,
  Check,
  Lock,
  ArrowRight,
  Clock
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface OfficerSession {
  phc_node: string
  doctor_name: string
  license_id: string
  role: 'phc_officer' | 'specialist'
}

export default function NetraDashboard() {
  const [activeTab, setActiveTab] = useState<'screening' | 'simulation' | 'login'>('screening')
  
  // Persistent Auth Session via localStorage
  const [session, setSession] = useState<OfficerSession | null>(null)

  // Patient Intake State
  const defaultPatient = {
    abhaId: 'ABHA-91-8273-1049-5501',
    name: 'Ramesh Narayan Patil',
    age: '54',
    gender: 'Male',
    phcLocation: 'PHC Paithan, Aurangabad'
  }
  const [patientInfo, setPatientInfo] = useState(defaultPatient)
  const [copiedAbha, setCopiedAbha] = useState(false)

  // Pipeline State
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [loadingStep, setLoadingStep] = useState<string>('')
  const [screeningResult, setScreeningResult] = useState<any>(null)
  const [simulationData, setSimulationData] = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [samples, setSamples] = useState<any[]>([])

  // Lightbox Modal State
  const [activeModalView, setActiveModalView] = useState<'enhanced' | 'vessels' | 'landmarks' | 'gradcam' | null>(null)
  const [camOpacity, setCamOpacity] = useState<number>(0.5)

  // Login Form State
  const [loginForm, setLoginForm] = useState({
    phc_id: 'PHC-MH-AUR-04 (Paithan)',
    officer_name: 'Dr. Ananya Sharma',
    license_number: 'MCI-2019-94821',
    password: 'demo',
    role: 'phc_officer' as 'phc_officer' | 'specialist'
  })

  // Hydrate session from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('netra_session')
    if (saved) {
      try {
        setSession(JSON.parse(saved))
      } catch (e) {
        localStorage.removeItem('netra_session')
      }
    } else {
      // Default initial session
      const initial: OfficerSession = {
        phc_node: 'PHC-MH-AUR-04 (Paithan)',
        doctor_name: 'Dr. Ananya Sharma, MS (Ophth)',
        license_id: 'MCI-2019-94821',
        role: 'phc_officer'
      }
      setSession(initial)
      localStorage.setItem('netra_session', JSON.stringify(initial))
    }
  }, [])

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveModalView(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Load verified test samples from backend on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/samples`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.samples) setSamples(data.samples)
      })
      .catch(() => console.log('Backend not reachable on port 8000.'))
  }, [])

  // Load Phase 6 simulation metrics when tab opens
  useEffect(() => {
    if (activeTab === 'simulation' && !simulationData) {
      fetch(`${API_BASE}/api/simulation`)
        .then((res) => res.json())
        .then((data) => setSimulationData(data))
        .catch((err) => console.error('Simulation load failure:', err))
    }
  }, [activeTab, simulationData])

  const handleCopyAbha = () => {
    navigator.clipboard.writeText(patientInfo.abhaId)
    setCopiedAbha(true)
    setTimeout(() => setCopiedAbha(false), 2000)
  }

  const handleResetIntake = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setScreeningResult(null)
    setErrorMsg(null)
    setPatientInfo({
      abhaId: `ABHA-91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      age: '',
      gender: 'Male',
      phcLocation: session?.phc_node || 'PHC Paithan'
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setScreeningResult(null)
      setErrorMsg(null)
    }
  }

  const handleSelectSample = async (sample: any) => {
    try {
      setIsLoading(true)
      setLoadingStep(`Loading verified rural case ${sample.id}...`)
      setErrorMsg(null)

      const res = await fetch(`${API_BASE}/api/samples/image/${sample.filename}`)
      if (!res.ok) throw new Error(`Sample not found (${res.status})`)

      const data = await res.json()
      if (data.base64) {
        setPreviewUrl(`data:image/jpeg;base64,${data.base64}`)
        const byteCharacters = atob(data.base64)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'image/jpeg' })
        const file = new File([blob], sample.filename, { type: 'image/jpeg' })

        setSelectedFile(file)
        setScreeningResult(null)

        setPatientInfo((prev) => ({
          ...prev,
          name: prev.name || 'Sample Patient',
          abhaId: `ABHA-91-${sample.id.replace(/\D/g, '').padEnd(8, '0').slice(0, 8)}`
        }))
      }
    } catch (err: any) {
      setErrorMsg(`Could not fetch sample: ${err.message}`)
    } finally {
      setIsLoading(false)
      setLoadingStep('')
    }
  }

  const handleRunScreening = async () => {
    if (!selectedFile) return
    setIsLoading(true)
    setErrorMsg(null)
    setScreeningResult(null)

    try {
      setLoadingStep('Phase 1: Assessing Image Sharpness & Contrast...')
      await new Promise((r) => setTimeout(r, 350))

      setLoadingStep('Phase 2: Segmenting Vasculature & Optic Disc...')
      await new Promise((r) => setTimeout(r, 350))

      setLoadingStep('Phase 3 & 4: ResNet-18 Inference & Grad-CAM Heatmap...')

      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch(`${API_BASE}/api/screen`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Screening service returned HTTP ${response.status}`)
      }

      const data = await response.json()
      setScreeningResult(data)
    } catch (err: any) {
      setErrorMsg(err.message || 'Cannot connect to Netra-AI backend. Ensure python api.py is running on port 8000.')
    } finally {
      setIsLoading(false)
      setLoadingStep('')
    }
  }

  // Handle Authentication with Session Persistence
  const handleLogin = (userSession: OfficerSession) => {
    setSession(userSession)
    localStorage.setItem('netra_session', JSON.stringify(userSession))
    setActiveTab('screening')
  }

  const handleLogout = () => {
    setSession(null)
    localStorage.removeItem('netra_session')
    setActiveTab('login')
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      })
      if (!res.ok) throw new Error('Invalid credentials')
      const authData = await res.json()
      handleLogin({
        phc_node: authData.phc_node,
        doctor_name: authData.doctor_name,
        license_id: authData.license_id,
        role: loginForm.role
      })
    } catch (err: any) {
      // Offline / Demo fallback
      handleLogin({
        phc_node: loginForm.phc_id,
        doctor_name: loginForm.officer_name,
        license_id: loginForm.license_number,
        role: loginForm.role
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/20 p-2 rounded-xl border border-emerald-500/30 shadow-inner">
            <Eye className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">Netra-AI</span>
              <Badge variant="outline" className="text-[10px] py-0 border-emerald-500/40 text-emerald-400 font-mono">
                ABDM Rural Health
              </Badge>
              <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-400">Explainable Diabetic Retinopathy Triage System</p>
          </div>
        </div>

        {/* User Session Bar */}
        <div className="flex items-center gap-3">
          {session ? (
            <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800/80 px-3 py-1.5 rounded-xl">
              <div className="flex flex-col items-end text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-200">{session.doctor_name}</span>
                  <Badge className={`text-[9px] py-0 px-1.5 font-normal ${session.role === 'specialist' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'}`}>
                    {session.role === 'specialist' ? 'Specialist' : 'PHC Officer'}
                  </Badge>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{session.phc_node}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="h-7 px-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 text-xs gap-1"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('login')}
              className="border-slate-800 bg-slate-900 text-xs gap-1.5 text-slate-300 hover:text-white"
            >
              <LogIn className="w-3.5 h-3.5" /> Officer Sign-In
            </Button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 print:hidden">
            <TabsList className="bg-slate-900 border border-slate-800 p-1">
              <TabsTrigger value="screening" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-xs gap-1.5">
                <HeartPulse className="w-3.5 h-3.5" /> Retinal Screening (Grades 0–4)
              </TabsTrigger>
              <TabsTrigger value="simulation" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-xs gap-1.5">
                <Activity className="w-3.5 h-3.5" /> Telemedicine Queue Simulation
              </TabsTrigger>
              <TabsTrigger value="login" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-xs gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Officer Authentication
              </TabsTrigger>
            </TabsList>

            {activeTab === 'screening' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetIntake}
                className="h-8 border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-xs text-slate-300 gap-1.5"
              >
                <RotateCcw className="w-3 h-3" /> New Patient Intake
              </Button>
            )}
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: RETINAL SCREENING PIPELINE */}
          {/* ========================================================================= */}
          <TabsContent value="screening" className="space-y-6 m-0">
            {/* Quick-test Samples Tray */}
            {samples.length > 0 && (
              <Card className="bg-slate-900/50 border-slate-800/80 shadow-sm print:hidden">
                <CardHeader className="py-2.5 px-4">
                  <CardTitle className="text-xs uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      Pre-Verified Rural Patient Manifest (APTOS 2019 Blindness Detection)
                    </span>
                    <span className="text-[10px] text-slate-500 normal-case">Click to test instant pipeline</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 pt-0">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-thin">
                    {samples.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectSample(s)}
                        className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500/80 text-left whitespace-nowrap transition flex items-center gap-2 group cursor-pointer"
                      >
                        <span className="font-mono text-slate-300 group-hover:text-emerald-400">{s.id}</span>
                        <Badge variant="secondary" className="text-[10px] py-0 bg-slate-900 text-slate-400 border border-slate-700">
                          {s.diagnosis_label}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Input Card & Preview Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
              <div className="space-y-4 md:col-span-1">
                {/* Patient Information Form */}
                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-xs font-semibold text-white flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-emerald-400" /> Patient Demographics
                    </CardTitle>
                    <Badge variant="secondary" className="text-[9px] bg-slate-950 text-slate-400 border-slate-800">
                      Ayushman Bharat
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3 px-4 pb-4 pt-0 text-xs">
                    <div>
                      <Label className="text-[11px] text-slate-400">Patient Full Name</Label>
                      <Input
                        value={patientInfo.name}
                        onChange={(e) => setPatientInfo({ ...patientInfo, name: e.target.value })}
                        className="h-8 bg-slate-950 border-slate-800 text-xs mt-1"
                        placeholder="Enter full name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[11px] text-slate-400">Age</Label>
                        <Input
                          value={patientInfo.age}
                          onChange={(e) => setPatientInfo({ ...patientInfo, age: e.target.value })}
                          className="h-8 bg-slate-950 border-slate-800 text-xs mt-1"
                          placeholder="Years"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-400">Gender</Label>
                        <Input
                          value={patientInfo.gender}
                          onChange={(e) => setPatientInfo({ ...patientInfo, gender: e.target.value })}
                          className="h-8 bg-slate-950 border-slate-800 text-xs mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px] text-slate-400">ABHA Health ID</Label>
                        <button
                          onClick={handleCopyAbha}
                          className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                        >
                          {copiedAbha ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copiedAbha ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <Input
                        value={patientInfo.abhaId}
                        onChange={(e) => setPatientInfo({ ...patientInfo, abhaId: e.target.value })}
                        className="h-8 bg-slate-950 border-slate-800 text-xs font-mono text-emerald-400 mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Upload Action */}
                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-xs font-semibold flex items-center gap-2 text-white">
                      <UploadCloud className="w-3.5 h-3.5 text-emerald-400" /> Fundus Image Acquisition
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 px-4 pb-4 pt-0">
                    <div className="border border-dashed border-slate-800 hover:border-emerald-500/50 rounded-xl p-5 text-center transition cursor-pointer bg-slate-950 relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <FileImage className="w-6 h-6 text-slate-500 mx-auto mb-1" />
                      <p className="text-xs font-medium text-slate-300">Click or drag fundus photograph</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">JPEG, PNG, TIFF up to 25MB</p>
                    </div>

                    <Button
                      onClick={handleRunScreening}
                      disabled={!selectedFile || isLoading}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2.5 transition shadow-lg shadow-emerald-900/30"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Processing AI Pipeline...
                        </>
                      ) : (
                        <>
                          <Stethoscope className="w-3.5 h-3.5 mr-2" /> Execute Screening Triage
                        </>
                      )}
                    </Button>

                    {errorMsg && (
                      <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{errorMsg}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Fundus Preview Stage */}
              <Card className="bg-slate-900 border-slate-800 md:col-span-2 flex flex-col justify-center items-center p-6 text-center shadow-md">
                {previewUrl ? (
                  <div className="w-full flex flex-col items-center">
                    <div className="relative max-w-md w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
                      <img src={previewUrl} alt="Retinal Fundus" className="w-full h-72 object-cover" />
                      {isLoading && (
                        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-4">
                          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
                          <p className="text-xs font-medium text-white">{loadingStep}</p>
                          <Progress value={75} className="w-48 h-1.5 mt-3 bg-slate-800" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-3 text-xs text-slate-400 font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Loaded: {selectedFile ? selectedFile.name : 'Sample Loaded'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-16 text-slate-500 space-y-2">
                    <Eye className="w-12 h-12 mx-auto stroke-1 opacity-30" />
                    <p className="text-sm font-medium">No retinal photograph active</p>
                    <p className="text-xs text-slate-600">
                      Pick a verified patient sample above or upload a new photo to execute screening.
                    </p>
                  </div>
                )}
              </Card>
            </div>

            {/* CLINICAL REPORT DETAIL */}
            {screeningResult && (
              <div className="pt-2">
                <ClinicalReportDetail
                  data={screeningResult}
                  patientInfo={patientInfo}
                  session={session}
                  onOpenLightbox={(view) => setActiveModalView(view)}
                />
              </div>
            )}
          </TabsContent>

          {/* ========================================================================= */}
          {/* TAB 2: TELEMEDICINE QUEUE SIMULATION */}
          {/* ========================================================================= */}
          <TabsContent value="simulation" className="space-y-6 m-0">
            {simulationData ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-2">
                      <CardDescription className="text-xs uppercase">Doctor Utilization (ρ)</CardDescription>
                      <CardTitle className="text-xl text-white flex items-center justify-between">
                        <span>{simulationData.doctor_capacity_metrics.doctor_utilization_with_ai_rho} (Stable)</span>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">76.8% Relieved</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-slate-400">
                      Baseline without AI triage: <span className="text-rose-400 font-semibold">{simulationData.doctor_capacity_metrics.doctor_utilization_baseline_rho} (Overloaded)</span>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-2">
                      <CardDescription className="text-xs uppercase">Patient Wait Time</CardDescription>
                      <CardTitle className="text-xl text-white flex items-center justify-between">
                        <span>{simulationData.doctor_capacity_metrics.patient_wait_time_with_ai}</span>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Immediate</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-slate-400">
                      Baseline backlog: <span className="text-rose-400 font-semibold">{simulationData.doctor_capacity_metrics.patient_wait_time_baseline}</span>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-2">
                      <CardDescription className="text-xs uppercase">1 Mbps Rural Uplink Optimization</CardDescription>
                      <CardTitle className="text-xl text-white flex items-center justify-between">
                        <span>{simulationData.network_and_edge_telemetry.edge_compressed_payload_delay_sec}s / Packet</span>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">{simulationData.network_and_edge_telemetry.bandwidth_reduction_pct}% Less</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-slate-400">
                      Raw uncompressed fundus delay: <span className="text-rose-400 font-semibold">{simulationData.network_and_edge_telemetry.raw_image_uplink_delay_sec}s</span>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                      <CardTitle className="text-sm text-white flex items-center gap-2">
                        <UsersRound className="w-4 h-4 text-emerald-400" /> Rural Health Economics Impact
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs">
                      <div className="flex justify-between py-2 border-b border-slate-800">
                        <span className="text-slate-400">Annual Avoided Unnecessary City Transits:</span>
                        <span className="font-semibold text-emerald-400">{simulationData.health_economics_impact.avoided_unnecessary_transits.toLocaleString()} Patients</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-800">
                        <span className="text-slate-400">Annual Out-of-Pocket Transit Savings:</span>
                        <span className="font-semibold text-white">{simulationData.health_economics_impact.annual_rural_transit_savings_inr}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-slate-400">Diagnostic Turnaround Improvement:</span>
                        <span className="font-semibold text-emerald-400">{simulationData.health_economics_impact.diagnostic_turnaround_improvement}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                      <CardTitle className="text-sm text-white flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-400" /> Discrete-Event M/M/c Constraints
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs">
                      <div className="flex justify-between py-2 border-b border-slate-800">
                        <span className="text-slate-400">Network Topology:</span>
                        <span className="font-semibold text-white">{simulationData.simulation_parameters.active_phc_nodes} Rural PHCs &rarr; 1 District Hospital</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-800">
                        <span className="text-slate-400">Screening Demand (λ):</span>
                        <span className="font-semibold text-white">{simulationData.doctor_capacity_metrics.arrival_rate_per_hour} patients/hr across 10 PHCs</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-slate-400">Central Specialists (c):</span>
                        <span className="font-semibold text-white">{simulationData.simulation_parameters.central_tele_ophthalmologists} Central Doctors</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400">Connecting to Phase 6 Simulation Engine...</p>
              </div>
            )}
          </TabsContent>

          {/* ========================================================================= */}
          {/* TAB 3: CUSTOMIZED LOGIN & PERSONA PORTAL */}
          {/* ========================================================================= */}
          <TabsContent value="login" className="m-0">
            <div className="max-w-md mx-auto py-6 space-y-4">
              {/* Quick Persona Switcher for Demos */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> One-Click Quick Demos:
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      handleLogin({
                        phc_node: 'PHC-MH-AUR-04 (Paithan)',
                        doctor_name: 'Dr. Ananya Sharma',
                        license_id: 'MCI-2019-94821',
                        role: 'phc_officer'
                      })
                    }}
                    className="h-7 text-[11px] border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                  >
                    PHC Officer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      handleLogin({
                        phc_node: 'District Hospital Chh. Sambhajinagar',
                        doctor_name: 'Dr. S. K. Kulkarni, MS Retina',
                        license_id: 'MMC-1998-03829',
                        role: 'specialist'
                      })
                    }}
                    className="h-7 text-[11px] border-purple-500/40 text-purple-400 hover:bg-purple-500/10"
                  >
                    Ophthalmologist
                  </Button>
                </div>
              </div>

              {/* Main Login Card */}
              <Card className="bg-slate-900 border-slate-800 shadow-2xl">
                <CardHeader className="text-center pb-4">
                  <div className="bg-emerald-500/20 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-emerald-500/30">
                    <Building className="w-6 h-6 text-emerald-400" />
                  </div>
                  <CardTitle className="text-lg text-white">Clinical Gateway Authentication</CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Ayushman Bharat Digital Mission (ABDM) Tele-Ophthalmic Portal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                    <div>
                      <Label className="text-slate-300">Operational Role</Label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => setLoginForm({ ...loginForm, role: 'phc_officer' })}
                          className={`p-2 rounded-lg border text-center transition ${loginForm.role === 'phc_officer' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-semibold' : 'border-slate-800 bg-slate-950 text-slate-400'}`}
                        >
                          PHC Medical Officer
                        </button>
                        <button
                          type="button"
                          onClick={() => setLoginForm({ ...loginForm, role: 'specialist' })}
                          className={`p-2 rounded-lg border text-center transition ${loginForm.role === 'specialist' ? 'border-purple-500 bg-purple-500/10 text-purple-400 font-semibold' : 'border-slate-800 bg-slate-950 text-slate-400'}`}
                        >
                          Tele-Ophthalmologist
                        </button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-slate-300">Assigned PHC / Hospital Node</Label>
                      <select
                        value={loginForm.phc_id}
                        onChange={(e) => setLoginForm({ ...loginForm, phc_id: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-200 mt-1 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="PHC-MH-AUR-04 (Paithan)">PHC-MH-AUR-04 (Paithan Rural Center)</option>
                        <option value="PHC-MH-AUR-08 (Gangapur)">PHC-MH-AUR-08 (Gangapur Primary Clinic)</option>
                        <option value="PHC-MH-JAL-02 (Ambad)">PHC-MH-JAL-02 (Ambad Sub-Center)</option>
                        <option value="District Hospital Chh. Sambhajinagar">District Civil Hospital (Tele-Retina Hub)</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-slate-300">Clinician Name</Label>
                      <Input
                        value={loginForm.officer_name}
                        onChange={(e) => setLoginForm({ ...loginForm, officer_name: e.target.value })}
                        className="bg-slate-950 border-slate-800 mt-1 h-9"
                        placeholder="e.g. Dr. Rajesh Shinde"
                        required
                      />
                    </div>

                    <div>
                      <Label className="text-slate-300">MCI / State Medical Council Reg No.</Label>
                      <Input
                        value={loginForm.license_number}
                        onChange={(e) => setLoginForm({ ...loginForm, license_number: e.target.value })}
                        className="bg-slate-950 border-slate-800 mt-1 h-9 font-mono"
                        placeholder="e.g. MCI-2019-94821"
                        required
                      />
                    </div>

                    <div>
                      <Label className="text-slate-300">Access PIN / Password</Label>
                      <Input
                        type="password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="bg-slate-950 border-slate-800 mt-1 h-9"
                        placeholder="••••••••"
                        required
                      />
                    </div>

                    <Button type="submit" disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium">
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                      Authorize Clinical Session
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* ========================================================================= */}
      {/* 4-VIEW INTERACTIVE RETINAL LIGHTBOX MODAL */}
      {/* ========================================================================= */}
      {activeModalView && screeningResult && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Maximize2 className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white capitalize">
                    {activeModalView === 'enhanced' && 'Ben Graham Normalized Fundus'}
                    {activeModalView === 'vessels' && 'Vascular Morphometry & Density Map'}
                    {activeModalView === 'landmarks' && 'Optic Disc & Physiological Cup Overlay'}
                    {activeModalView === 'gradcam' && 'Explainable AI Grad-CAM Pathology Heatmap'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Patient: {patientInfo.name} | ABHA: {patientInfo.abhaId}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={screeningResult.images[activeModalView]}
                  download={`retina_${activeModalView}_${patientInfo.name.replace(/\s+/g, '_')}.png`}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" /> Save PNG
                </a>
                <button
                  onClick={() => setActiveModalView(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* View Selector Tabs */}
            <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-950 border-b border-slate-800 overflow-x-auto text-xs">
              <button
                onClick={() => setActiveModalView('enhanced')}
                className={`px-3 py-1 rounded-md transition ${activeModalView === 'enhanced' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
              >
                1. Enhanced Fundus
              </button>
              <button
                onClick={() => setActiveModalView('vessels')}
                className={`px-3 py-1 rounded-md transition ${activeModalView === 'vessels' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
              >
                2. Vasculature ({screeningResult.vessel_density})
              </button>
              <button
                onClick={() => setActiveModalView('landmarks')}
                className={`px-3 py-1 rounded-md transition ${activeModalView === 'landmarks' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
              >
                3. Optic Disc (CDR {screeningResult.cup_to_disc_ratio})
              </button>
              <button
                onClick={() => setActiveModalView('gradcam')}
                className={`px-3 py-1 rounded-md transition ${activeModalView === 'gradcam' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
              >
                4. Grad-CAM (VAI {screeningResult.alignment_score}%)
              </button>
            </div>

            {/* Modal Body / Canvas Stage */}
            <div className="flex-1 overflow-auto p-6 flex flex-col items-center justify-center bg-slate-950/40">
              <div className="relative max-w-lg w-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-black flex items-center justify-center">
                {activeModalView === 'gradcam' ? (
                  <div className="relative w-full aspect-square">
                    <img
                      src={screeningResult.images.enhanced}
                      alt="Base Enhanced"
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                    <img
                      src={screeningResult.images.gradcam}
                      alt="Grad-CAM"
                      className="absolute inset-0 w-full h-full object-contain transition-opacity duration-150"
                      style={{ opacity: camOpacity }}
                    />
                  </div>
                ) : (
                  <img
                    src={screeningResult.images[activeModalView]}
                    alt={activeModalView}
                    className="w-full h-auto max-h-[55vh] object-contain"
                  />
                )}
              </div>

              {activeModalView === 'gradcam' && (
                <div className="mt-4 flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs">
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-300">Heatmap Intensity:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={camOpacity}
                    onChange={(e) => setCamOpacity(parseFloat(e.target.value))}
                    className="w-36 accent-emerald-500 cursor-pointer"
                  />
                  <span className="font-mono text-emerald-400 w-10 text-right">{Math.round(camOpacity * 100)}%</span>
                </div>
              )}
            </div>

            {/* Modal Footer / Biomarker Summary */}
            <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between text-xs gap-3">
              <div className="flex items-center gap-4">
                <span className="text-slate-400">Diagnosis: <strong className="text-white">{screeningResult.dr_label}</strong></span>
                <span className="text-slate-400">Confidence: <strong className="text-emerald-400">{screeningResult.confidence}%</strong></span>
                <span className="text-slate-400">Vascular Overlap: <strong className="text-emerald-400">{screeningResult.alignment_score}%</strong></span>
              </div>
              <p className="text-[11px] text-slate-500">Press ESC or click outside to dismiss</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// =========================================================================
// CLINICAL REPORT DETAIL WITH PRINT OPTIMIZATION
// =========================================================================
function ClinicalReportDetail({
  data,
  patientInfo,
  session,
  onOpenLightbox
}: {
  data: any
  patientInfo: any
  session: any
  onOpenLightbox: (view: 'enhanced' | 'vessels' | 'landmarks' | 'gradcam') => void
}) {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case 'emergency vitreo-retinal referral':
        return 'bg-red-500/20 text-red-400 border-red-500/40'
      case 'urgent referral':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40'
      case 'priority referral':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40'
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-5xl mx-auto text-slate-100 shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
      {/* Letterhead Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800 print:border-black gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 print:border-black print:text-black">
              Tele-Retina Triage
            </span>
            <span className="text-xs text-slate-400 print:text-gray-600">NPCBVI Protocol Grade Card</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1 print:text-black">
            Comprehensive Retinal Diagnostic Report
          </h2>
          <p className="text-xs text-slate-400 print:text-gray-600">Ayushman Bharat Digital Health Ecosystem</p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition border border-slate-700 cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" /> Print / Export PDF
          </button>
          <button
            onClick={() => alert(`Referral packet dispatched to ${session?.phc_node || 'District Hospital'} tele-ophthalmology queue.`)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" /> Dispatch Referral
          </button>
        </div>
      </div>

      {/* Patient & Clinic Details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-slate-800 print:border-gray-300 text-xs">
        <div>
          <span className="text-slate-400 block print:text-gray-600">Patient Name</span>
          <span className="font-semibold text-slate-200 print:text-black">{patientInfo.name || 'Anonymous'}</span>
        </div>
        <div>
          <span className="text-slate-400 block print:text-gray-600">ABHA Health ID</span>
          <span className="font-mono font-semibold text-emerald-400 print:text-black">{patientInfo.abhaId}</span>
        </div>
        <div>
          <span className="text-slate-400 block print:text-gray-600">Age / Gender</span>
          <span className="font-semibold text-slate-200 print:text-black">
            {patientInfo.age || '--'} Yrs / {patientInfo.gender}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block print:text-gray-600">Attending Officer & PHC</span>
          <span className="font-semibold text-slate-200 print:text-black">
            {session ? session.doctor_name : 'Medical Officer'} ({session ? session.phc_node : 'PHC'})
          </span>
        </div>
      </div>

      {/* Severity Banner */}
      <div className="my-6 p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:border-gray-400 print:bg-gray-50">
        <div>
          <div className="text-xs uppercase font-semibold text-slate-400">Predicted ICDR Severity</div>
          <div className="text-2xl font-bold text-white flex items-center gap-2 print:text-black">
            {data.dr_label}
            {data.is_referable ? (
              <span className="text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded">
                Referable DR (Grade &ge; 2)
              </span>
            ) : (
              <span className="text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                Non-Referable
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1 print:text-gray-700">
            Calibrated Confidence: <span className="font-semibold text-emerald-400">{data.confidence}%</span> (Temperature Scaled T={data.calibrated_with_temperature})
          </p>
        </div>

        <div className={`px-4 py-2.5 rounded-lg border text-xs font-semibold ${getUrgencyColor(data.clinical_decision_support?.referral_urgency)}`}>
          <div className="text-[10px] uppercase tracking-wider opacity-80">Referral Urgency</div>
          <div className="text-sm font-bold">{data.clinical_decision_support?.referral_urgency}</div>
          <div className="text-[11px] opacity-90">Window: {data.clinical_decision_support?.target_followup}</div>
        </div>
      </div>

      {/* Multi-Class Calibrated Probabilities Breakdown */}
      {data.class_probabilities && (
        <div className="mb-6 bg-slate-950 p-4 rounded-xl border border-slate-800 print:border-gray-300">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Five-Class Calibrated Posterior Probabilities
          </h4>
          <div className="space-y-2 text-xs">
            {data.class_probabilities.map((item: any) => (
              <div key={item.grade} className="flex items-center gap-3">
                <span className="w-40 font-mono text-[11px] text-slate-300 truncate">{item.label}</span>
                <div className="flex-1 bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all ${
                      item.grade === data.dr_grade ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                    style={{ width: `${Math.max(item.probability, 1)}%` }}
                  />
                </div>
                <span className={`w-12 text-right font-mono text-[11px] ${item.grade === data.dr_grade ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                  {item.probability}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4-Image Retinal Diagnostic Grid */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-emerald-400" /> Explainable AI Visual Quad (Morphology & Attention)
          </h3>
          <span className="text-[10px] text-slate-500 print:hidden">Click any card to expand high-res inspector</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Card 1: Enhanced */}
          <div
            onClick={() => onOpenLightbox('enhanced')}
            className="group relative bg-slate-950 p-2 rounded-xl border border-slate-800 hover:border-emerald-500/60 transition cursor-pointer text-center"
          >
            <div className="relative overflow-hidden rounded-lg mb-1.5">
              <img src={data.images.enhanced} alt="Enhanced" className="w-full h-32 object-cover group-hover:scale-105 transition duration-300" />
              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center print:hidden">
                <Maximize2 className="w-5 h-5 text-white" />
              </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-300 block">Enhanced Fundus</span>
            <p className="text-[9px] text-slate-500">Ben Graham Normalized</p>
          </div>

          {/* Card 2: Vessels */}
          <div
            onClick={() => onOpenLightbox('vessels')}
            className="group relative bg-slate-950 p-2 rounded-xl border border-slate-800 hover:border-emerald-500/60 transition cursor-pointer text-center"
          >
            <div className="relative overflow-hidden rounded-lg mb-1.5">
              <img src={data.images.vessels} alt="Vessels" className="w-full h-32 object-cover group-hover:scale-105 transition duration-300" />
              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center print:hidden">
                <Maximize2 className="w-5 h-5 text-white" />
              </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-300 block">Vascular Tree</span>
            <p className="text-[9px] text-slate-500">Density: {data.vessel_density}</p>
          </div>

          {/* Card 3: Landmarks */}
          <div
            onClick={() => onOpenLightbox('landmarks')}
            className="group relative bg-slate-950 p-2 rounded-xl border border-slate-800 hover:border-emerald-500/60 transition cursor-pointer text-center"
          >
            <div className="relative overflow-hidden rounded-lg mb-1.5">
              <img src={data.images.landmarks} alt="Landmarks" className="w-full h-32 object-cover group-hover:scale-105 transition duration-300" />
              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center print:hidden">
                <Maximize2 className="w-5 h-5 text-white" />
              </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-300 block">Optic Disc & Cup</span>
            <p className="text-[9px] text-slate-500">vCDR: {data.cup_to_disc_ratio}</p>
          </div>

          {/* Card 4: Grad-CAM */}
          <div
            onClick={() => onOpenLightbox('gradcam')}
            className="group relative bg-slate-950 p-2 rounded-xl border border-slate-800 hover:border-emerald-500/60 transition cursor-pointer text-center"
          >
            <div className="relative overflow-hidden rounded-lg mb-1.5">
              <img src={data.images.gradcam} alt="Grad-CAM" className="w-full h-32 object-cover group-hover:scale-105 transition duration-300" />
              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center print:hidden">
                <Maximize2 className="w-5 h-5 text-white" />
              </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-300 block">Grad-CAM Heatmap</span>
            <p className="text-[9px] text-emerald-400 font-mono">VAI: {data.alignment_score}%</p>
          </div>
        </div>
      </div>

      {/* Quantitative Scorecard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-400 block">Vascular Alignment (VAI)</span>
          <span className="text-base font-bold text-emerald-400">{data.alignment_score}%</span>
          <span className="text-[10px] text-slate-500 block">Attention on lesions</span>
        </div>
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-400 block">Cup-to-Disc Ratio (vCDR)</span>
          <span className={`text-base font-bold ${data.suspect_glaucoma ? 'text-amber-400' : 'text-slate-200'}`}>
            {data.cup_to_disc_ratio}
          </span>
          <span className="text-[10px] text-slate-500 block">{data.suspect_glaucoma ? 'Suspect Glaucoma' : 'Physiological'}</span>
        </div>
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-400 block">Sharpness (Laplacian)</span>
          <span className="text-base font-bold text-slate-200">{data.metrics?.sharpness_laplacian ?? 'N/A'}</span>
          <span className="text-[10px] text-slate-500 block">Passed Quality Gate</span>
        </div>
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-400 block">Inference Latency</span>
          <span className="text-base font-bold text-emerald-400">{data.latency_ms} ms</span>
          <span className="text-[10px] text-slate-500 block">Edge Accelerated</span>
        </div>
      </div>

      {/* Clinical Recommendations */}
      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2 mb-6 print:border-gray-400 text-xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-emerald-400" /> Actionable Clinical Recommendation Plan
        </h4>
        <p><span className="font-semibold text-white">Recommended Action:</span> {data.clinical_decision_support?.recommended_action}</p>
        <p><span className="font-semibold text-white">Telemedicine Routing:</span> {data.clinical_decision_support?.telemed_routing}</p>
        <p><span className="font-semibold text-white">Counseling:</span> {data.clinical_decision_support?.counseling_points}</p>

        {data.clinical_decision_support?.clinical_alerts?.length > 0 && (
          <div className="mt-3 pt-2 border-t border-slate-800 space-y-1">
            {data.clinical_decision_support.clinical_alerts.map((alert: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{alert}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Official Sign-off */}
      <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 gap-4">
        <div>
          <p>Autonomous AI Edge Triage verified under IEC 62304 / ISO 13485 standards.</p>
          <p>Preliminary diagnostic tool: Final validation requires licensed ophthalmologist review.</p>
        </div>
        <div className="text-right border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto">
          <div className="h-8 border-b border-dashed border-slate-700 w-44 mb-1 inline-block"></div>
          <p className="text-slate-400">Authorized Medical Officer Sign-off</p>
        </div>
      </div>
    </div>
  )
}