import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  User, Phone, Calendar, IdCard, Shield, MapPin, Briefcase,
  AlertTriangle, CheckCircle2, ChevronLeft, Loader2, Pencil,
  X, Clock, Stethoscope, UserX, RotateCcw,
} from 'lucide-react'
import { patientsApi, CLASSIFICATION_META, type PatientDetail, type DuplicateError } from '../../api/patients.api'

// ─── Design helpers ───────────────────────────────────────────

const card: React.CSSProperties = {
  backgroundColor: 'white', borderRadius: '14px',
  border: '1px solid #e5e7eb', padding: '24px 28px', marginBottom: '20px',
}
const labelStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 500, color: '#9ca3af', marginBottom: '3px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }
const valueStyle: React.CSSProperties = { fontSize: '14px', color: '#111827', fontWeight: 500 }
const inputBase: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb',
  borderRadius: '8px', fontSize: '13px', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit', backgroundColor: 'white',
}
const inputErr: React.CSSProperties = { ...inputBase, borderColor: '#ef4444' }
const row2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:    { label: 'Chờ xác nhận',  color: '#d97706', bg: '#fffbeb' },
  CONFIRMED:  { label: 'Đã xác nhận',   color: '#2563eb', bg: '#eff6ff' },
  CHECKED_IN: { label: 'Đã đến',        color: '#0891b2', bg: '#ecfeff' },
  IN_PROGRESS:{ label: 'Đang khám',     color: '#7c3aed', bg: '#f5f3ff' },
  COMPLETED:  { label: 'Hoàn thành',    color: '#059669', bg: '#ecfdf5' },
  CANCELLED:  { label: 'Đã hủy',        color: '#dc2626', bg: '#fff1f2' },
  NO_SHOW:    { label: 'Không đến',     color: '#6b7280', bg: '#f3f4f6' },
}

// ─── View field ───────────────────────────────────────────────

function ViewField({ label, value, icon: Icon }: { label: string; value?: string | null; icon?: any }) {
  return (
    <div>
      <span style={labelStyle}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {Icon && <Icon size={14} color="#6b7280" />}
        <span style={valueStyle}>{value || <span style={{ color: '#9ca3af' }}>—</span>}</span>
      </div>
    </div>
  )
}

// ─── Edit form state ──────────────────────────────────────────

interface EditState {
  fullName: string; dateOfBirth: string; gender: string; phone: string
  nationalId: string; bhytCode: string; address: string; occupation: string
  emergencyContactName: string; emergencyContactPhone: string; adminNote: string
  classification: string
}

function patientToEdit(p: PatientDetail): EditState {
  return {
    fullName:              p.fullName,
    dateOfBirth:           p.dateOfBirth.slice(0, 10),
    gender:                p.gender,
    phone:                 p.phone,
    nationalId:            p.nationalId  ?? '',
    bhytCode:              p.bhytCode    ?? '',
    address:               p.address     ?? '',
    occupation:            p.occupation  ?? '',
    emergencyContactName:  p.emergencyContactName  ?? '',
    emergencyContactPhone: p.emergencyContactPhone ?? '',
    adminNote:             p.adminNote   ?? '',
    classification:        p.classification,
  }
}

// ─── Main ─────────────────────────────────────────────────────

export default function PatientDetailPage() {
  const { id }      = useParams<{ id: string }>()
  const navigate    = useNavigate()
  const [sp]        = useSearchParams()
  const startEdit   = sp.get('edit') === '1'

  const [patient,   setPatient]   = useState<PatientDetail | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [notFound,  setNotFound]  = useState(false)

  const [editing,   setEditing]   = useState(startEdit)
  const [form,      setForm]      = useState<EditState | null>(null)
  const [errors,    setErrors]    = useState<Partial<EditState>>({})
  const [saving,    setSaving]    = useState(false)
  const [success,   setSuccess]   = useState('')
  const [apiError,  setApiError]  = useState('')
  const [duplicate, setDuplicate] = useState<DuplicateError | null>(null)
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    patientsApi.get(Number(id))
      .then(r => { setPatient(r.data); setForm(patientToEdit(r.data)) })
      .catch(e => { if (e?.response?.status === 404) setNotFound(true) })
      .finally(() => setLoading(false))
  }, [id])

  const set = (key: keyof EditState) => (v: string) => {
    setForm(f => f ? { ...f, [key]: v } : f)
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }))
    setDuplicate(null)
  }

  const validate = (): boolean => {
    if (!form) return false
    const e: Partial<EditState> = {}
    if (!form.fullName.trim())  e.fullName    = 'Họ và tên không được để trống'
    if (!form.dateOfBirth)      e.dateOfBirth = 'Ngày sinh không được để trống'
    if (!form.phone.trim())     e.phone       = 'Số điện thoại không được để trống'
    else if (!/^0\d{9,10}$/.test(form.phone.replace(/\s/g, '')))
      e.phone = 'Số điện thoại không hợp lệ'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!form || !patient) return
    if (!validate()) return
    setSaving(true); setApiError(''); setDuplicate(null)
    try {
      const res = await patientsApi.update(patient.id, {
        fullName:              form.fullName.trim(),
        dateOfBirth:           form.dateOfBirth,
        gender:                form.gender,
        phone:                 form.phone.trim(),
        nationalId:            form.nationalId.trim()  || undefined,
        bhytCode:              form.bhytCode.trim()    || undefined,
        address:               form.address.trim()     || undefined,
        occupation:            form.occupation.trim()  || undefined,
        emergencyContactName:  form.emergencyContactName.trim()  || undefined,
        emergencyContactPhone: form.emergencyContactPhone.trim() || undefined,
        adminNote:             form.adminNote.trim()   || undefined,
        classification:        form.classification,
      })
      setPatient(res.data)
      setForm(patientToEdit(res.data))
      setEditing(false)
      setSuccess('Đã cập nhật thông tin thành công')
      setTimeout(() => setSuccess(''), 3500)
    } catch (err: any) {
      if (err?.response?.status === 409) setDuplicate(err.response.data as DuplicateError)
      else setApiError(err?.response?.data?.message ?? 'Lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (patient) setForm(patientToEdit(patient))
    setEditing(false); setErrors({}); setDuplicate(null); setApiError('')
  }

  const handleDeactivate = async () => {
    if (!patient || !confirm(`Vô hiệu hóa hồ sơ của "${patient.fullName}"?`)) return
    try {
      await patientsApi.deactivate(patient.id)
      navigate('/staff/patients')
    } catch { alert('Không thể vô hiệu hóa.') }
  }

  // ── Render loading / not found ────────────────────────────

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
      <Loader2 size={24} color="#2563eb" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (notFound || !patient) return (
    <div style={{ padding: '48px 32px', textAlign: 'center' }}>
      <p style={{ fontSize: '16px', fontWeight: 600, color: '#374151' }}>Không tìm thấy hồ sơ bệnh nhân</p>
      <button onClick={() => navigate('/staff/patients')} style={{ marginTop: '12px', padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: 'white', cursor: 'pointer', fontSize: '13px' }}>
        Quay lại danh sách
      </button>
    </div>
  )

  const cls = CLASSIFICATION_META[patient.classification] ?? { label: patient.classification, color: '#6b7280', bg: '#f3f4f6' }

  // ── Render ─────────────────────────────────────────────────

  return (
    <div style={{ padding: '28px 32px', maxWidth: '920px', margin: '0 auto' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px', fontSize: '13px', color: '#6b7280' }}>
        <Link to="/staff/patients" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>Bệnh nhân</Link>
        <span>›</span>
        <span>{patient.code}</span>
      </div>

      {/* Patient header */}
      <div style={{ ...card, marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => navigate('/staff/patients')} style={{ padding: '7px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', display: 'flex' }}>
              <ChevronLeft size={16} color="#6b7280" />
            </button>
            <div style={{
              width: '56px', height: '56px', borderRadius: '14px', flexShrink: 0,
              backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '22px', fontWeight: 700, color: '#2563eb',
            }}>
              {patient.fullName.charAt(0)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: 0 }}>{patient.fullName}</h1>
                <span style={{ padding: '3px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 700, color: cls.color, backgroundColor: cls.bg }}>
                  {cls.label}
                </span>
                {!patient.isActive && (
                  <span style={{ padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, color: '#6b7280', backgroundColor: '#f3f4f6' }}>Vô hiệu</span>
                )}
                {!patient.isComplete && (
                  <span style={{ padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, color: '#92400e', backgroundColor: '#fef3c7' }}>Chưa đầy đủ</span>
                )}
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
                {patient.code} · {patient.gender === 'NAM' ? 'Nam' : 'Nữ'} · {new Date(patient.dateOfBirth).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>

          {/* Actions */}
          {!editing ? (
            <div style={{ display: 'flex', gap: '10px' }}>
              {patient.isActive && (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', border: '1.5px solid #2563eb', borderRadius: '9px', backgroundColor: 'white', color: '#2563eb', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                  >
                    <Pencil size={14} /> Chỉnh sửa
                  </button>
                  <button
                    onClick={handleDeactivate}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', border: '1.5px solid #e5e7eb', borderRadius: '9px', backgroundColor: 'white', color: '#6b7280', fontWeight: 500, fontSize: '13px', cursor: 'pointer' }}
                  >
                    <UserX size={14} />
                  </button>
                </>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleCancel}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', border: '1.5px solid #e5e7eb', borderRadius: '9px', backgroundColor: 'white', color: '#374151', fontWeight: 500, fontSize: '13px', cursor: 'pointer' }}
              >
                <X size={14} /> Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 20px', border: 'none', borderRadius: '9px', backgroundColor: saving ? '#93c5fd' : '#2563eb', color: 'white', fontWeight: 600, fontSize: '13px', cursor: saving ? 'wait' : 'pointer' }}
              >
                {saving && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
                Lưu thay đổi
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', marginBottom: '16px' }}>
          <CheckCircle2 size={16} color="#16a34a" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#15803d' }}>{success}</span>
        </div>
      )}
      {apiError && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '10px', marginBottom: '16px' }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#be123c' }}>{apiError}</p>
        </div>
      )}
      {duplicate && (
        <div style={{ padding: '16px 20px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', marginBottom: '16px' }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#9a3412' }}>{duplicate.message}</p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#c2410c' }}>
            Hồ sơ trùng: {duplicate.duplicate.patient.code} – {duplicate.duplicate.patient.fullName}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2px', backgroundColor: '#f3f4f6', padding: '4px', borderRadius: '10px', width: 'fit-content', marginBottom: '20px' }}>
        {[
          { key: 'info',    label: 'Thông tin hồ sơ', icon: User },
          { key: 'history', label: `Lịch sử khám (${patient.appointments.length})`, icon: Clock },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 18px', borderRadius: '8px', border: 'none', fontSize: '13px',
              fontWeight: activeTab === tab.key ? 700 : 400, cursor: 'pointer',
              backgroundColor: activeTab === tab.key ? 'white' : 'transparent',
              color: activeTab === tab.key ? '#111827' : '#6b7280',
              boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'info' && form && (
        <>
          {/* Personal info */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <User size={16} color="#2563eb" />
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: 0 }}>Thông tin cá nhân</h2>
            </div>
            {!editing ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <ViewField label="Họ và tên"     value={patient.fullName} />
                <ViewField label="Ngày sinh"      value={new Date(patient.dateOfBirth).toLocaleDateString('vi-VN')} />
                <ViewField label="Giới tính"      value={patient.gender === 'NAM' ? 'Nam' : 'Nữ'} />
                <ViewField label="Số điện thoại"  value={patient.phone} icon={Phone} />
              </div>
            ) : (
              <div>
                <div style={row2}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '6px' }}>
                      Họ và tên <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input value={form.fullName} onChange={e => set('fullName')(e.target.value)} style={errors.fullName ? inputErr : inputBase} />
                    {errors.fullName && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>{errors.fullName}</p>}
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '6px' }}>
                      Ngày sinh <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input type="date" value={form.dateOfBirth} max={new Date().toISOString().slice(0, 10)} onChange={e => set('dateOfBirth')(e.target.value)} style={errors.dateOfBirth ? inputErr : inputBase} />
                    {errors.dateOfBirth && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>{errors.dateOfBirth}</p>}
                  </div>
                </div>
                <div style={{ ...row2, marginTop: '16px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '6px' }}>Giới tính</label>
                    <div style={{ display: 'flex', gap: '20px', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: '8px' }}>
                      {[{ v: 'NAM', l: 'Nam' }, { v: 'NU', l: 'Nữ' }].map(g => (
                        <label key={g.v} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                          <input type="radio" checked={form.gender === g.v} onChange={() => set('gender')(g.v)} style={{ accentColor: '#2563eb' }} />
                          {g.l}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '6px' }}>
                      Số điện thoại <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input value={form.phone} onChange={e => set('phone')(e.target.value)} placeholder="0912345678" style={errors.phone ? inputErr : inputBase} />
                    {errors.phone && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>{errors.phone}</p>}
                  </div>
                </div>
                <div style={{ ...row2, marginTop: '16px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '6px' }}>Phân loại</label>
                    <select value={form.classification} onChange={e => set('classification')(e.target.value)} style={{ ...inputBase }}>
                      {Object.entries(CLASSIFICATION_META).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Additional info */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <IdCard size={16} color="#059669" />
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: 0 }}>Thông tin bổ sung</h2>
            </div>
            {!editing ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <ViewField label="Số CCCD / CMND"  value={patient.nationalId}  icon={IdCard} />
                <ViewField label="Mã Thẻ BHYT"      value={patient.bhytCode}    icon={Shield} />
                <div style={{ gridColumn: '1/-1' }}>
                  <ViewField label="Địa chỉ"         value={patient.address}     icon={MapPin} />
                </div>
                <ViewField label="Nghề nghiệp"       value={patient.occupation}  icon={Briefcase} />
              </div>
            ) : (
              <div>
                <div style={row2}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '6px' }}>Số CCCD / CMND</label>
                    <input value={form.nationalId} onChange={e => set('nationalId')(e.target.value)} placeholder="Nhập số CCCD" style={inputBase} />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '6px' }}>Mã Thẻ BHYT</label>
                    <input value={form.bhytCode} onChange={e => set('bhytCode')(e.target.value)} placeholder="Nhập mã BHYT (nếu có)" style={inputBase} />
                  </div>
                </div>
                <div style={{ marginTop: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '6px' }}>Địa chỉ</label>
                  <input value={form.address} onChange={e => set('address')(e.target.value)} placeholder="Địa chỉ hiện tại" style={inputBase} />
                </div>
                <div style={{ marginTop: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '6px' }}>Nghề nghiệp</label>
                  <input value={form.occupation} onChange={e => set('occupation')(e.target.value)} placeholder="Nghề nghiệp" style={inputBase} />
                </div>
              </div>
            )}
          </div>

          {/* Emergency & note */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <AlertTriangle size={16} color="#f59e0b" />
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: 0 }}>Liên hệ khẩn cấp & Ghi chú</h2>
            </div>
            {!editing ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <ViewField label="Người liên hệ khẩn cấp"    value={patient.emergencyContactName}  icon={User} />
                <ViewField label="SĐT liên hệ khẩn cấp"      value={patient.emergencyContactPhone} icon={Phone} />
                <div style={{ gridColumn: '1/-1' }}>
                  <span style={labelStyle}>Ghi chú hành chính</span>
                  <span style={{ ...valueStyle, whiteSpace: 'pre-wrap', display: 'block' }}>{patient.adminNote || <span style={{ color: '#9ca3af' }}>—</span>}</span>
                </div>
              </div>
            ) : (
              <div>
                <div style={row2}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '6px' }}>Người liên hệ khẩn cấp</label>
                    <input value={form.emergencyContactName} onChange={e => set('emergencyContactName')(e.target.value)} placeholder="Họ tên người liên hệ" style={inputBase} />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '6px' }}>SĐT liên hệ khẩn cấp</label>
                    <input value={form.emergencyContactPhone} onChange={e => set('emergencyContactPhone')(e.target.value)} placeholder="Số điện thoại" style={inputBase} />
                  </div>
                </div>
                <div style={{ marginTop: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '6px' }}>Ghi chú hành chính</label>
                  <textarea value={form.adminNote} onChange={e => set('adminNote')(e.target.value)} rows={3} placeholder="Ghi chú cho bộ phận lễ tân..." style={{ ...inputBase, resize: 'vertical', lineHeight: 1.5 }} />
                  <p style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px' }}>Lưu ý: Chỉ ghi chú thông tin hành chính. KHÔNG nhập thông tin y tế, tiền sử bệnh, dị ứng vào đây.</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* History tab */}
      {activeTab === 'history' && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Stethoscope size={16} color="#7c3aed" />
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: 0 }}>Lịch sử khám</h2>
          </div>
          {patient.appointments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280', fontSize: '13px' }}>
              Chưa có lịch hẹn nào được ghi nhận
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {patient.appointments.map(apt => {
                const st = STATUS_META[apt.status] ?? { label: apt.status, color: '#6b7280', bg: '#f3f4f6' }
                return (
                  <div key={apt.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', border: '1px solid #f3f4f6', borderRadius: '10px', backgroundColor: '#fafafa' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Calendar size={17} color="#2563eb" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{new Date(apt.appointmentDate).toLocaleString('vi-VN')}</span>
                        <span style={{ padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 600, color: st.color, backgroundColor: st.bg }}>{st.label}</span>
                      </div>
                      <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#6b7280' }}>
                        Bác sĩ: {apt.doctor?.fullName ?? '—'} · Dịch vụ: {apt.service?.name ?? '—'}
                      </p>
                    </div>
                    <span style={{ fontSize: '12px', color: '#9ca3af', whiteSpace: 'nowrap' }}>{apt.code}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
