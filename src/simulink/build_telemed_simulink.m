%% build_telemed_simulink.m
% Programmatically constructs the District Telemedicine Queuing Model in Simulink / SimEvents

function build_telemed_simulink()
    modelName = 'telemed_district_sim';
    
    % Close if already open, create new system
    if bdIsLoaded(modelName)
        close_system(modelName, 0);
    end
    new_system(modelName);
    open_system(modelName);

    fprintf('Assembling Simulink / SimEvents Screening Pipeline Blocks...\n');

    % Set simulation stop time (2400 hours = 1 operational year)
    set_param(modelName, 'StopTime', '2400');
    set_param(modelName, 'Solver', 'VariableStepDiscrete');

    % 1. Patient Arrival Generator (Poisson: Mean interarrival = 1/41.67 hr = 0.024 hr)
    add_block('simeventsqueue2/Time-Based Entity Generator', [modelName, '/Patient_Arrivals'], ...
        'Position', [50, 100, 120, 140], ...
        'Period', '0.024');

    % 2. PHC Image Acquisition & Local IQA Delay (Mean: 0.05 hr = 3 mins)
    add_block('simeventsqueue2/Single Server', [modelName, '/PHC_IQA_Station'], ...
        'Position', [180, 100, 250, 140], ...
        'ServiceTime', '0.05');

    % 3. Rural Network Uplink Queue (Bandwidth Bottleneck)
    add_block('simeventsqueue2/FIFO Queue', [modelName, '/Bandwidth_Uplink_Queue'], ...
        'Position', [310, 100, 380, 140], ...
        'Capacity', '500');

    % 4. Network Transmission Server (Latency depending on compression: 0.002 hr)
    add_block('simeventsqueue2/Single Server', [modelName, '/Network_Transmission'], ...
        'Position', [430, 100, 500, 140], ...
        'ServiceTime', '0.005');

    % 5. AI Cloud Screening Inference Server (Deterministic: 1.0 sec = 0.00028 hr)
    add_block('simeventsqueue2/Single Server', [modelName, '/AI_Screening_Engine'], ...
        'Position', [560, 100, 630, 140], ...
        'ServiceTime', '0.00028');

    % 6. Clinical Triage Switch (Routing: 78% Routine vs 22% Specialist)
    add_block('simeventsrouting2/Output Switch', [modelName, '/Clinical_Triage'], ...
        'Position', [690, 95, 750, 145], ...
        'NumberOutputPorts', '2', ...
        'SwitchingCriterion', 'Equiprobable');

    % 7. Specialist Review Queue (M/M/c: 2 District Ophthalmologists)
    add_block('simeventsqueue2/FIFO Queue', [modelName, '/Ophthalmologist_Queue'], ...
        'Position', [820, 50, 890, 90], ...
        'Capacity', '1000');

    add_block('simeventsqueue2/Single Server', [modelName, '/District_Specialist_Pool'], ...
        'Position', [940, 50, 1010, 90], ...
        'ServiceTime', '0.058'); % ~3.5 mins/case

    % 8. Sinks (Completed cases)
    add_block('simeventssink2/Entity Sink', [modelName, '/Routine_Discharge_Sink'], ...
        'Position', [820, 150, 870, 190]);

    add_block('simeventssink2/Entity Sink', [modelName, '/Specialist_Review_Complete'], ...
        'Position', [1060, 50, 1110, 90]);

    % Wire connections
    add_line(modelName, 'Patient_Arrivals/1', 'PHC_IQA_Station/1');
    add_line(modelName, 'PHC_IQA_Station/1', 'Bandwidth_Uplink_Queue/1');
    add_line(modelName, 'Bandwidth_Uplink_Queue/1', 'Network_Transmission/1');
    add_line(modelName, 'Network_Transmission/1', 'AI_Screening_Engine/1');
    add_line(modelName, 'AI_Screening_Engine/1', 'Clinical_Triage/1');
    add_line(modelName, 'Clinical_Triage/1', 'Ophthalmologist_Queue/1');
    add_line(modelName, 'Clinical_Triage/2', 'Routine_Discharge_Sink/1');
    add_line(modelName, 'Ophthalmologist_Queue/1', 'District_Specialist_Pool/1');
    add_line(modelName, 'District_Specialist_Pool/1', 'Specialist_Review_Complete/1');

    save_system(modelName);
    fprintf('Simulink model "%s.slx" successfully generated and wired!\n', modelName);
end