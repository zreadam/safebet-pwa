import 'flag-icons/css/flag-icons.min.css'

interface CountryFlagProps {
  countryCode: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  rounded?: boolean
}

const sizeMap = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
}

export function CountryFlag({
  countryCode,
  size = 'md',
  className = '',
  rounded = true,
}: CountryFlagProps) {
  const code = countryCode.toLowerCase()
  const sizeClass = sizeMap[size]
  const roundedClass = rounded ? 'rounded-full' : ''

  return (
    <span
      className={`fi fi-${code} inline-flex ${sizeClass} ${roundedClass} overflow-hidden ${className}`}
      title={countryCode}
    />
  )
}

export default CountryFlag
