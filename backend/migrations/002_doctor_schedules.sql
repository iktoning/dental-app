-- Jam praktik dokter per hari
CREATE TABLE doctor_schedules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week     INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Minggu, 1=Senin, ..., 6=Sabtu
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    slot_duration   INT NOT NULL DEFAULT 30,  -- menit per slot
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (doctor_id, day_of_week, start_time)
);

CREATE INDEX idx_doctor_schedules_doctor ON doctor_schedules(doctor_id, day_of_week);

-- Cek: end_time harus setelah start_time
ALTER TABLE doctor_schedules
  ADD CONSTRAINT chk_time_range CHECK (end_time > start_time);