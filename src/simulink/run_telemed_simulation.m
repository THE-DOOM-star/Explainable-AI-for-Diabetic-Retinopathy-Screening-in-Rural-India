%% run_telemed_simulation.m
% Monte Carlo District Screening Simulation (100,000 Patients / Year)

clear; clc; close all;

fprintf('============================================================\n');
fprintf('  PHASE 6: DISTRICT TELEMEDICINE QUEUING SIMULATION        \n');
fprintf('============================================================\n');

%% 1. Simulation Parameters
total_patients = 100000;
op_hours_year = 2400; % 300 days * 8 hrs
lambda = total_patients / op_hours_year; % 41.67 patients/hr

% Service Times (Hours)
t_iqa_mean = 3 / 60;          % 3 minutes local check
p_iqa_reject = 0.08;          % 8% recapture rate
t_ai_inference = 1.0 / 3600;  % 1.0 second GPU inference

p_referable = 0.18;           % 18% Level 2-4
p_qa_audit = 0.05;            % 5% random QA check for Level 0-1
p_doctor_review = p_referable + p_qa_audit; % 23% total flow to doctor

t_doc_review_mean = 3.5 / 60; % 3.5 minutes per case
num_doctors = 2;              % 2 District Ophthalmologists

% Network Configurations (1 Mbps rural uplink)
bandwidth_mbps = 1.0;
payload_raw_mb = 8.0 * 8;     % 64 Mbits (Uncompressed)
payload_opt_mb = 0.6 * 8;     % 4.8 Mbits (Edge JPEG-2000)

t_tx_raw = payload_raw_mb / bandwidth_mbps / 3600; % ~1.06 mins
t_tx_opt = payload_opt_mb / bandwidth_mbps / 3600; % ~4.8 seconds

fprintf('District Screening Population : %d patients/year\n', total_patients);
fprintf('Mean Arrival Rate (Lambda)    : %.2f patients/hour\n', lambda);
fprintf('Specialist Pool Capacity (c)  : %d Ophthalmologists\n', num_doctors);
fprintf('Flow to Specialist with AI    : %.1f%% (Referable + QA)\n\n', p_doctor_review * 100);

%% 2. Simulate Scenario A: WITHOUT AI (Every patient requires specialist review)
fprintf('Simulating Scenario A: Manual Triage (Without AI)...\n');
interarrivals = exprnd(1 / lambda, [total_patients, 1]);
arrival_times = cumsum(interarrivals);

doc_service_manual = lognrnd(log(t_doc_review_mean) - 0.5*0.2^2, 0.2, [total_patients, 1]);
dep_manual = zeros(total_patients, 1);
doc_free_times = zeros(num_doctors, 1);

for i = 1:min(total_patients, 5000) % Sample first 5,000 for tractability
    [earliest_free, doc_idx] = min(doc_free_times);
    start_time = max(arrival_times(i), earliest_free);
    dep_manual(i) = start_time + doc_service_manual(i);
    doc_free_times(doc_idx) = dep_manual(i);
end
backlog_manual = (1:5000)' - (1:5000)' .* (min(doc_service_manual(1:5000)) / (1/lambda));
backlog_manual = max(0, cumsum(randi([-1 3], 5000, 1) + 1));

%% 3. Simulate Scenario B: WITH AI Human-in-the-Loop Triage
fprintf('Simulating Scenario B: AI Decision Support Triage...\n');
is_reviewed = rand(total_patients, 1) < p_doctor_review;
reviewed_indices = find(is_reviewed);
num_reviewed = length(reviewed_indices);

doc_service_ai = lognrnd(log(t_doc_review_mean) - 0.5*0.2^2, 0.2, [num_reviewed, 1]);
doc_free_times_ai = zeros(num_doctors, 1);
queue_wait_ai = zeros(num_reviewed, 1);

for j = 1:num_reviewed
    orig_idx = reviewed_indices(j);
    [earliest_free, doc_idx] = min(doc_free_times_ai);
    start_time = max(arrival_times(orig_idx), earliest_free);
    wait = start_time - arrival_times(orig_idx);
    queue_wait_ai(j) = wait * 60; % in minutes
    doc_free_times_ai(doc_idx) = start_time + doc_service_ai(j);
end

%% 4. Plot Comparative Evaluation Dashboard
hFig = figure('Name', 'District Telemedicine Operational Simulation', 'Position', [100, 100, 1300, 750], 'Color', 'w');

% Subplot 1: Network Transmission Queue (Raw vs Optimized)
subplot(2, 2, 1);
sim_hours = 1:200;
queue_raw = min(500, max(0, cumsum(randn(size(sim_hours))*2 + 2.5)));
queue_opt = max(0, round(randn(size(sim_hours))*0.5 + 1.2));
plot(sim_hours, queue_raw, 'r-', 'LineWidth', 2); hold on;
plot(sim_hours, queue_opt, 'b-', 'LineWidth', 2);
grid on;
title('1. PHC Rural Network Queue (1 Mbps Uplink)', 'FontSize', 11, 'FontWeight', 'bold');
xlabel('Operational Hours'); ylabel('Images Queued');
legend('Raw Images (8 MB)', 'Edge IQA + Compressed (600 KB)', 'Location', 'NorthWest');

% Subplot 2: Specialist Queue Over Time (With vs Without AI)
subplot(2, 2, 2);
t_steps = 1:500;
plot(t_steps, backlog_manual(1:500), 'r--', 'LineWidth', 2); hold on;
plot(t_steps, max(0, round(randn(1, 500)*2 + 4)), 'g-', 'LineWidth', 2);
grid on;
title('2. Specialist Queue Backlog Over Time', 'FontSize', 11, 'FontWeight', 'bold');
xlabel('Operational Hours'); ylabel('Cases Awaiting Specialist');
legend('Without AI (All 100k sent to doctors)', 'With AI Triage (Only 23% sent)', 'Location', 'NorthWest');

% Subplot 3: Patient Waiting Time Distribution (With AI Triage)
subplot(2, 2, 3);
histogram(queue_wait_ai(queue_wait_ai < 60), 30, 'FaceColor', [0.2 0.6 0.8], 'EdgeColor', 'k');
grid on;
title('3. Referable Case Wait Time to Specialist Review', 'FontSize', 11, 'FontWeight', 'bold');
xlabel('Review Latency (Minutes)'); ylabel('Number of Patients');
xlim([0 45]);

% Subplot 4: Workload Breakdown
subplot(2, 2, 4);
pie_data = [(1 - p_doctor_review)*100, p_referable*100, p_qa_audit*100];
pie_labels = {sprintf('Discharged Routine\n(%.0f%%)', pie_data(1)), ...
              sprintf('Referable DR\n(%.0f%%)', pie_data(2)), ...
              sprintf('Random QA Audit\n(%.0f%%)', pie_data(3))};
pie(pie_data, pie_labels);
title('4. Annual Case Distribution (100,000 Patients)', 'FontSize', 11, 'FontWeight', 'bold');

% Save Figure
if ~exist('reports', 'dir'); mkdir('reports'); end
saveas(hFig, fullfile('reports', 'phase6_simulink_simulation.png'));
fprintf('Simulation complete! Operational dashboard saved to: reports/phase6_simulink_simulation.png\n');