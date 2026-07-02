import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useIsMobile } from '../../hooks/useWindowSize'
import { ChevronDown, ChevronUp } from 'lucide-react'

const COLS = [
  {
    title: 'MARKETPLACE',
    links: [
      { label: 'All categories', to: '/marketplace' },
      { label: 'New arrivals', to: '/marketplace?sort=new' },
      { label: 'Flash sales', to: '/marketplace?filter=flash' },
      { label: 'Bulk orders', to: '/marketplace?filter=bulk' },
    ],
  },
  {
    title: 'HALLS',
    links: [
      { label: 'Awo Hall', to: '/marketplace?hall=awo' },
      { label: 'Moremi Hall', to: '/marketplace?hall=moremi' },
      { label: 'Fajuyi Hall', to: '/marketplace?hall=fajuyi' },
      { label: 'Mozambique Hall', to: '/marketplace?hall=mozambique' },
    ],
  },
  {
    title: 'SUPPORT',
    links: [
      { label: 'Help center', to: '/help' },
      { label: 'Become a seller', to: '/vendor-onboarding' },
      { label: 'Terms & privacy', to: '/terms' },
    ],
  },
]

function AccordionCol({ col }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <button
        onClick={() => setOpen(s => !s)}
        style={{
          width: '100%', padding: '16px 0',
          background: 'none', border: 'none',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', cursor: 'pointer',
          color: 'white',
        }}
      >
        <span style={{
          fontSize: 11, fontWeight: 700,
          letterSpacing: '0.12em', color: 'var(--amber)',
        }}>
          {col.title}
        </span>
        {open
          ? <ChevronUp size={16} color="rgba(255,255,255,0.4)" />
          : <ChevronDown size={16} color="rgba(255,255,255,0.4)" />
        }
      </button>
      {open && (
        <div style={{ paddingBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {col.links.map(link => (
            <Link
              key={link.label}
              to={link.to}
              style={{
                fontSize: 13, color: '#9A9890',
                textDecoration: 'none', letterSpacing: '0.04em',
              }}
            >
              {link.label.toUpperCase()}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Footer() {
  const isMobile = useIsMobile()
  const [email, setEmail] = useState('')

  return (
    <footer style={{ backgroundColor: 'var(--dark-section)', color: 'white' }}>

      {/* Flash deal signup banner */}
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: isMobile ? '32px 20px' : '64px 24px',
      }}>
        <div style={{
          backgroundColor: '#242420',
          borderRadius: isMobile ? 16 : 20,
          padding: isMobile ? '28px 20px' : '48px 56px',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          gap: isMobile ? 24 : 40,
        }}>
          <div>
            <h2 style={{
              fontSize: isMobile ? 26 : 36,
              fontWeight: 900, lineHeight: 1.1,
              marginBottom: 10, letterSpacing: '-0.5px',
            }}>
              DON'T MISS<br />THE FLASH DEALS
            </h2>
            <p style={{
              color: '#9A9890', fontSize: 13,
              maxWidth: 380, lineHeight: 1.6, margin: 0,
            }}>
              Join 5,000+ OAU students getting notified about heavy discounts every Saturday morning.
            </p>
          </div>

          <div style={{
            display: 'flex', flexDirection: 'column',
            gap: 8,
            width: isMobile ? '100%' : 'auto',
            minWidth: isMobile ? 'auto' : 320,
          }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="workrate@gmail.com"
                style={{
                  flex: 1, padding: '12px 16px',
                  backgroundColor: '#2E2E2A',
                  border: '1px solid #3A3A36',
                  borderRadius: 'var(--radius-pill)',
                  color: 'white', fontSize: 14,
                  outline: 'none',
                  fontFamily: 'var(--font-sans)',
                  minWidth: 0,
                }}
              />
              <button style={{
                padding: '12px 20px',
                backgroundColor: 'var(--amber)', color: 'white',
                border: 'none', borderRadius: 'var(--radius-pill)',
                fontWeight: 700, fontSize: 12,
                cursor: 'pointer', whiteSpace: 'nowrap',
                letterSpacing: '0.06em',
                fontFamily: 'var(--font-sans)',
              }}>
                NOTIFY ME
              </button>
            </div>
            <p style={{
              fontSize: 11, color: '#666',
              letterSpacing: '0.08em', textAlign: 'center',
            }}>
              WE RESPECT YOUR INBOX. NO SPAM, JUST DEALS.
            </p>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: isMobile ? '0 20px 40px' : '0 24px 64px',
      }}>

        {/* Mobile — accordion columns */}
        {isMobile ? (
          <div>
            {/* Brand */}
            <div style={{ marginBottom: 24 }}>
              <div style={{
                fontWeight: 900, fontSize: 18,
                marginBottom: 12, letterSpacing: '-0.5px',
              }}>
                BUYLENCE
              </div>
              <p style={{
                color: '#9A9890', fontSize: 13,
                lineHeight: 1.7, maxWidth: 280,
              }}>
                Redefining the student marketplace. Fresh, premium produce delivered to the OAU community.
              </p>
            </div>

            {/* Accordion cols */}
            {COLS.map(col => (
              <AccordionCol key={col.title} col={col} />
            ))}
          </div>
        ) : (
          /* Desktop — 4 column grid */
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr 1fr 1fr',
            gap: 48,
          }}>
            {/* Brand column */}
            <div>
              <div style={{
                fontWeight: 900, fontSize: 20,
                marginBottom: 16, letterSpacing: '-0.5px',
              }}>
                BUYLENCE
              </div>
              <p style={{
                color: '#9A9890', fontSize: 13,
                lineHeight: 1.7, maxWidth: 240,
              }}>
                Redefining the student marketplace. Fresh, premium produce sourced with integrity and delivered with excellence to the OAU community.
              </p>
            </div>

            {/* Link columns */}
            {COLS.map(col => (
              <div key={col.title}>
                <h4 style={{
                  fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.12em',
                  color: 'var(--amber)', marginBottom: 20,
                }}>
                  {col.title}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {col.links.map(link => (
                    <Link
                      key={link.label}
                      to={link.to}
                      style={{
                        fontSize: 13, color: '#9A9890',
                        textDecoration: 'none', letterSpacing: '0.04em',
                      }}
                      onMouseEnter={e => e.target.style.color = 'white'}
                      onMouseLeave={e => e.target.style.color = '#9A9890'}
                    >
                      {link.label.toUpperCase()}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div style={{
        borderTop: '1px solid #2A2A26',
        maxWidth: 1200, margin: '0 auto',
        padding: isMobile ? '16px 20px' : '20px 24px',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: isMobile ? 10 : 0,
      }}>
        <p style={{
          fontSize: 11, color: '#555',
          letterSpacing: '0.06em', margin: 0,
        }}>
          © 2026 BUYLENCE COLLECTIVE. ALL RIGHTS RESERVED.
        </p>

        {/* Mobile — links in a row */}
        <div style={{ display: 'flex', gap: isMobile ? 16 : 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {isMobile ? (
            <>
              {[
                { label: 'Privacy', to: '/terms' },
                { label: 'Terms', to: '/terms' },
                { label: 'Support', to: '/help' },
              ].map(l => (
                <Link
                  key={l.label}
                  to={l.to}
                  style={{ fontSize: 11, color: '#555', textDecoration: 'none', letterSpacing: '0.06em' }}
                >
                  {l.label.toUpperCase()}
                </Link>
              ))}
            </>
          ) : (
            <div style={{
              fontSize: 11, color: '#555',
              letterSpacing: '0.08em',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              DESIGNED FOR
              <span style={{
                border: '1px solid #3A3A36',
                borderRadius: 'var(--radius-pill)',
                padding: '3px 10px',
                fontSize: 11, color: '#888',
              }}>
                OAU CAMPUS
              </span>
            </div>
          )}
        </div>
      </div>
    </footer>
  )
}