-- ============================================
-- ENUM TYPES
-- ============================================
CREATE TYPE user_role AS ENUM ('doctor', 'staff', 'admin');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
CREATE TYPE appointment_status AS ENUM (
    'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'
);
CREATE TYPE appointment_source AS ENUM ('web', 'whatsapp', 'walk_in', 'phone');
CREATE TYPE queue_status AS ENUM ('waiting', 'called', 'serving', 'done', 'skipped');
CREATE TYPE invoice_status AS ENUM ('unpaid', 'partial', 'paid', 'cancelled');
CREATE TYPE tooth_condition AS ENUM (
    'healthy', 'caries', 'filled', 'crown', 'extracted',
    'missing', 'root_canal', 'implant', 'fractured'
);

-- ============================================
-- USERS (dokter, staff, admin)
-- ============================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(150) UNIQUE NOT NULL,
    phone           VARCHAR(20),
    password_hash   TEXT NOT NULL,
    role            user_role NOT NULL DEFAULT 'doctor',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- PATIENTS
-- ============================================
CREATE TABLE patients (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name       VARCHAR(150) NOT NULL,
    phone           VARCHAR(20) NOT NULL,
    email           VARCHAR(150),
    birth_date      DATE,
    gender          gender_type,
    address         TEXT,
    allergies       TEXT,              -- catatan alergi (obat, bahan)
    medical_notes   TEXT,              -- riwayat sistemik (diabetes, hipertensi, dll)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_name ON patients(full_name);

-- ============================================
-- SERVICES (master tindakan/layanan)
-- ============================================
CREATE TABLE services (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(150) NOT NULL,       -- "Scaling", "Tambal Komposit", dll
    description     TEXT,
    price           NUMERIC(12, 2) NOT NULL DEFAULT 0,
    duration_min    INT NOT NULL DEFAULT 30,     -- durasi default dalam menit
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- APPOINTMENTS (janji temu)
-- ============================================
CREATE TABLE appointments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    scheduled_at    TIMESTAMPTZ NOT NULL,
    duration_min    INT NOT NULL DEFAULT 30,
    status          appointment_status NOT NULL DEFAULT 'pending',
    complaint       TEXT,                        -- keluhan pasien
    source          appointment_source NOT NULL DEFAULT 'web',
    notes           TEXT,                        -- catatan dokter/staff
    created_by      UUID REFERENCES users(id),   -- siapa yang input (dokter/staff/pasien)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_appointments_doctor_date ON appointments(doctor_id, scheduled_at);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_status ON appointments(status);

-- ============================================
-- TREATMENTS (tindakan yang dilakukan saat kunjungan)
-- ============================================
CREATE TABLE treatments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id  UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    service_id      UUID REFERENCES services(id) ON DELETE SET NULL,
    tooth_number    VARCHAR(5),                  -- format FDI: 11-48, atau NULL jika bukan per gigi
    diagnosis       TEXT,
    notes           TEXT,
    price           NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_treatments_appointment ON treatments(appointment_id);
CREATE INDEX idx_treatments_tooth ON treatments(tooth_number);

-- ============================================
-- ODONTOGRAM ENTRIES (riwayat kondisi gigi)
-- ============================================
CREATE TABLE odontogram_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    tooth_number    VARCHAR(5) NOT NULL,         -- FDI: 11-48
    condition       tooth_condition NOT NULL,
    surface         VARCHAR(10),                 -- 'mesial','distal','buccal','lingual','occlusal'
    notes           TEXT,
    recorded_by     UUID REFERENCES users(id),
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_odontogram_patient ON odontogram_entries(patient_id);
CREATE INDEX idx_odontogram_tooth ON odontogram_entries(patient_id, tooth_number);

-- ============================================
-- QUEUE TICKETS (antrian)
-- ============================================
CREATE TABLE queue_tickets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID REFERENCES patients(id) ON DELETE SET NULL,
    appointment_id  UUID REFERENCES appointments(id) ON DELETE SET NULL,
    queue_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    queue_number    INT NOT NULL,                -- nomor urut per hari
    status          queue_status NOT NULL DEFAULT 'waiting',
    source          appointment_source NOT NULL DEFAULT 'walk_in',
    called_at       TIMESTAMPTZ,
    served_at       TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (queue_date, queue_number)
);

CREATE INDEX idx_queue_date_status ON queue_tickets(queue_date, status);

-- ============================================
-- INVOICES & INVOICE ITEMS
-- ============================================
CREATE TABLE invoices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number  VARCHAR(30) UNIQUE NOT NULL,  -- INV-20250101-0001
    patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    appointment_id  UUID REFERENCES appointments(id) ON DELETE SET NULL,
    total_amount    NUMERIC(12, 2) NOT NULL DEFAULT 0,
    paid_amount     NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status          invoice_status NOT NULL DEFAULT 'unpaid',
    paid_at         TIMESTAMPTZ,
    notes           TEXT,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_patient ON invoices(patient_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(created_at);

CREATE TABLE invoice_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description     VARCHAR(255) NOT NULL,
    qty             INT NOT NULL DEFAULT 1,
    price           NUMERIC(12, 2) NOT NULL DEFAULT 0,
    subtotal        NUMERIC(12, 2) NOT NULL DEFAULT 0
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

-- ============================================
-- AUDIT LOGS (untuk tracking perubahan)
-- ============================================
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    action          VARCHAR(50) NOT NULL,        -- 'create','update','delete','login'
    entity          VARCHAR(50) NOT NULL,        -- 'patient','appointment', dll
    entity_id       UUID,
    metadata        JSONB,
    ip_address      INET,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- ============================================
-- TRIGGER: auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: generate queue_number per hari
-- ============================================
CREATE OR REPLACE FUNCTION next_queue_number(p_date DATE DEFAULT CURRENT_DATE)
RETURNS INT AS $$
DECLARE
    next_num INT;
BEGIN
    SELECT COALESCE(MAX(queue_number), 0) + 1
    INTO next_num
    FROM queue_tickets
    WHERE queue_date = p_date;
    RETURN next_num;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: generate invoice_number
-- ============================================
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
    seq INT;
    today DATE := CURRENT_DATE;
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        SELECT COUNT(*) + 1 INTO seq
        FROM invoices
        WHERE DATE(created_at) = today;
        NEW.invoice_number := 'INV-' || TO_CHAR(today, 'YYYYMMDD') || '-' || LPAD(seq::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_invoice_number
    BEFORE INSERT ON invoices
    FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();