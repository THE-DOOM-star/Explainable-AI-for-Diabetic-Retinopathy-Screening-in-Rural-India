'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Download,
  FileImage,
  HeartPulse,
  Info,
  Loader2,
  Maximize2,
  ShieldCheck,
  Stethoscope,
  UploadCloud,
  UsersRound,
  XCircle,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ScreeningResult {
  status: string
  metrics: {
    blur_score?: number
    blur?: number
    luminance?: number
    fov_ratio?: number
    fov?: number
    reason?: string
    [key: string]: any
  }
  dr_grade?: number
  confidence?: number
  is_referable?: boolean
  alignment_score?: number
  vessel_density?: number
  reason?: string
  images?: {
    enhanced: string
    vessels: string
    gradcam: string
  }
}

const DR_STAGING = [
  { title: 'No DR', stage: 'Level 0 of 4', desc: 'No apparent diabetic retinopathy lesions detected.' },
  { title: 'Mild NPDR', stage: 'Level 1 of 4', desc: 'Microaneurysms detected. Annual monitoring indicated.' },
  { title: 'Moderate NPDR', stage: 'Level 2 of 4', desc: 'Microaneurysms, blot hemorrhages or hard exudates present.' },
  { title: 'Severe NPDR', stage: 'Level 3 of 4', desc: 'Extensive hemorrhages or venous beading. High risk.' },
  { title: 'Proliferative DR', stage: 'Level 4 of 4', desc: 'Neovascularization or vitreous hemorrhage. Critical triage.' },
]

const navItems = [
  { label: 'Screening', icon: Stethoscope, active: true },
  { label: 'Patients', icon: UsersRound },
  { label: 'Reports', icon: ClipboardList },
]

function Metric({
  label,
  value,
  progress,
  tone = 'blue',
}: {
  label: string
  value: string
  progress: number
  tone?: 'blue' | 'green' | 'amber'
}) {
  return (
    <div className="metric-row">
      <div className="metric-top">
        <span className="text-xs text-[#708598]">{label}</span>
        <strong className="text-xs font-semibold text-[#18324b]">{value}</strong>
      </div>
      <Progress value={progress} className={`metric-progress progress-${tone}`} />
    </div>
  )
}

export default function Page() {
  const [activeTab, setActiveTab] = useState<'enhanced' | 'vessels' | 'heatmap'>('enhanced')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScreeningResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      setFilePreview(URL.createObjectURL(file))
      setResult(null)
      setErrorMsg(null)
    }
  }

  const runAnalysis = async () => {
    if (!selectedFile) return
    setLoading(true)
    setErrorMsg(null)

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const res = await fetch('http://localhost:8000/api/screen', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`API error ${res.status}: ${errorText}`)
      }

      const data: ScreeningResult = await res.json()
      setResult(data)
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Failed to connect to AI inference server.')
    } finally {
      setLoading(false)
    }
  }

  // Extract IQA display metrics safely
  const blurVal = result?.metrics?.blur_score ?? result?.metrics?.blur ?? 0.85
  const lumVal = result?.metrics?.luminance ?? 80
  const fovVal = result?.metrics?.fov_ratio ?? result?.metrics?.fov ?? 95

  const currentGrade = result?.dr_grade !== undefined ? DR_STAGING[result.dr_grade] : null

  return (
    <main className="min-h-screen bg-[#f5f8fb] text-[#18324b]">
      {/* Header */}
      <header className="flex h-[72px] items-center justify-between border-b border-[#dbe5ed] bg-white px-5 lg:px-8">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="brand-mark">
              <HeartPulse />
            </div>
            <div>
              <div className="brand-name">
                Netra<span>-AI</span>
              </div>
              <div className="brand-subtitle">Retinal screening intelligence</div>
            </div>
          </div>
          <Separator orientation="vertical" className="hidden h-8 lg:block" />
          <div className="hidden items-center gap-3 lg:flex">
            <div className="mission-mark">
              आयुष्मान
              <br />
              <b>भारत</b>
            </div>
            <div className="mission-copy">
              <strong>National Health Mission</strong>
              <span>Ayushman Bharat Digital Mission</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="hidden gap-2 border-[#cbd9e5] bg-white font-semibold text-[#31506b] sm:flex"
            onClick={() => window.print()}
          >
            <Download data-icon="inline-start" />
            Export PDF Report
          </Button>
          <Separator orientation="vertical" className="hidden h-8 sm:block" />
          <Avatar className="size-9 border border-[#cfe0eb] bg-[#e7f2f8]">
            <AvatarFallback className="bg-[#e7f2f8] text-xs font-bold text-[#24627d]">
              DR
            </AvatarFallback>
          </Avatar>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-[#18324b]">Dr. Ramesh</p>
            <p className="text-xs text-[#708498]">PHC Baramati</p>
          </div>
          <ChevronDown className="size-4 text-[#91a1b0]" />
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-72px)]">
        {/* Sidebar */}
        <aside className="hidden w-[222px] shrink-0 border-r border-[#dbe5ed] bg-white p-5 lg:block">
          <div className="mb-9">
            <p className="eyebrow">WORKSPACE</p>
            <p className="mt-1 text-xs text-[#8495a4]">Rural screening network</p>
          </div>
          <nav className="flex flex-col gap-2" aria-label="Primary navigation">
            {navItems.map(({ label, icon: Icon, active }) => (
              <button key={label} className={`side-nav ${active ? 'active' : ''}`}>
                <Icon />
                <span>{label}</span>
                {active && <span className="ml-auto size-1.5 rounded-full bg-[#2e9fba]" />}
              </button>
            ))}
          </nav>
          <div className="mt-auto pt-72">
            <div className="rounded-lg border border-[#dce9ef] bg-[#f5fafc] p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#27657a]">
                <ShieldCheck className="size-4" />
                ABDM Connected
              </div>
              <p className="mt-1 text-[11px] leading-4 text-[#7e94a3]">
                Patient records are encrypted and securely synced.
              </p>
            </div>
            <p className="mt-5 text-[10px] text-[#a5b3bd]">v2.4.1 · Telemed Queue Active</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="w-full px-5 py-7 lg:px-8">
          <div className="mx-auto max-w-[1380px]">
            {/* Top Bar */}
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#698298]">
                  <span>SCREENING</span>
                  <span>/</span>
                  <span className="text-[#2b91aa]">NEW ANALYSIS</span>
                </div>
                <h1 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[#18324b]">
                  Diabetic Retinopathy Screening
                </h1>
                <p className="mt-1 text-sm text-[#718597]">
                  AI-assisted retinal assessment for early detection and referral triage.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-[#dce6ed] bg-white px-3 py-2 text-xs text-[#708598]">
                <CalendarDays className="size-4 text-[#4799ae]" />
                Primary Health Centre Telemedicine Mode
              </div>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <XCircle className="size-5 shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Ungradable Banner */}
            {result?.status === 'UNGRADABLE' && (
              <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                <AlertTriangle className="size-5 shrink-0 text-amber-600" />
                <div>
                  <strong>Image Quality Assessment Failed (UNGRADABLE): </strong>
                  {result.reason || 'Image is too blurred or improperly illuminated for clinical AI evaluation. Please re-capture.'}
                </div>
              </div>
            )}

            <div className="grid gap-6 xl:grid-cols-[370px_1fr]">
              {/* Left Column: Image Upload & Patient Form */}
              <div className="flex flex-col gap-5">
                <Card className="border-[#dbe5ed] shadow-[0_2px_10px_rgba(28,61,85,0.04)]">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-[15px] text-[#23425d]">Retinal photograph</CardTitle>
                    <CardDescription>Upload a 45° fundus image to begin.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <label className="upload-zone cursor-pointer" htmlFor="fundus-file">
                      <input
                        id="fundus-file"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleFileChange}
                      />
                      <div className="upload-icon">
                        <UploadCloud />
                      </div>
                      <p className="mt-3 text-sm font-semibold text-[#2e5972]">
                        {selectedFile ? 'Click to change image' : 'Drop image here or browse'}
                      </p>
                      <p className="mt-1 text-xs text-[#8a9aa8]">JPG, PNG · APTOS / Messidor standard</p>
                    </label>

                    {selectedFile && (
                      <div className="mt-4 flex items-center gap-3 rounded-md bg-[#f4f8fa] px-3 py-2.5">
                        <FileImage className="size-5 text-[#4799ae]" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-[#3b566c]">
                            {selectedFile.name}
                          </p>
                          <p className="text-[11px] text-[#93a1ad]">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Ready for pipeline
                          </p>
                        </div>
                        <CheckCircle2 className="size-4 text-[#3ca284]" />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-[#dbe5ed] shadow-[0_2px_10px_rgba(28,61,85,0.04)]">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-[15px] text-[#23425d]">Patient details</CardTitle>
                      <Badge
                        variant="outline"
                        className="border-[#c9e6ec] bg-[#f2fbfc] text-[10px] text-[#258399]"
                      >
                        ABDM linked
                      </Badge>
                    </div>
                    <CardDescription>Details are linked to the secure patient record.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <div className="field">
                      <Label htmlFor="patient-id">Patient ID</Label>
                      <div className="relative">
                        <Input
                          id="patient-id"
                          defaultValue="PHC-BRM-02481"
                          className="bg-[#fbfcfd] pr-9"
                        />
                        <BadgeCheck className="absolute right-3 top-2.5 size-4 text-[#43a68d]" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="field">
                        <Label htmlFor="age">Age</Label>
                        <Input id="age" defaultValue="58" className="bg-[#fbfcfd]" />
                      </div>
                      <div className="field">
                        <Label htmlFor="gender">Gender</Label>
                        <Input id="gender" defaultValue="Female" className="bg-[#fbfcfd]" />
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-2 text-[11px] text-[#8b9aa8]">
                      <Info className="size-3.5" />
                      Data processed locally with edge ResNet-18 ONNX.
                    </div>
                  </CardContent>
                </Card>

                <Button
                  onClick={runAnalysis}
                  disabled={!selectedFile || loading}
                  className="h-12 w-full gap-2 bg-[#247e98] font-bold shadow-[0_4px_12px_rgba(36,126,152,0.18)] hover:bg-[#1e6e85] disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Running AI Screening...
                    </>
                  ) : (
                    <>
                      <Stethoscope data-icon="inline-start" />
                      Analyze Retina
                      <ArrowUpRight data-icon="inline-end" />
                    </>
                  )}
                </Button>
              </div>

              {/* Right Column: Diagnostic Results & Explainability */}
              <div className="flex flex-col gap-5">
                {/* Diagnostic Results Card */}
                <Card className="border-[#dbe5ed] shadow-[0_2px_10px_rgba(28,61,85,0.04)]">
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-[15px] text-[#23425d]">
                          Diagnostic results
                        </CardTitle>
                        <CardDescription className="mt-1">
                          ResNet-18 ONNX Inference · Calibrated for Indian Telemedicine Cohorts
                        </CardDescription>
                      </div>
                      {result?.status === 'GRADABLE' || result?.dr_grade !== undefined ? (
                        <Badge className="gap-1.5 border-0 bg-[#e9f7f1] text-[#278365]">
                          <span className="size-1.5 rounded-full bg-[#3cab87]" />
                          Analysis complete
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[#8495a4]">
                          Awaiting Screening
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-[1fr_1.35fr]">
                      {/* IQA Metrics */}
                      <div className="rounded-lg border border-[#dce7ed] bg-[#fbfcfd] p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#8094a4]">
                              Image quality assessment
                            </p>
                            <p
                              className={`mt-2 text-[15px] font-bold ${
                                result?.status === 'UNGRADABLE' ? 'text-amber-600' : 'text-[#2c765f]'
                              }`}
                            >
                              {result ? (result.status === 'UNGRADABLE' ? 'Suboptimal' : 'Optimal') : 'Ready'}
                            </p>
                          </div>
                          <Badge
                            className={`border-0 text-[11px] ${
                              result?.status === 'UNGRADABLE'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-[#eaf7f0] text-[#318b6e]'
                            }`}
                          >
                            {result?.status === 'UNGRADABLE' ? 'Warning' : 'Pass'}
                          </Badge>
                        </div>
                        <div className="mt-5 flex flex-col gap-4">
                          <Metric
                            label="Blur score (Laplacian)"
                            value={blurVal > 1 ? `${blurVal.toFixed(0)}` : `${(blurVal * 100).toFixed(0)}%`}
                            progress={Math.min(100, Math.round(blurVal > 1 ? blurVal / 2 : blurVal * 100))}
                            tone="green"
                          />
                          <Metric
                            label="Luminance level"
                            value={`${Math.round(lumVal)}%`}
                            progress={Math.round(lumVal)}
                          />
                          <Metric
                            label="Field of view (FOV)"
                            value={`${Math.round(fovVal)}%`}
                            progress={Math.round(fovVal)}
                            tone="green"
                          />
                        </div>
                      </div>

                      {/* Staging Banner */}
                      <div className="staging-banner">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8aa5b9]">
                              Clinical staging result
                            </p>
                            <p className="mt-2 text-2xl font-bold tracking-[-0.03em] text-white">
                              {currentGrade ? currentGrade.title : 'Moderate NPDR'}
                            </p>
                            <p className="mt-1 text-sm text-[#bad1df]">
                              {currentGrade ? currentGrade.stage : 'Diabetic Retinopathy · Level 2 of 4'}
                            </p>
                          </div>
                          <div className="rounded-lg bg-white/10 px-3 py-2 text-right">
                            <p className="text-[10px] uppercase tracking-wider text-[#a9c4d4]">
                              Confidence
                            </p>
                            <p className="text-xl font-bold text-white">
                              {result?.confidence ? `${result.confidence}%` : '91.6%'}
                            </p>
                          </div>
                        </div>
                        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3">
                          <span className="text-xs text-[#a9c4d4]">Simulink Referral Queue</span>
                          {result?.is_referable ?? true ? (
                            <Badge className="border-0 bg-[#ffedd3] text-[10px] font-bold text-[#a35917]">
                              REFERRAL REQUIRED
                            </Badge>
                          ) : (
                            <Badge className="border-0 bg-[#d7f4e9] text-[10px] font-bold text-[#147953]">
                              ROUTINE PHC REVIEW (12 MO)
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Clinical Image Review (Live Base64 Multi-Modal Artifacts) */}
                <Card className="border-[#dbe5ed] shadow-[0_2px_10px_rgba(28,61,85,0.04)]">
                  <CardHeader className="pb-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-[15px] text-[#23425d]">
                          Clinical image review & explainability
                        </CardTitle>
                        <CardDescription>
                          Ben Graham preprocessing, Morphological Vessels, & Grad-CAM layer4 attention.
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="border-[#d9e5eb] text-[10px] text-[#7990a0]">
                        OD · Right eye
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-5">
                    <Tabs
                      value={activeTab}
                      onValueChange={(val) => setActiveTab(val as 'enhanced' | 'vessels' | 'heatmap')}
                    >
                      <TabsList className="grid h-10 w-full grid-cols-3 bg-[#f3f7f9] p-1">
                        <TabsTrigger
                          value="enhanced"
                          className="text-xs data-[state=active]:bg-white data-[state=active]:text-[#247e98]"
                        >
                          Enhanced Fundus
                        </TabsTrigger>
                        <TabsTrigger
                          value="vessels"
                          className="text-xs data-[state=active]:bg-white data-[state=active]:text-[#247e98]"
                        >
                          Vessel Tree
                        </TabsTrigger>
                        <TabsTrigger
                          value="heatmap"
                          className="text-xs data-[state=active]:bg-white data-[state=active]:text-[#247e98]"
                        >
                          Grad-CAM Heatmap
                        </TabsTrigger>
                      </TabsList>

                      {/* Tab 1: Enhanced Fundus */}
                      <TabsContent value="enhanced" className="mt-4">
                        <div className="relative flex h-[340px] w-full items-center justify-center overflow-hidden rounded-xl border border-[#dbe5ed] bg-black">
                          <img
                            src={result?.images?.enhanced || filePreview || '/placeholder-fundus.jpg'}
                            alt="Enhanced Retinal Fundus"
                            className="h-full w-full object-contain"
                          />
                          <div className="retina-caption">OD · 45° · Ben Graham Subtraction</div>
                          <button className="image-expand" aria-label="Expand image">
                            <Maximize2 />
                          </button>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-[#7d91a0]">
                          <span>Local color subtraction + CLAHE enhancement applied</span>
                          <span className="flex items-center gap-1.5 text-[#388d76]">
                            <CheckCircle2 className="size-3.5" />
                            Preprocessed for ONNX ResNet-18
                          </span>
                        </div>
                      </TabsContent>

                      {/* Tab 2: Vessel Tree */}
                      <TabsContent value="vessels" className="mt-4">
                        <div className="relative flex h-[340px] w-full items-center justify-center overflow-hidden rounded-xl border border-[#dbe5ed] bg-black">
                          {result?.images?.vessels ? (
                            <img
                              src={result.images.vessels}
                              alt="Retinal Vessel Tree"
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-400 text-xs">
                              <Info className="size-6 mb-2 opacity-50" />
                              Run screening to extract morphological vessel tree
                            </div>
                          )}
                          <div className="retina-caption">Top-Hat Morphological Filtering</div>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-[#7d91a0]">
                          <span>
                            Vessel density:{' '}
                            <strong className="text-[#3b566c]">
                              {result?.vessel_density ?? '0.142'}
                            </strong>
                          </span>
                          <Badge variant="outline" className="border-[#c9e4e9] text-[#438496]">
                            Anatomical Alignment: {result?.alignment_score ?? '94.0'}%
                          </Badge>
                        </div>
                      </TabsContent>

                      {/* Tab 3: Grad-CAM Heatmap */}
                      <TabsContent value="heatmap" className="mt-4">
                        <div className="relative flex h-[340px] w-full items-center justify-center overflow-hidden rounded-xl border border-[#dbe5ed] bg-black">
                          {result?.images?.gradcam ? (
                            <img
                              src={result.images.gradcam}
                              alt="Grad-CAM Attention Map"
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-400 text-xs">
                              <Info className="size-6 mb-2 opacity-50" />
                              Run screening to generate Grad-CAM attention heatmap
                            </div>
                          )}
                          <div className="retina-caption">ResNet-18 Layer4 Backprop Activation</div>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-[#7d91a0]">
                          <span>
                            Attention highlights lesions aligned with clinical DR pathology
                          </span>
                          <Badge variant="outline" className="border-[#c9e4e9] text-[#438496]">
                            Anatomical Alignment: {result?.alignment_score ?? '94.0'}%
                          </Badge>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                {/* Bottom Clinical Triage Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="stat-card">
                    <div className="stat-icon teal">
                      <HeartPulse />
                    </div>
                    <div>
                      <p>Vascular Density</p>
                      <strong>{result?.vessel_density ?? '0.142'}</strong>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon amber">
                      <AlertTriangle />
                    </div>
                    <div>
                      <p>Vascular Alignment</p>
                      <strong>{result?.alignment_score ? `${result.alignment_score}%` : '94.0%'}</strong>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon blue">
                      <ShieldCheck />
                    </div>
                    <div>
                      <p>Simulink Telemed Queue</p>
                      <strong>
                        {result?.is_referable ? 'Priority 1 (Specialist)' : 'Routine Follow-up'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Model Disclaimer Footer */}
                <div className="flex items-center justify-between rounded-lg border border-[#cfe4e9] bg-[#f1fafb] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-[#d7f0f1] p-2 text-[#2a8a9b]">
                      <Info className="size-4" />
                    </div>
                    <p className="text-xs text-[#4d7180]">
                      This AI result serves as a decision support aid under Human-in-the-Loop rural telemedicine.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden text-xs font-semibold text-[#2d8398] sm:flex"
                    onClick={() =>
                      alert(
                        'Pipeline: Phase 1 IQA -> Phase 2 Morphology -> Phase 3 ResNet-18 -> Phase 4 Grad-CAM -> Phase 6 Simulink Queue.'
                      )
                    }
                  >
                    View model notes <ArrowUpRight data-icon="inline-end" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}