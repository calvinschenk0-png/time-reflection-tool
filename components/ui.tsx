import React from 'react'

const card: React.CSSProperties = {
  background: '#f4f4f5',
  borderRadius: 20,
  padding: 24,
  marginBottom: 12,
}

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ ...card, ...style }}>{children}</div>
}

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: '#111', letterSpacing: '-0.01em', marginBottom: 14 }}>
      {children}
    </p>
  )
}

export function Muted({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: 12, color: '#999' }}>{children}</span>
}

export function PrimaryButton({ children, onClick, type = 'button', disabled, style }: {
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  style?: React.CSSProperties
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: '#111',
        color: '#fff',
        border: 'none',
        borderRadius: 10,
        padding: '10px 18px',
        fontSize: 13,
        fontWeight: 600,
        fontFamily: "'Space Grotesk', sans-serif",
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  )
}

export function SecondaryButton({ children, onClick, type = 'button', style }: {
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  style?: React.CSSProperties
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        background: '#fff',
        color: '#111',
        border: '1px solid #e4e4e7',
        borderRadius: 10,
        padding: '9px 18px',
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

export function DangerButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'none',
        color: '#dc2626',
        border: 'none',
        fontSize: 12,
        cursor: 'pointer',
        padding: '4px 0',
      }}
    >
      {children}
    </button>
  )
}

export function Input({ label, value, onChange, placeholder, type = 'text' }: {
  label?: string
  value: string | number
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 5, fontWeight: 500 }}>{label}</label>}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          border: '1px solid #e4e4e7',
          borderRadius: 10,
          padding: '9px 12px',
          fontSize: 13,
          color: '#111',
          background: '#fff',
          outline: 'none',
          fontFamily: "'Inter', sans-serif",
        }}
      />
    </div>
  )
}

export function Badge({ children, color = '#2563eb' }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{
      background: color + '18',
      color: color,
      borderRadius: 99,
      padding: '2px 8px',
      fontSize: 11,
      fontWeight: 600,
    }}>
      {children}
    </span>
  )
}

export function ColorDot({ color }: { color: string }) {
  return <div style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
}

export function Divider() {
  return <div style={{ height: 1, background: '#e4e4e7', margin: '8px 0' }} />
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ width: '100%', maxWidth: 560, margin: '0 auto', padding: '28px 24px 80px' }}>
      {children}
    </div>
  )
}
