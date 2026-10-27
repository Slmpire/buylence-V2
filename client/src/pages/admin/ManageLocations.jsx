import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Crosshair, Pencil, Eye, EyeOff, Trash2, MapPin } from 'lucide-react'
import api from '../../lib/axios'
import { toast } from '../../store/toastStore'
import { Spinner, PageLoader } from '../../components/common/GlobalLoader'

const TYPES = ['HALL', 'HOSTEL', 'FACULTY', 'GATE', 'LANDMARK', 'OFF_CAMPUS', 'OTHER']
const EMPTY = { name: '', area: 'OAU Campus', type: 'HALL', latitude: '', longitude: '' }

export default function ManageLocations() {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)

  async function load() {
    try {
      const res = await api.get('/locations/admin/all')
      setLocations(res.data.locations || [])
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not load locations.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function setField(k, v) {
    setForm(p => ({ ...p, [k]: v }))
  }

  function startEdit(loc) {
    setEditingId(loc.id)
    setForm({
      name: loc.name,
      area: loc.area,
      type: loc.type,
      latitude: loc.latitude ?? '',
      longitude: loc.longitude ?? '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(EMPTY)
  }

  function useMyLocation() {
    if (!navigator.geolocation) return toast.error('Your browser does not support location sharing.')
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(p => ({
          ...p,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }))
        setGpsLoading(false)
        toast.info('Coordinates filled in from your current position.')
      },
      () => {
        setGpsLoading(false)
        toast.error('Could not get your location. Enter the coordinates by hand.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  async function save(e) {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Please enter a location name.')

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        area: form.area.trim() || 'OAU Campus',
        type: form.type,
        latitude: form.latitude === '' ? null : Number(form.latitude),
        longitude: form.longitude === '' ? null : Number(form.longitude),
      }
      if (editingId) {
        await api.patch(`/locations/${editingId}`, payload)
        toast.success('Location updated.')
      } else {
        await api.post('/locations', payload)
        toast.success('Location added.')
      }
      cancelEdit()
      await load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not save the location.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(loc) {
    try {
      await api.patch(`/locations/${loc.id}`, { isActive: !loc.isActive })
      setLocations(prev => prev.map(l => (l.id === loc.id ? { ...l, isActive: !l.isActive } : l)))
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not update the location.')
    }
  }

  async function remove(loc) {
    if (!window.confirm(`Delete "${loc.name}"? Existing orders and stores keep the name.`)) return
    try {
      await api.delete(`/locations/${loc.id}`)
      setLocations(prev => prev.filter(l => l.id !== loc.id))
      toast.success('Location removed.')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not delete the location.')
    }
  }

  const inp = {
    width: '100%', padding: '10px 12px', border: '1px solid #E4DDD3',
    borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box',
    backgroundColor: 'white', fontFamily: 'Inter, sans-serif',
  }
  const lbl = {
    fontSize: 10, fontWeight: 800, letterSpacing: '0.1em',
    color: '#39332E', display: 'block', marginBottom: 5,
  }

  if (loading) return <PageLoader label="Loading locations…" minHeight="100vh" />

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7F4EF', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 16px 80px' }}>

        <Link to="/admin/dashboard" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 12, fontWeight: 700, color: '#7F766B',
          textDecoration: 'none', marginBottom: 16,
        }}>
          <ArrowLeft size={14} /> BACK TO ADMIN
        </Link>

        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-1px', margin: '0 0 4px' }}>
          Delivery locations
        </h1>
        <p style={{ fontSize: 13, color: '#7F766B', margin: '0 0 22px', lineHeight: 1.6 }}>
          These appear as suggestions for buyers and vendors. People can still type their own address.
          Add coordinates so distances can be worked out between buyers and vendors.
        </p>

        {/* Add / edit form */}
        <form onSubmit={save} style={{
          backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.07)',
          borderRadius: 14, padding: 18, marginBottom: 22,
        }}>
          <h2 style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', margin: '0 0 14px' }}>
            {editingId ? 'EDIT LOCATION' : 'ADD A LOCATION'}
          </h2>

          <div style={{
            display: 'grid', gap: 12,
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          }}>
            <div>
              <label style={lbl}>NAME</label>
              <input style={inp} value={form.name} onChange={e => setField('name', e.target.value)}
                placeholder="e.g. Awo Hall" />
            </div>
            <div>
              <label style={lbl}>AREA</label>
              <input style={inp} value={form.area} onChange={e => setField('area', e.target.value)}
                placeholder="e.g. OAU Campus" />
            </div>
            <div>
              <label style={lbl}>TYPE</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={form.type}
                onChange={e => setField('type', e.target.value)}>
                {TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>LATITUDE</label>
              <input style={inp} value={form.latitude} onChange={e => setField('latitude', e.target.value)}
                placeholder="optional" inputMode="decimal" />
            </div>
            <div>
              <label style={lbl}>LONGITUDE</label>
              <input style={inp} value={form.longitude} onChange={e => setField('longitude', e.target.value)}
                placeholder="optional" inputMode="decimal" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <button type="submit" disabled={saving} style={{
              padding: '11px 20px', backgroundColor: '#1D1D1D', color: 'white',
              border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13,
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {saving && <Spinner size={14} color="white" />}
              {editingId ? 'Save changes' : 'Add location'}
            </button>

            <button type="button" onClick={useMyLocation} disabled={gpsLoading} style={{
              padding: '11px 16px', backgroundColor: 'white', color: '#7F766B',
              border: '1px solid #E4DDD3', borderRadius: 8, fontWeight: 700, fontSize: 12,
              cursor: gpsLoading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Crosshair size={14} /> {gpsLoading ? 'Getting location…' : 'Use my current location'}
            </button>

            {editingId && (
              <button type="button" onClick={cancelEdit} style={{
                padding: '11px 16px', background: 'none', color: '#7F766B',
                border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer',
              }}>
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* List */}
        <div style={{
          backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.07)',
          borderRadius: 14, overflow: 'hidden',
        }}>
          {locations.length === 0 ? (
            <p style={{ padding: 24, fontSize: 13, color: '#9C9488', textAlign: 'center', margin: 0 }}>
              No locations yet. Add one above, or run the seed script.
            </p>
          ) : (
            locations.map((loc, i) => (
              <div key={loc.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 18px', flexWrap: 'wrap',
                borderTop: i === 0 ? 'none' : '1px solid rgba(0,0,0,0.06)',
                opacity: loc.isActive ? 1 : 0.5,
              }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <p style={{ fontSize: 14, fontWeight: 800, margin: '0 0 2px' }}>{loc.name}</p>
                  <p style={{ fontSize: 11, color: '#9C9488', margin: 0 }}>
                    {loc.area} · {loc.type.replace('_', ' ')}
                  </p>
                </div>

                <div style={{ fontSize: 11, minWidth: 150 }}>
                  {loc.latitude !== null && loc.longitude !== null ? (
                    <span style={{ color: '#166534', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={12} /> {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                    </span>
                  ) : (
                    <span style={{ color: '#B45309' }}>No coordinates yet</span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => startEdit(loc)} aria-label={`Edit ${loc.name}`}
                    style={iconBtn}><Pencil size={14} /></button>
                  <button onClick={() => toggleActive(loc)}
                    aria-label={loc.isActive ? `Hide ${loc.name}` : `Show ${loc.name}`}
                    style={iconBtn}>
                    {loc.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button onClick={() => remove(loc)} aria-label={`Delete ${loc.name}`}
                    style={{ ...iconBtn, color: '#DC2626' }}><Trash2 size={14} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

const iconBtn = {
  width: 32, height: 32, borderRadius: 8,
  border: '1px solid #E4DDD3', backgroundColor: 'white',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', color: '#7F766B', padding: 0,
}