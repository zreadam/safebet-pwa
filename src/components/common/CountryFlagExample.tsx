/**
 * Exemple d'utilisation du composant CountryFlag
 * 
 * Usage:
 * <CountryFlag countryCode="fr" size="md" rounded={true} />
 */

import { CountryFlag } from './CountryFlag'
import { COUNTRY_CODES } from '@/lib/countries'

export function CountryFlagExample() {
  return (
    <div className="flex flex-wrap gap-4 p-4">
      <div>
        <h3 className="text-sm font-bold mb-2">Petit (sm)</h3>
        <CountryFlag countryCode={COUNTRY_CODES.FR} size="sm" />
        <CountryFlag countryCode={COUNTRY_CODES.ES} size="sm" />
        <CountryFlag countryCode={COUNTRY_CODES.DE} size="sm" />
      </div>
      
      <div>
        <h3 className="text-sm font-bold mb-2">Moyen (md)</h3>
        <CountryFlag countryCode={COUNTRY_CODES.FR} size="md" />
        <CountryFlag countryCode={COUNTRY_CODES.BR} size="md" />
        <CountryFlag countryCode={COUNTRY_CODES.AR} size="md" />
      </div>
      
      <div>
        <h3 className="text-sm font-bold mb-2">Grand (lg)</h3>
        <CountryFlag countryCode={COUNTRY_CODES.FR} size="lg" />
        <CountryFlag countryCode={COUNTRY_CODES.IT} size="lg" />
      </div>

      <div>
        <h3 className="text-sm font-bold mb-2">Rectangle (rounded=false)</h3>
        <CountryFlag countryCode={COUNTRY_CODES.FR} size="md" rounded={false} />
        <CountryFlag countryCode={COUNTRY_CODES.GB} size="md" rounded={false} />
      </div>
    </div>
  )
}
