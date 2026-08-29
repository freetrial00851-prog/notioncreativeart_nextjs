import { MaterialIcon } from './MaterialIcon'

export const PASSWORD_RULES = [
  { key: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { key: 'upper', label: '1 uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { key: 'lower', label: '1 lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { key: 'special', label: '1 special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const

export function isPasswordValid(password: string) {
  return PASSWORD_RULES.every((rule) => rule.test(password))
}

function getStrength(password: string) {
  const metCount = PASSWORD_RULES.filter((rule) => rule.test(password)).length
  if (metCount <= 1) return { level: 'weak', label: 'Weak', color: 'var(--color-madder)', width: '33%' } as const
  if (metCount <= 3) return { level: 'medium', label: 'Medium', color: '#D97706', width: '66%' } as const
  return { level: 'strong', label: 'Strong', color: 'var(--color-sale-green)', width: '100%' } as const
}

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  const strength = getStrength(password)

  return (
    <div className="mt-2.5">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="flex-1 h-1.5 rounded-full bg-line overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: strength.width, background: strength.color }}
          />
        </div>
        <span className="text-[11px] font-semibold shrink-0" style={{ color: strength.color }}>{strength.label}</span>
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(password)
          return (
            <li key={rule.key} className="flex items-center gap-1.5 text-[11px]" style={{ color: met ? 'var(--color-sale-green)' : 'var(--color-ink-soft)' }}>
              <MaterialIcon name={met ? 'check_circle' : 'radio_button_unchecked'} size={13} />
              {rule.label}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
