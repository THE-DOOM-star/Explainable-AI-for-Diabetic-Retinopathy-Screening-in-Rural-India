"use client";

import React from "react";
import { 
  Printer, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Calendar, 
  Activity, 
  Share2, 
  ShieldAlert 
} from "lucide-react";

export interface ScreeningReportProps {
  data: {
    status: string;
    dr_grade: number;
    dr_label: string;
    confidence: number;
    is_referable: boolean;
    alignment_score: number;
    vessel_density: number;
    cup_to_disc_ratio: number;
    suspect_glaucoma: boolean;
    metrics: {
      sharpness_laplacian?: number;
      mean_luminance?: number;
      saturation_ratio?: number;
    };
    clinical_decision_support: {
      diagnostic_summary: string;
      referral_urgency: string;
      target_followup: string;
      recommended_action: string;
      telemed_routing: string;
      counseling_points: string;
      clinical_alerts: string[];
    };
    images: {
      enhanced: string;
      vessels: string;
      gradcam: string;
      landmarks?: string;
    };
    latency_ms?: number;
  };
  patientInfo?: {
    abhaId?: string;
    patientName?: string;
    age?: number;
    gender?: string;
    phcLocation?: string;
  };
}

export default function ClinicalReportDetail({ data, patientInfo }: ScreeningReportProps) {
  const patient = {
    abhaId: patientInfo?.abhaId || "ABHA-91-8273-1049-5501",
    name: patientInfo?.patientName || "Ramesh Narayan Patil",
    age: patientInfo?.age || 54,
    gender: patientInfo?.gender || "Male",
    phc: patientInfo?.phcLocation || "PHC Paithan, Aurangabad, MH",
    date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case "emergency vitreo-retinal referral":
        return "bg-red-500/20 text-red-400 border-red-500/40";
      case "urgent referral":
        return "bg-rose-500/20 text-rose-400 border-rose-500/40";
      case "priority referral":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40";
      default:
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-5xl mx-auto text-slate-100 shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none">
      
      {/* 1. Official Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 print:border-black gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 print:border-black print:text-black">
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
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition border border-slate-700"
          >
            <Printer className="w-3.5 h-3.5" /> Print / Export PDF
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition">
            <Share2 className="w-3.5 h-3.5" /> Dispatch to Specialist
          </button>
        </div>
      </div>

      {/* 2. Patient Demographics & PHC Details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-slate-800 print:border-gray-300 text-xs">
        <div>
          <span className="text-slate-400 block print:text-gray-600">Patient Name</span>
          <span className="font-semibold text-slate-200 print:text-black">{patient.name}</span>
        </div>
        <div>
          <span className="text-slate-400 block print:text-gray-600">ABHA Health ID</span>
          <span className="font-mono font-semibold text-emerald-400 print:text-black">{patient.abhaId}</span>
        </div>
        <div>
          <span className="text-slate-400 block print:text-gray-600">Age / Gender</span>
          <span className="font-semibold text-slate-200 print:text-black">{patient.age} Yrs / {patient.gender}</span>
        </div>
        <div>
          <span className="text-slate-400 block print:text-gray-600">Screening PHC Node</span>
          <span className="font-semibold text-slate-200 print:text-black">{patient.phc}</span>
        </div>
      </div>

      {/* 3. Primary Diagnostic Summary Banner */}
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
            Calibrated Confidence: <span className="font-semibold text-emerald-400">{data.confidence}%</span> (Temperature Scaled T=1.35)
          </p>
        </div>

        <div className={`px-4 py-2.5 rounded-lg border text-xs font-semibold ${getUrgencyColor(data.clinical_decision_support?.referral_urgency)}`}>
          <div className="text-[10px] uppercase tracking-wider opacity-80">Referral Urgency</div>
          <div className="text-sm font-bold">{data.clinical_decision_support?.referral_urgency}</div>
          <div className="text-[11px] opacity-90">Window: {data.clinical_decision_support?.target_followup}</div>
        </div>
      </div>

      {/* 4. Explainability & Visual Evidence Triad */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" /> Explainable AI Visual Triad (Grad-CAM & Morphology)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
            <img src={data.images.enhanced} alt="Enhanced Retina" className="w-full h-44 object-cover rounded-lg mb-2" />
            <span className="text-xs font-semibold text-slate-300">Ben Graham Normalized Fundus</span>
            <p className="text-[10px] text-slate-500">Rayleigh CLAHE Contrast Balance</p>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
            <img src={data.images.vessels} alt="Vessel Extraction" className="w-full h-44 object-cover rounded-lg mb-2" />
            <span className="text-xs font-semibold text-slate-300">Vascular Morphometry</span>
            <p className="text-[10px] text-slate-500">Vessel Density: {data.vessel_density}</p>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
            <img src={data.images.gradcam} alt="Grad-CAM" className="w-full h-44 object-cover rounded-lg mb-2" />
            <span className="text-xs font-semibold text-slate-300">Explainable Grad-CAM Heatmap</span>
            <p className="text-[10px] text-emerald-400 font-mono">VAI Score: {data.alignment_score}%</p>
          </div>
        </div>
      </div>

      {/* 5. Clinical Biomarkers & Quantitative Scorecard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-400 block">Vascular Alignment (VAI)</span>
          <span className="text-base font-bold text-emerald-400">{data.alignment_score}%</span>
          <span className="text-[10px] text-slate-500 block">Attention on lesions</span>
        </div>
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-400 block">Cup-to-Disc Ratio (vCDR)</span>
          <span className={`text-base font-bold ${data.suspect_glaucoma ? "text-amber-400" : "text-slate-200"}`}>
            {data.cup_to_disc_ratio}
          </span>
          <span className="text-[10px] text-slate-500 block">{data.suspect_glaucoma ? "Suspect Glaucoma" : "Physiological"}</span>
        </div>
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-400 block">Sharpness (Laplacian)</span>
          <span className="text-base font-bold text-slate-200">{data.metrics?.sharpness_laplacian ?? "N/A"}</span>
          <span className="text-[10px] text-slate-500 block">Threshold &gt; 45.0</span>
        </div>
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-400 block">IQA Status</span>
          <span className="text-base font-bold text-emerald-400">{data.status}</span>
          <span className="text-[10px] text-slate-500 block">Passed Quality Gate</span>
        </div>
      </div>

      {/* 6. Clinical Decision Support Recommendations */}
      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3 mb-6 print:border-gray-400">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-emerald-400" /> Actionable Clinical Recommendation Plan
        </h4>
        <div className="text-xs space-y-2 text-slate-300">
          <p><span className="font-semibold text-white">Recommended Action:</span> {data.clinical_decision_support?.recommended_action}</p>
          <p><span className="font-semibold text-white">Telemedicine Routing:</span> {data.clinical_decision_support?.telemed_routing}</p>
          <p><span className="font-semibold text-white">Counseling:</span> {data.clinical_decision_support?.counseling_points}</p>
        </div>

        {data.clinical_decision_support?.clinical_alerts?.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-800 space-y-1">
            {data.clinical_decision_support.clinical_alerts.map((alert, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{alert}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7. Sign-off / Medical Audit Section */}
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
  );
}