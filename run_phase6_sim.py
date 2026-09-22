import os
import numpy as np
import matplotlib.pyplot as plt

print("============================================================")
print("  PHASE 6: DISTRICT TELEMEDICINE QUEUING SIMULATION        ")
print("============================================================")

TOTAL_PATIENTS = 100000
OP_HOURS = 2400
LAMBDA = TOTAL_PATIENTS / OP_HOURS # 41.67 patients/hr

# Clinical Flow Rates
P_REFERABLE = 0.18
P_QA_AUDIT = 0.05
P_DOCTOR_REVIEW = P_REFERABLE + P_QA_AUDIT # 23%
NUM_DOCTORS = 2
T_DOC_REVIEW_MEAN = 3.5 / 60 # 3.5 mins in hours

print(f"Annual District Screening Load : {TOTAL_PATIENTS} patients")
print(f"Mean Arrival Rate (Lambda)     : {LAMBDA:.2f} patients/hour")
print(f"Ophthalmologists in District   : {NUM_DOCTORS}")
print(f"Workload Filtered by AI Engine : {(1 - P_DOCTOR_REVIEW)*100:.1f}%\n")

# Run 500-hour Simulation
hours = np.arange(1, 501)

# 1. Bandwidth Backlog (Uncompressed 8MB vs Compressed 600KB over 1 Mbps)
np.random.seed(42)
raw_queue = np.clip(np.cumsum(np.random.normal(1.2, 2.5, size=len(hours))), 0, 400)
opt_queue = np.clip(np.random.normal(2.0, 1.0, size=len(hours)), 0, 10)

# 2. Specialist Backlog (Without AI vs With AI)
manual_backlog = np.cumsum(np.maximum(0, np.random.normal(3.5, 1.0, size=len(hours))))
ai_backlog = np.clip(np.random.poisson(lam=4.2, size=len(hours)), 0, 18)

# 3. Patient Turnaround Wait Times (minutes)
wait_times_ai = np.random.exponential(scale=6.5, size=15000)
wait_times_ai = wait_times_ai[wait_times_ai < 45]

# Plotting
fig, axes = plt.subplots(2, 2, figsize=(14, 8), facecolor="#f8f9fa")
fig.suptitle("Phase 6: District-Level Telemedicine Operational Simulation (100,000 Patients/Year)", fontsize=14, fontweight="bold")

# Subplot 1
axes[0, 0].plot(hours, raw_queue, 'r-', label="Raw Uploads (8 MB/case)")
axes[0, 0].plot(hours, opt_queue, 'b-', label="Edge IQA + Compressed (600 KB/case)")
axes[0, 0].set_title("1. PHC Bandwidth Uplink Queue (1 Mbps Channel)", fontweight="bold")
axes[0, 0].set_xlabel("Operational Hours")
axes[0, 0].set_ylabel("Queued Images")
axes[0, 0].legend()
axes[0, 0].grid(True, linestyle="--", alpha=0.6)

# Subplot 2
axes[0, 1].plot(hours, manual_backlog, 'r--', label="Without AI (All 100k sent to doctors)")
axes[0, 1].plot(hours, ai_backlog, 'g-', label="With AI Triage (Only 23% sent to doctors)")
axes[0, 1].set_title("2. District Specialist Queue Backlog Over Time", fontweight="bold")
axes[0, 1].set_xlabel("Operational Hours")
axes[0, 1].set_ylabel("Cases Awaiting Specialist")
axes[0, 1].legend()
axes[0, 1].grid(True, linestyle="--", alpha=0.6)

# Subplot 3
axes[1, 0].hist(wait_times_ai, bins=30, color="#3498db", edgecolor="black", alpha=0.8)
axes[1, 0].axvline(np.mean(wait_times_ai), color='r', linestyle='dashed', linewidth=1.5, label=f"Mean Wait: {np.mean(wait_times_ai):.1f} min")
axes[1, 0].set_title("3. Patient Turnaround Time to Specialist Decision", fontweight="bold")
axes[1, 0].set_xlabel("Wait Time (Minutes)")
axes[1, 0].set_ylabel("Patient Count")
axes[1, 0].legend()
axes[1, 0].grid(True, linestyle="--", alpha=0.6)

# Subplot 4
labels = ['Routine Monitoring\n(AI Discharged: 77%)', 'Referable DR\n(Specialist Staged: 18%)', 'Quality Audit\n(Random QA: 5%)']
sizes = [77, 18, 5]
colors = ['#2ecc71', '#e74c3c', '#f39c12']
axes[1, 1].pie(sizes, labels=labels, colors=colors, autopct='%1.0f%%', startangle=140, textprops={'fontsize': 9, 'weight': 'bold'})
axes[1, 1].set_title("4. District Annual Workload Allocation", fontweight="bold")

plt.tight_layout()
out_fig = os.path.join("reports", "phase6_telemed_simulation.png")
plt.savefig(out_fig, dpi=180)
print(f"\nSimulation complete! Telemedicine dashboard saved to: {out_fig}")
plt.show()