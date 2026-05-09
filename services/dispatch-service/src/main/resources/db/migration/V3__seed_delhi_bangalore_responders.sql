-- V3__seed_delhi_bangalore_responders.sql
-- Add responders for Delhi and Bangalore

INSERT INTO dispatch.responders (id, name, type, status, phone_number, vehicle_id, latitude, longitude, city)
VALUES
  (gen_random_uuid(), 'Ambulance DEL-01', 'AMBULANCE', 'AVAILABLE', '+911100000001', 'DL-AMB-01', 28.6139, 77.2090, 'delhi'),
  (gen_random_uuid(), 'Ambulance DEL-02', 'AMBULANCE', 'AVAILABLE', '+911100000002', 'DL-AMB-02', 28.6200, 77.2150, 'delhi'),
  (gen_random_uuid(), 'Police DEL-01',    'POLICE',    'AVAILABLE', '+911100000003', 'DL-POL-01', 28.6100, 77.2000, 'delhi'),
  (gen_random_uuid(), 'Fire DEL-01',      'FIRE',      'AVAILABLE', '+911100000004', 'DL-FIRE-01',28.6250, 77.2200, 'delhi'),
  (gen_random_uuid(), 'Ambulance BLR-01', 'AMBULANCE', 'AVAILABLE', '+918000000001', 'KA-AMB-01', 12.9716, 77.5946, 'bangalore'),
  (gen_random_uuid(), 'Ambulance BLR-02', 'AMBULANCE', 'AVAILABLE', '+918000000002', 'KA-AMB-02', 12.9800, 77.6000, 'bangalore'),
  (gen_random_uuid(), 'Police BLR-01',    'POLICE',    'AVAILABLE', '+918000000003', 'KA-POL-01', 12.9650, 77.5900, 'bangalore'),
  (gen_random_uuid(), 'Fire BLR-01',      'FIRE',      'AVAILABLE', '+918000000004', 'KA-FIRE-01',12.9750, 77.6050, 'bangalore');