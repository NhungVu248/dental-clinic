import { useState, useEffect, useRef } from 'react'
import { X, RefreshCw, Eye, EyeOff, User, Upload, FileText, Image, Trash2 } from 'lucide-react'
import { authApi } from '../../api/auth.api'

const ROLE_INFO: Record<string, { label: string; color: string; bg: string }> = {
  ADMIN:        { label: 'Admin',   color: '#2563eb', bg: '#eff6ff' },
  DOCTOR:       { label: 'Bác sĩ', color: '#16a34a', bg: '#f0fdf4' },
  RECEPTIONIST: { label: 'Lễ tân', color: '#7c3aed', bg: '#f5f3ff' },
  ACCOUNTANT:   { label: 'Kế toán',color: '#d97706', bg: '#fffbeb' },
}

const generatePassword = () => {
  const u = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', l = 'abcdefghijklmnopqrstuvwxyz'
  const d = '0123456789', s = '!@#$%&*', a = u + l + d + s
  let pw = u[Math.floor(Math.random()*u.length)] + l[Math.floor(Math.random()*l.length)]
         + d[Math.floor(Math.random()*d.length)] + s[Math.floor(Math.random()*s.length)]
  for (let i = 4; i < 12; i++) pw += a[Math.floor(Math.random()*a.length)]
  return pw.split('').sort(() => Math.random()-0.5).join('')
}

interface Props { userId: number; onClose: () => void; onSuccess: () => void }

export default function UserDetailModal({ userId, onClose, onSuccess }: Props) {
  const [user, setUser]         = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState<'info' | 'security'>('info')

  // Tab 1 state
  const [info, setInfo]         = useState({ fullName: '', email: '', phone: '', address: '' })
  const [saving, setSaving]     = useState(false)
  const [infoMsg, setInfoMsg]   = useState<{ ok: boolean; text: string } | null>(null)

  // Role state
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [savingRoles, setSavingRoles]     = useState(false)
  const [roleMsg, setRoleMsg]             = useState<{ ok: boolean; text: string } | null>(null)

  // Tab 2 state
  const [newPw, setNewPw]       = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [resetting, setResetting] = useState(false)
  const [pwMsg, setPwMsg]       = useState<{ ok: boolean; text: string } | null>(null)

  // Certificate state
  const [certs, setCerts]             = useState<any[]>([])
  const [certDragging, setCertDragging] = useState(false)
  const [certUploading, setCertUploading] = useState(false)
  const [certMsg, setCertMsg]         = useState<{ ok: boolean; text: string } | null>(null)
  const certInputRef = useRef<HTMLInputElement>(null)

  const loadCerts = () =>
    authApi.getCertificates(userId).then(r => setCerts(r.data)).catch(() => {})

  useEffect(() => {
    authApi.getUserById(userId).then(r => {
      const u = r.data
      setUser(u)
      const profile = u.doctorProfile ?? u.receptionistProfile ?? u.accountantProfile ?? u.adminProfile ?? {}
      setInfo({ fullName: u.fullName, email: u.email, phone: profile.phone ?? '', address: profile.address ?? '' })
      setSelectedRoles(u.roles?.map((r: any) => r.role.name) ?? [])
    }).finally(() => setLoading(false))
    loadCerts()
  }, [userId])

  const roles: string[] = user?.roles?.map((r: any) => r.role.name) ?? []

  const STAFF_ROLES = [
    { key: 'ADMIN',        label: 'Admin',   color: '#2563eb', bg: '#eff6ff' },
    { key: 'RECEPTIONIST', label: 'Lễ tân',  color: '#7c3aed', bg: '#f5f3ff' },
    { key: 'DOCTOR',       label: 'Bác sĩ',  color: '#16a34a', bg: '#f0fdf4' },
    { key: 'ACCOUNTANT',   label: 'Kế toán', color: '#d97706', bg: '#fffbeb' },
  ]

  const toggleRole = (key: string) =>
    setSelectedRoles(prev =>
      prev.includes(key) ? prev.filter(r => r !== key) : [...prev, key]
    )

  const handleSaveRoles = async () => {
    if (selectedRoles.length === 0)
      return setRoleMsg({ ok: false, text: 'Phải có ít nhất một vai trò.' })
    setSavingRoles(true); setRoleMsg(null)
    try {
      await authApi.updateUserRoles(userId, selectedRoles)
      setRoleMsg({ ok: true, text: 'Cập nhật vai trò thành công.' })
      onSuccess()
    } catch (err: any) {
      setRoleMsg({ ok: false, text: err.response?.data?.message || 'Lỗi hệ thống' })
    } finally { setSavingRoles(false) }
  }

  const handleSaveInfo = async () => {
    setSaving(true); setInfoMsg(null)
    try {
      await authApi.updateProfile(userId, info)
      setInfoMsg({ ok: true, text: 'Cập nhật thông tin thành công.' })
      onSuccess()
    } catch (err: any) {
      setInfoMsg({ ok: false, text: err.response?.data?.message || 'Lỗi hệ thống' })
    } finally { setSaving(false) }
  }

  const handleResetPassword = async () => {
    if (!newPw) return setPwMsg({ ok: false, text: 'Vui lòng nhập mật khẩu mới.' })
    setResetting(true); setPwMsg(null)
    try {
      await authApi.adminResetPassword(userId, newPw)
      setPwMsg({ ok: true, text: 'Đặt lại mật khẩu thành công, mật khẩu mới đã gửi qua email.' })
      setNewPw('')
    } catch (err: any) {
      setPwMsg({ ok: false, text: err.response?.data?.message || 'Lỗi hệ thống' })
    } finally { setResetting(false) }
  }

  const CERT_ALLOWED = ['application/pdf', 'image/png', 'image/jpeg']
  const CERT_MAX_SIZE = 10 * 1024 * 1024

  const handleCertUpload = async (file: File) => {
    if (!CERT_ALLOWED.includes(file.type))
      return setCertMsg({ ok: false, text: `"${file.name}" không đúng định dạng (chỉ PDF, PNG, JPG).` })
    if (file.size > CERT_MAX_SIZE)
      return setCertMsg({ ok: false, text: `"${file.name}" vượt quá 10MB.` })
    setCertUploading(true); setCertMsg(null)
    try {
      await authApi.uploadCertificate(userId, file)
      setCertMsg({ ok: true, text: `Tải lên "${file.name}" thành công.` })
      loadCerts()
    } catch {
      setCertMsg({ ok: false, text: 'Tải lên thất bại, vui lòng thử lại.' })
    } finally { setCertUploading(false) }
  }

  const handleCertDrop = (e: React.DragEvent) => {
    e.preventDefault(); setCertDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleCertUpload(file)
  }

  const handleCertDelete = async (certId: number) => {
    try {
      await authApi.deleteCertificate(userId, certId)
      setCerts(prev => prev.filter(c => c.id !== certId))
    } catch {
      setCertMsg({ ok: false, text: 'Xóa thất bại, vui lòng thử lại.' })
    }
  }

  const certFileIcon = (mime: string) =>
    mime === 'application/pdf'
      ? <FileText size={16} color="#ef4444" />
      : <Image size={16} color="#3b82f6" />

  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: '8px',
    border: '1px solid #e5e7eb', fontSize: '13px', color: '#111827',
    outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '16px', width: '540px',
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '24px 24px 0' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0 }}>Thông tin người dùng</h2>
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              Xem chi tiết và cập nhật thông tin nhân sự (UC05/UC06).
            </p>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>Đang tải...</div>
        ) : (
          <>
            {/* Meta row */}
            <div style={{ display: 'flex', gap: '20px', padding: '16px 24px', flexWrap: 'wrap' }}>
              {[
                { label: 'ID', value: `U${String(user.id).padStart(2,'0')}` },
                { label: 'NGÀY TẠO', value: new Date(user.createdAt).toLocaleDateString('vi-VN') },
              ].map(m => (
                <div key={m.label}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em' }}>{m.label}</span>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginTop: '2px' }}>{m.value}</p>
                </div>
              ))}
              <div>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em' }}>VAI TRÒ</span>
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                  {roles.map(r => {
                    const cfg = ROLE_INFO[r] ?? { label: r, color: '#6b7280', bg: '#f3f4f6' }
                    return (
                      <span key={r} style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', color: cfg.color, backgroundColor: cfg.bg }}>
                        {cfg.label}
                      </span>
                    )
                  })}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em' }}>TRẠNG THÁI</span>
                <p style={{ marginTop: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: user.isActive ? '#16a34a' : '#d97706' }}>
                    {user.isActive ? 'Hoạt động' : 'Bị khóa'}
                  </span>
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', padding: '0 24px' }}>
              {[{ key: 'info', label: 'Thông tin cá nhân' }, { key: 'security', label: 'Bảo mật tài khoản' }].map(t => (
                <button key={t.key} onClick={() => setTab(t.key as any)} style={{
                  padding: '10px 16px', fontSize: '13px', fontWeight: tab === t.key ? 600 : 400,
                  color: tab === t.key ? '#2563eb' : '#6b7280', border: 'none',
                  borderBottom: tab === t.key ? '2px solid #2563eb' : '2px solid transparent',
                  background: 'none', cursor: 'pointer', marginBottom: '-1px',
                }}>{t.label}</button>
              ))}
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {tab === 'info' ? (
                <>
                  {/* Avatar placeholder */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '72px', height: '72px', borderRadius: '50%', backgroundColor: '#eff6ff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '2px dashed #bfdbfe',
                    }}>
                      <User size={28} color="#93c5fd" />
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>Avatar</p>
                      <p style={{ fontSize: '12px', color: '#9ca3af' }}>Chức năng upload ảnh sẽ bổ sung sau.</p>
                    </div>
                  </div>

                  {/* Họ tên + Email */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={labelStyle}>Họ và tên <span style={{ color: '#ef4444' }}>*</span></label>
                      <input style={inputStyle} value={info.fullName}
                        onChange={e => setInfo(f => ({ ...f, fullName: e.target.value }))} />
                    </div>
                    <div>
                      <label style={labelStyle}>Email <span style={{ color: '#ef4444' }}>*</span></label>
                      <input style={inputStyle} type="email" value={info.email}
                        onChange={e => setInfo(f => ({ ...f, email: e.target.value }))} />
                    </div>
                  </div>

                  {/* Số điện thoại */}
                  <div>
                    <label style={labelStyle}>Số điện thoại</label>
                    <input style={inputStyle} placeholder="0901 234 567" value={info.phone}
                      onChange={e => setInfo(f => ({ ...f, phone: e.target.value }))} />
                  </div>

                  {/* Địa chỉ */}
                  <div>
                    <label style={labelStyle}>Địa chỉ</label>
                    <input style={inputStyle} placeholder="Quận 1, TP.HCM" value={info.address}
                      onChange={e => setInfo(f => ({ ...f, address: e.target.value }))} />
                  </div>

                  {/* Vai trò */}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                    <label style={labelStyle}>Vai trò</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                      {STAFF_ROLES.map(r => {
                        const checked = selectedRoles.includes(r.key)
                        return (
                          <label key={r.key} style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '9px 12px', borderRadius: '8px', cursor: 'pointer',
                            border: `1px solid ${checked ? r.color : '#e5e7eb'}`,
                            backgroundColor: checked ? r.bg : 'white',
                          }}>
                            <input type="checkbox" checked={checked} onChange={() => { toggleRole(r.key); setRoleMsg(null) }}
                              style={{ width: '14px', height: '14px', accentColor: r.color }} />
                            <span style={{ fontSize: '13px', fontWeight: checked ? 600 : 400, color: checked ? r.color : '#374151' }}>
                              {r.label}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                    {roleMsg && (
                      <div style={{
                        padding: '8px 12px', borderRadius: '8px', fontSize: '12px', marginBottom: '8px',
                        backgroundColor: roleMsg.ok ? '#f0fdf4' : '#fef2f2',
                        border: `1px solid ${roleMsg.ok ? '#86efac' : '#fca5a5'}`,
                        color: roleMsg.ok ? '#16a34a' : '#dc2626',
                      }}>{roleMsg.text}</div>
                    )}
                    <button onClick={handleSaveRoles} disabled={savingRoles} style={{
                      padding: '7px 14px', borderRadius: '8px', border: '1px solid #2563eb',
                      backgroundColor: savingRoles ? '#eff6ff' : 'white', color: '#2563eb',
                      fontSize: '12px', fontWeight: 600, cursor: savingRoles ? 'not-allowed' : 'pointer',
                    }}>
                      {savingRoles ? 'Đang lưu...' : 'Lưu vai trò'}
                    </button>
                  </div>

                  {/* Bằng cấp & Chứng chỉ */}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                    <label style={labelStyle}>
                      Bằng cấp &amp; Chứng chỉ
                      <span style={{ fontSize: '11px', fontWeight: 400, color: '#9ca3af', marginLeft: '6px' }}>
                        PDF · PNG · JPG · Tối đa 10MB/file
                      </span>
                    </label>

                    {/* Drop zone */}
                    <div
                      onDragOver={e => { e.preventDefault(); setCertDragging(true) }}
                      onDragLeave={() => setCertDragging(false)}
                      onDrop={handleCertDrop}
                      onClick={() => certInputRef.current?.click()}
                      style={{
                        border: `2px dashed ${certDragging ? '#2563eb' : '#d1d5db'}`,
                        borderRadius: '10px', padding: '18px',
                        textAlign: 'center', cursor: certUploading ? 'not-allowed' : 'pointer',
                        backgroundColor: certDragging ? '#eff6ff' : '#f9fafb',
                        transition: 'all 0.15s',
                      }}
                    >
                      <Upload size={20} color={certDragging ? '#2563eb' : '#9ca3af'} style={{ marginBottom: '4px' }} />
                      <p style={{ fontSize: '13px', color: certDragging ? '#2563eb' : '#6b7280', fontWeight: 500 }}>
                        {certUploading ? 'Đang tải lên...' : 'Nhấn để chọn file hoặc kéo thả vào đây'}
                      </p>
                      <input
                        ref={certInputRef}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        style={{ display: 'none' }}
                        disabled={certUploading}
                        onChange={e => {
                          const f = e.target.files?.[0]
                          if (f) handleCertUpload(f)
                          e.target.value = ''
                        }}
                      />
                    </div>

                    {certMsg && (
                      <div style={{
                        marginTop: '8px', padding: '8px 12px', borderRadius: '8px', fontSize: '12px',
                        backgroundColor: certMsg.ok ? '#f0fdf4' : '#fef2f2',
                        border: `1px solid ${certMsg.ok ? '#86efac' : '#fca5a5'}`,
                        color: certMsg.ok ? '#16a34a' : '#dc2626',
                      }}>{certMsg.text}</div>
                    )}

                    {/* Danh sách file đã upload */}
                    {certs.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                        {certs.map(c => (
                          <div key={c.id} style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '8px 12px', borderRadius: '8px',
                            backgroundColor: '#f8fafc', border: '1px solid #e5e7eb',
                          }}>
                            <div style={{
                              width: '32px', height: '32px', borderRadius: '6px', flexShrink: 0,
                              backgroundColor: c.mimetype === 'application/pdf' ? '#fef2f2' : '#eff6ff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              {certFileIcon(c.mimetype)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <a
                                href={`http://localhost:5000/uploads/certificates/${userId}/${c.filename}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: '12px', fontWeight: 600, color: '#111827', textDecoration: 'none',
                                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
                                title={c.originalName}
                              >
                                {c.originalName}
                              </a>
                              <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>
                                {formatSize(c.size)} · {new Date(c.uploadedAt).toLocaleDateString('vi-VN')}
                              </p>
                            </div>
                            <button
                              onClick={() => handleCertDelete(c.id)}
                              title="Xóa chứng chỉ"
                              style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px', flexShrink: 0 }}
                              onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                              onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {certs.length === 0 && !certUploading && (
                      <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', marginTop: '8px' }}>
                        Chưa có bằng cấp/chứng chỉ nào được tải lên.
                      </p>
                    )}
                  </div>

                  {infoMsg && (
                    <div style={{
                      padding: '10px 12px', borderRadius: '8px', fontSize: '13px',
                      backgroundColor: infoMsg.ok ? '#f0fdf4' : '#fef2f2',
                      border: `1px solid ${infoMsg.ok ? '#86efac' : '#fca5a5'}`,
                      color: infoMsg.ok ? '#16a34a' : '#dc2626',
                    }}>{infoMsg.text}</div>
                  )}
                </>
              ) : (
                <>
                  {/* Security tab */}
                  <div style={{
                    backgroundColor: '#eff6ff', border: '1px solid #bfdbfe',
                    borderRadius: '10px', padding: '16px',
                  }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      🔑 Đặt lại mật khẩu cho nhân sự (UC06)
                    </p>
                    <p style={{ fontSize: '12px', color: '#3b82f6', marginTop: '4px' }}>
                      Mật khẩu mới sẽ được gửi qua email. Tất cả phiên làm việc của tài khoản này sẽ bị hủy ngay lập tức.
                    </p>
                  </div>

                  <div>
                    <label style={labelStyle}>Tên đăng nhập</label>
                    <input style={{ ...inputStyle, backgroundColor: '#f9fafb', color: '#6b7280' }}
                      value={user.username} disabled />
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>Tên đăng nhập không thể thay đổi.</p>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <label style={{ ...labelStyle, marginBottom: 0 }}>Mật khẩu mới <span style={{ color: '#ef4444' }}>*</span></label>
                      <button onClick={() => setNewPw(generatePassword())}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#2563eb', border: 'none', background: 'none', cursor: 'pointer' }}>
                        <RefreshCw size={12} /> Tạo tự động
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input style={{ ...inputStyle, paddingRight: '36px' }}
                        type={showPw ? 'text' : 'password'} placeholder="Nhập mật khẩu mới..."
                        value={newPw} onChange={e => setNewPw(e.target.value)} />
                      <button onClick={() => setShowPw(!showPw)} style={{
                        position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                        border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af',
                      }}>
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {pwMsg && (
                    <div style={{
                      padding: '10px 12px', borderRadius: '8px', fontSize: '13px',
                      backgroundColor: pwMsg.ok ? '#f0fdf4' : '#fef2f2',
                      border: `1px solid ${pwMsg.ok ? '#86efac' : '#fca5a5'}`,
                      color: pwMsg.ok ? '#16a34a' : '#dc2626',
                    }}>{pwMsg.text}</div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', padding: '0 24px 24px' }}>
              <button onClick={onClose} style={{
                padding: '9px 16px', borderRadius: '8px', border: '1px solid #e5e7eb',
                background: 'white', fontSize: '13px', cursor: 'pointer', color: '#374151',
              }}>Đóng</button>
              {tab === 'info' ? (
                <button onClick={handleSaveInfo} disabled={saving} style={{
                  padding: '9px 18px', borderRadius: '8px', border: 'none',
                  backgroundColor: saving ? '#93c5fd' : '#2563eb', color: 'white',
                  fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
                }}>
                  {saving ? 'Đang lưu...' : 'Lưu thông tin'}
                </button>
              ) : (
                <button onClick={handleResetPassword} disabled={resetting} style={{
                  padding: '9px 18px', borderRadius: '8px', border: 'none',
                  backgroundColor: resetting ? '#93c5fd' : '#2563eb', color: 'white',
                  fontSize: '13px', fontWeight: 600, cursor: resetting ? 'not-allowed' : 'pointer',
                }}>
                  {resetting ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
