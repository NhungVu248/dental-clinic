import { useState, useEffect, useRef } from 'react'
import { useLocation, NavLink } from 'react-router-dom'
import { Layers, ListChecks, Search, Plus, Eye, Pencil, Trash2, X, UserRound, Loader2, AlertTriangle } from 'lucide-react'
import { serviceApi } from '../../api/services.api'
import type { ServiceGroup, Doctor, GroupService } from '../../api/services.api'

// ─── Shared styles ───────────────────────────────────────────

const btn = {
  base: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '9px 16px', borderRadius: '8px', fontSize: '13px',
    fontWeight: 600, cursor: 'pointer', border: 'none',
  } as React.CSSProperties,
  primary: { backgroundColor: '#2563eb', color: 'white' } as React.CSSProperties,
  ghost: { backgroundColor: 'transparent', color: '#6b7280', border: '1px solid #e5e7eb' } as React.CSSProperties,
  danger: { backgroundColor: '#dc2626', color: 'white' } as React.CSSProperties,
}

// ─── Toast ───────────────────────────────────────────────────

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
      backgroundColor: type === 'success' ? '#22c55e' : '#ef4444',
      color: 'white', padding: '12px 20px', borderRadius: '10px',
      fontSize: '14px', fontWeight: 500, boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      display: 'flex', alignItems: 'center', gap: '10px',
    }}>
      {type === 'success' ? '✓' : '✕'} {msg}
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0 }}>
        <X size={14} />
      </button>
    </div>
  )
}

// ─── Add/Edit Modal ──────────────────────────────────────────

interface GroupFormProps {
  mode: 'add' | 'edit'
  initial?: ServiceGroup
  doctors: Doctor[]
  onSave: (data: { name: string; description: string; doctorIds: number[] }) => Promise<void>
  onClose: () => void
}

function GroupFormModal({ mode, initial, doctors, onSave, onClose }: GroupFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [selectedDoctors, setSelectedDoctors] = useState<number[]>(initial?.doctors.map(d => d.id) ?? [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleDoctor = (id: number) =>
    setSelectedDoctors(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Tên nhóm không được để trống'); return }
    if (selectedDoctors.length === 0) { setError('Phải chọn ít nhất một bác sĩ đảm nhiệm'); return }
    setLoading(true)
    setError('')
    try {
      await onSave({ name: name.trim(), description: description.trim(), doctorIds: selectedDoctors })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi hệ thống')
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px',
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '480px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{ padding: '24px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#111827', margin: 0 }}>
              {mode === 'add' ? 'Thêm nhóm dịch vụ mới' : 'Chỉnh sửa nhóm dịch vụ'}
            </h3>
            <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
              Mỗi nhóm bắt buộc phải có ít nhất một bác sĩ đảm nhiệm (UC08).
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {error && (
              <div style={{
                backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px',
                padding: '10px 14px', color: '#dc2626', fontSize: '13px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <AlertTriangle size={15} /> {error}
              </div>
            )}

            {/* Tên nhóm */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                Tên nhóm <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ví dụ: Nha khoa tổng quát"
                autoFocus
                style={{
                  width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb',
                  borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#3b82f6')}
                onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
              />
            </div>

            {/* Mô tả */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                Mô tả
              </label>
              <input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Mô tả ngắn về nhóm..."
                style={{
                  width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb',
                  borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#3b82f6')}
                onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
              />
            </div>

            {/* Bác sĩ đảm nhiệm */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                Bác sĩ đảm nhiệm <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{
                border: '1.5px solid #e5e7eb', borderRadius: '8px',
                maxHeight: '200px', overflowY: 'auto',
              }}>
                {doctors.length === 0 ? (
                  <p style={{ padding: '16px', fontSize: '13px', color: '#9ca3af', textAlign: 'center' }}>
                    Chưa có bác sĩ nào trong hệ thống
                  </p>
                ) : (
                  doctors.map(doc => (
                    <label key={doc.id} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 14px', cursor: 'pointer',
                      borderBottom: '1px solid #f3f4f6',
                      backgroundColor: selectedDoctors.includes(doc.id) ? '#eff6ff' : 'transparent',
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedDoctors.includes(doc.id)}
                        onChange={() => toggleDoctor(doc.id)}
                        style={{ width: '15px', height: '15px', accentColor: '#2563eb', flexShrink: 0 }}
                      />
                      <UserRound size={15} color="#6b7280" />
                      <span style={{ fontSize: '13px', color: '#374151' }}>BS. {doc.fullName}</span>
                    </label>
                  ))
                )}
              </div>
              {selectedDoctors.length > 0 && (
                <p style={{ fontSize: '12px', color: '#2563eb', marginTop: '6px' }}>
                  Đã chọn {selectedDoctors.length} bác sĩ
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '16px 24px', borderTop: '1px solid #f3f4f6',
            display: 'flex', justifyContent: 'flex-end', gap: '10px',
          }}>
            <button type="button" onClick={onClose} style={{ ...btn.base, ...btn.ghost }}>Hủy</button>
            <button type="submit" disabled={loading} style={{ ...btn.base, ...btn.primary, opacity: loading ? 0.7 : 1 }}>
              {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
              {mode === 'add' ? 'Thêm nhóm' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── View Services Modal ─────────────────────────────────────

function ViewServicesModal({ groupId, groupName, onClose }: { groupId: number; groupName: string; onClose: () => void }) {
  const [services, setServices] = useState<GroupService[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    serviceApi.getGroupServices(groupId)
      .then(res => setServices(res.data.services))
      .catch(() => setServices([]))
      .finally(() => setLoading(false))
  }, [groupId])

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px',
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '480px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f3f4f6' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0 }}>
              Dịch vụ trong nhóm: {groupName}
            </h3>
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '3px' }}>
              Danh sách dịch vụ đang hoạt động thuộc nhóm này.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '8px 0', maxHeight: '360px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : services.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '32px', fontSize: '14px', color: '#9ca3af' }}>
              Nhóm này chưa có dịch vụ nào.
            </p>
          ) : (
            services.map(sv => (
              <div key={sv.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 24px', borderBottom: '1px solid #f9fafb',
              }}>
                <span style={{
                  fontSize: '11px', fontWeight: 700, color: '#9ca3af',
                  backgroundColor: '#f3f4f6', padding: '2px 7px', borderRadius: '4px',
                  letterSpacing: '0.04em', flexShrink: 0,
                }}>
                  {sv.code}
                </span>
                <span style={{ flex: 1, fontSize: '14px', color: '#111827', fontWeight: 500 }}>{sv.name}</span>
                <span style={{
                  fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '99px',
                  backgroundColor: sv.isActive ? '#dcfce7' : '#f3f4f6',
                  color: sv.isActive ? '#16a34a' : '#6b7280',
                }}>
                  {sv.isActive ? 'Hoạt động' : 'Chưa hoạt động'}
                </span>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ ...btn.base, ...btn.ghost }}>Đóng</button>
        </div>
      </div>
    </div>
  )
}

// ─── Delete Confirm Modal ─────────────────────────────────────

function DeleteModal({ groupName, loading, onConfirm, onClose }: {
  groupName: string; loading: boolean; onConfirm: () => void; onClose: () => void
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px',
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '380px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)', padding: '28px 24px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#fef2f2',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Trash2 size={18} color="#dc2626" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0 }}>Xác nhận xóa nhóm</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
            <X size={16} />
          </button>
        </div>
        <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6, marginBottom: '6px' }}>
          Bạn sắp xóa nhóm <strong style={{ color: '#111827' }}>{groupName}</strong>.
          Hành động này không thể hoàn tác. Nhóm sẽ bị xóa vĩnh viễn.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
          <button onClick={onClose} style={{ ...btn.base, ...btn.ghost }}>Hủy</button>
          <button onClick={onConfirm} disabled={loading} style={{ ...btn.base, ...btn.danger, opacity: loading ? 0.7 : 1 }}>
            {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
            Xác nhận xóa
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Groups Tab ──────────────────────────────────────────────

function ServiceGroupsTab() {
  const [groups, setGroups] = useState<ServiceGroup[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ServiceGroup | null>(null)
  const [viewTarget, setViewTarget] = useState<ServiceGroup | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ServiceGroup | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => setToast({ msg, type })

  const loadGroups = async (q = search) => {
    setLoading(true)
    try {
      const res = await serviceApi.getGroups(q || undefined)
      setGroups(res.data)
    } catch {
      showToast('Không thể tải danh sách nhóm dịch vụ', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGroups()
    serviceApi.getDoctors().then(res => setDoctors(res.data)).catch(() => {})
  }, [])

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { setSearch(searchInput); loadGroups(searchInput) }
  }

  const handleAdd = async (data: { name: string; description: string; doctorIds: number[] }) => {
    await serviceApi.createGroup(data)
    setAddOpen(false)
    showToast('Thêm nhóm dịch vụ thành công')
    loadGroups()
  }

  const handleEdit = async (data: { name: string; description: string; doctorIds: number[] }) => {
    if (!editTarget) return
    await serviceApi.updateGroup(editTarget.id, data)
    setEditTarget(null)
    showToast('Cập nhật nhóm dịch vụ thành công')
    loadGroups()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await serviceApi.deleteGroup(deleteTarget.id)
      setDeleteTarget(null)
      showToast('Xóa nhóm dịch vụ thành công')
      loadGroups()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể xóa nhóm', 'error')
      setDeleteTarget(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={15} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Tìm kiếm nhóm dịch vụ..."
            style={{
              width: '100%', padding: '9px 12px 9px 36px', border: '1.5px solid #e5e7eb',
              borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = '#3b82f6')}
            onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
          />
        </div>
        <button onClick={() => setAddOpen(true)} style={{ ...btn.base, ...btn.primary }}>
          <Plus size={15} /> Thêm nhóm
        </button>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 3fr 120px 120px',
          padding: '12px 20px', backgroundColor: '#f9fafb',
          borderBottom: '1px solid #e5e7eb',
          fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em',
        }}>
          <span>Tên nhóm</span>
          <span>Bác sĩ đảm nhiệm</span>
          <span>Số dịch vụ</span>
          <span style={{ textAlign: 'right' }}>Thao tác</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : groups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af', fontSize: '14px' }}>
            {search ? 'Không tìm thấy nhóm nào phù hợp.' : 'Chưa có nhóm dịch vụ nào.'}
          </div>
        ) : (
          groups.map((group, idx) => (
            <div key={group.id} style={{
              display: 'grid', gridTemplateColumns: '2fr 3fr 120px 120px',
              padding: '16px 20px', alignItems: 'center',
              borderBottom: idx < groups.length - 1 ? '1px solid #f3f4f6' : 'none',
            }}>
              {/* Name */}
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: 0 }}>{group.name}</p>
                {group.description && (
                  <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{group.description}</p>
                )}
              </div>

              {/* Doctors */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {group.doctors.map(d => (
                  <span key={d.id} style={{
                    fontSize: '12px', padding: '3px 10px', borderRadius: '99px',
                    backgroundColor: '#eff6ff', color: '#2563eb', fontWeight: 500,
                  }}>
                    BS. {d.fullName}
                  </span>
                ))}
              </div>

              {/* Count */}
              <div>
                <span style={{ fontSize: '14px', color: '#374151' }}>
                  {group.serviceCount} <span style={{ color: '#9ca3af', fontSize: '12px' }}>dịch vụ</span>
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                <ActionBtn icon={<Eye size={15} />} title="Xem dịch vụ" onClick={() => setViewTarget(group)} />
                <ActionBtn icon={<Pencil size={15} />} title="Chỉnh sửa" color="#2563eb" onClick={() => setEditTarget(group)} />
                <ActionBtn icon={<Trash2 size={15} />} title="Xóa" color="#dc2626" onClick={() => setDeleteTarget(group)} />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      {addOpen && (
        <GroupFormModal mode="add" doctors={doctors} onSave={handleAdd} onClose={() => setAddOpen(false)} />
      )}
      {editTarget && (
        <GroupFormModal mode="edit" initial={editTarget} doctors={doctors} onSave={handleEdit} onClose={() => setEditTarget(null)} />
      )}
      {viewTarget && (
        <ViewServicesModal groupId={viewTarget.id} groupName={viewTarget.name} onClose={() => setViewTarget(null)} />
      )}
      {deleteTarget && (
        <DeleteModal groupName={deleteTarget.name} loading={deleteLoading} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

function ActionBtn({ icon, title, color = '#6b7280', onClick }: {
  icon: React.ReactNode; title: string; color?: string; onClick: () => void
}) {
  const [hover, setHover] = useState(false)
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '32px', height: '32px', border: '1px solid #e5e7eb', borderRadius: '7px',
        background: hover ? '#f9fafb' : 'white', cursor: 'pointer', color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}
    >
      {icon}
    </button>
  )
}

// ─── Services Tab (UC09 placeholder) ────────────────────────

function ServicesListTab() {
  return (
    <div style={{
      textAlign: 'center', padding: '80px 24px',
      backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb',
    }}>
      <div style={{
        width: '64px', height: '64px', backgroundColor: '#eff6ff', borderRadius: '16px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
      }}>
        <ListChecks size={30} color="#2563eb" />
      </div>
      <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
        Các dịch vụ nha khoa
      </h3>
      <p style={{ fontSize: '14px', color: '#6b7280', maxWidth: '400px', margin: '0 auto', lineHeight: 1.7 }}>
        Chức năng quản lý chi tiết các dịch vụ (UC09) đang được phát triển. Sẽ ra mắt trong phiên bản tiếp theo.
      </p>
      <span style={{
        display: 'inline-block', marginTop: '20px', padding: '6px 16px',
        backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '99px',
        fontSize: '12px', fontWeight: 600,
      }}>
        Đang phát triển — UC09
      </span>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────

export default function ServicesPage() {
  const location = useLocation()
  const isGroupsTab = location.pathname === '/services/groups'

  return (
    <div>
      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '4px', marginBottom: '20px',
        borderBottom: '1px solid #e5e7eb', paddingBottom: '0',
      }}>
        <TabLink to="/services/groups" active={isGroupsTab} icon={<Layers size={15} />} label="Nhóm dịch vụ" />
        <TabLink to="/services" active={!isGroupsTab} icon={<ListChecks size={15} />} label="Các dịch vụ" />
      </div>

      {isGroupsTab ? <ServiceGroupsTab /> : <ServicesListTab />}
    </div>
  )
}

function TabLink({ to, active, icon, label }: { to: string; active: boolean; icon: React.ReactNode; label: string }) {
  return (
    <NavLink to={to} style={{
      display: 'inline-flex', alignItems: 'center', gap: '7px',
      padding: '10px 16px', fontSize: '13px', fontWeight: active ? 700 : 500,
      color: active ? '#2563eb' : '#6b7280', textDecoration: 'none',
      borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
      marginBottom: '-1px', transition: 'color 0.15s',
    }}>
      {icon} {label}
    </NavLink>
  )
}
