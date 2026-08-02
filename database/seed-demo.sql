USE railline;

INSERT INTO rail_line (code, name, km_min, km_max) VALUES
('G001', 'Beijing-Shanghai High-Speed Railway', 0, 1318),
('G002', 'Shanghai-Kunming High-Speed Railway', 0, 2252),
('G003', 'Beijing-Guangzhou High-Speed Railway', 0, 2298),
('G004', 'Chengdu-Chongqing High-Speed Railway', 0, 308)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  km_min = VALUES(km_min),
  km_max = VALUES(km_max);

INSERT INTO disease_type (code, name) VALUES
('DAMAGE', 'Damage'),
('CRACK', 'Crack'),
('DIAGONAL_CRACK', 'Diagonal crack'),
('MUD_JACKING', 'Mud jacking'),
('FASTENER_LOOSE', 'Fastener looseness')
ON DUPLICATE KEY UPDATE
  name = VALUES(name);

INSERT INTO detection (
  id, line_name, location, type_name, detect_date, severity,
  description, inspector, suggestion, history
) VALUES
(
  'D20240701001',
  'Beijing-Shanghai High-Speed Railway',
  'K500+123',
  'Crack',
  '2024-07-01',
  'Severe',
  'A longitudinal crack was detected on the right rail surface, approximately 18 cm long.',
  'Zhang Wei',
  'Reduce train speed and arrange follow-up inspection. Replace the rail if the defect continues to expand.',
  JSON_ARRAY('2024-06-15: Minor surface wear observed.', '2024-07-01: Crack expanded and was classified as severe.')
),
(
  'D20240702001',
  'Shanghai-Kunming High-Speed Railway',
  'K820+456',
  'Mud jacking',
  '2024-07-02',
  'Medium',
  'Localized mud jacking was detected near the track bed.',
  'Li Na',
  'Strengthen monitoring and schedule maintenance during the next service window.',
  JSON_ARRAY('2024-06-20: Early signs detected.', '2024-07-02: Affected area expanded.')
),
(
  'D20240703001',
  'Beijing-Guangzhou High-Speed Railway',
  'K1200+088',
  'Fastener looseness',
  '2024-07-03',
  'Minor',
  'Three fasteners were found to be slightly loose during continuous inspection.',
  'Wang Qiang',
  'Include the issue in routine maintenance and tighten fasteners in the next inspection window.',
  JSON_ARRAY('2024-07-03: First detection.')
)
ON DUPLICATE KEY UPDATE
  line_name = VALUES(line_name),
  location = VALUES(location),
  type_name = VALUES(type_name),
  detect_date = VALUES(detect_date),
  severity = VALUES(severity),
  description = VALUES(description),
  inspector = VALUES(inspector),
  suggestion = VALUES(suggestion),
  history = VALUES(history);

INSERT INTO ledger (
  id, line_name, location, type_name, record_date, severity,
  description, recorder, suggestion, history
) VALUES
(
  'L20240701001',
  'Beijing-Shanghai High-Speed Railway',
  'K500+123',
  'Crack',
  '2024-07-01',
  'Severe',
  'Ledger record created from the detection result for the right rail crack.',
  'Zhao Min',
  'Maintenance team has been notified for on-site verification and repair planning.',
  JSON_ARRAY('2024-07-01: Ledger record created.', '2024-07-02: Maintenance unit notified.')
),
(
  'L20240702001',
  'Shanghai-Kunming High-Speed Railway',
  'K820+456',
  'Mud jacking',
  '2024-07-02',
  'Medium',
  'Localized track bed issue requires follow-up inspection.',
  'Chen Lei',
  'Complete a reinspection within seven days and decide whether reinforcement is required.',
  JSON_ARRAY('2024-07-02: Ledger record created.')
),
(
  'L20240703001',
  'Beijing-Guangzhou High-Speed Railway',
  'K1200+088',
  'Fastener looseness',
  '2024-07-03',
  'Minor',
  'Several fasteners are loose but do not currently affect operation safety.',
  'Liu Yang',
  'Handle during the next maintenance window.',
  JSON_ARRAY('2024-07-03: Ledger record created.')
)
ON DUPLICATE KEY UPDATE
  line_name = VALUES(line_name),
  location = VALUES(location),
  type_name = VALUES(type_name),
  record_date = VALUES(record_date),
  severity = VALUES(severity),
  description = VALUES(description),
  recorder = VALUES(recorder),
  suggestion = VALUES(suggestion),
  history = VALUES(history);

INSERT INTO users (username, password, role, phone) VALUES
('admin', 'database-auth-placeholder-not-used-by-current-demo-login', 'ADMIN', NULL)
ON DUPLICATE KEY UPDATE
  role = VALUES(role),
  phone = VALUES(phone);

INSERT INTO viz_slots (slot_id, run_id, image_path, date_str, start_label, end_label) VALUES
(1, 'demo-run-001', '/viz-out/demo-run-001/image3D_1.png', '2025-09-03', 'K1152+864', 'K1147+104'),
(2, 'demo-run-002', '/viz-out/demo-run-002/image3D_2.png', '2025-09-03', 'K1147+104', 'K1144+224'),
(3, 'demo-run-003', '/viz-out/demo-run-003/image3D_3.png', '2025-09-03', 'K1144+224', 'K1141+344'),
(4, 'demo-run-004', '/viz-out/demo-run-004/image3D_4.png', '2025-09-03', 'K1141+344', 'K1138+464')
ON DUPLICATE KEY UPDATE
  run_id = VALUES(run_id),
  image_path = VALUES(image_path),
  date_str = VALUES(date_str),
  start_label = VALUES(start_label),
  end_label = VALUES(end_label);

DELETE FROM analysis_result WHERE run_id IN ('demo-run-001', 'demo-run-002');

INSERT INTO analysis_result (slot_id, metrics_json, analyzed_at, run_id) VALUES
(1, JSON_OBJECT('total', 8, 'Damage', 1, 'Crack', 2, 'Diagonal crack', 1, 'Mud jacking', 4), '2025-09-03 14:05:32', 'demo-run-001'),
(2, JSON_OBJECT('total', 5, 'Damage', 0, 'Crack', 1, 'Diagonal crack', 1, 'Mud jacking', 3), '2025-09-03 14:10:18', 'demo-run-002');

INSERT INTO viz_run (
  run_uuid, line_name, start_abs_m, end_abs_m, year_start, year_end,
  month, day, status, progress, out_dir, result_2d_url, result_3d_url, defects_url
) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  'Beijing-Shanghai High-Speed Railway',
  1147104,
  1152864,
  2025,
  2025,
  9,
  3,
  'SUCCESS',
  100,
  './output/demo-run-001',
  '/output/demo-run-001/image2D.png',
  '/output/demo-run-001/image3D.png',
  '/output/demo-run-001/defects.json'
)
ON DUPLICATE KEY UPDATE
  status = VALUES(status),
  progress = VALUES(progress),
  result_2d_url = VALUES(result_2d_url),
  result_3d_url = VALUES(result_3d_url),
  defects_url = VALUES(defects_url);

DELETE FROM viz_defect WHERE run_uuid = '00000000-0000-0000-0000-000000000001';

INSERT INTO viz_defect (run_uuid, time_s, mileage_km, cls) VALUES
('00000000-0000-0000-0000-000000000001', 5.830, 1147.104, 'Mud jacking'),
('00000000-0000-0000-0000-000000000001', 4.210, 1147.096, 'Crack');
