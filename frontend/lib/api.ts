export interface QualityMetrics {
  blur_score?: number;
  luminance?: number;
  fov_ratio?: number;
  reason?: string;
  [key: string]: any;
}

export interface ScreeningResponse {
  status: "GRADABLE" | "UNGRADABLE" | string;
  metrics: QualityMetrics;
  reason?: string;
  dr_grade?: number; // 0 to 4
  confidence?: number; // e.g. 91.4
  is_referable?: boolean;
  alignment_score?: number; // e.g. 34.2
  vessel_density?: number;
  images?: {
    enhanced: string; // data:image/png;base64,...
    vessels: string;  // data:image/png;base64,...
    gradcam: string;  // data:image/png;base64,...
  };
}

export const DR_LABELS: Record<number, { title: string; desc: string; color: string }> = {
  0: { title: "No DR", desc: "No apparent retinopathy detected.", color: "text-emerald-500" },
  1: { title: "Mild NPDR", desc: "Microaneurysms only. Recommend 12-month re-screening.", color: "text-blue-500" },
  2: { title: "Moderate NPDR", desc: "Microaneurysms, hemorrhages, hard exudates. Refer for specialist evaluation.", color: "text-amber-500" },
  3: { title: "Severe NPDR", desc: ">20 intraretinal hemorrhages or venous beading. Urgent ophthalmology referral.", color: "text-orange-600" },
  4: { title: "Proliferative DR", desc: "Neovascularization or vitreous hemorrhage. High risk of vision loss.", color: "text-red-600" },
};

export async function screenFundusImage(file: File): Promise<ScreeningResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("http://localhost:8000/api/screen", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorMsg = await res.text();
    throw new Error(`Inference server error (${res.status}): ${errorMsg}`);
  }

  return await res.json();
}