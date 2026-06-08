# 🔐 Audit Légal - SafeBet (Application Commerciale)

**Date**: 2026-06-08  
**Statut**: ⚠️ RISQUES DÉTECTÉS - À CORRIGER AVANT LANCEMENT COMMERCIAL

---

## 1️⃣ DONNÉES SPORTIVES & LOGOS

### ❌ Risques Détectés:

#### A) **Logos des clubs** (PROBLÈME MAJEUR)
- **Utilisation actuelle**: Récupération depuis API-Football
- **Droit d'auteur**: Propriété des clubs (non-transférable)
- **Risque légal**: 🔴 ÉLEVÉ
- **Impact commercial**: Cease & Desist, retrait forcé, poursuites

**Clubs affectés**: PSG, Manchester United, Real Madrid, Bayern Munich, etc. (250+ clubs)

**Solution requise**:
- [ ] Obtenir licence officielle auprès de chaque ligue/club (très coûteux)
- [ ] Utiliser initiales/badges génériques (0€, légal, moins attrayant)
- [ ] Acheter licence auprès d'agrégateur (Sportradar, Genius Sports)

**Coût estimé**: 
- Badges génériques: 0€
- Agrégateur de logos: 5K-50K€/an
- Licences individuelles: Non viable (trop de clubs)

---

#### B) **Noms des équipes & Compétitions** (RISQUE MOYEN)
- **Utilisation**: Affichage sur pages (PSG, "Ligue 1", "Coupe du monde")
- **Droit d'auteur**: Marques déposées des organisations
- **Risque légal**: 🟡 MOYEN
- **Jurisprudence**: Généralement toléré si:
  - ✅ But informatif (affichage de résultats)
  - ✅ Pas d'association/sponsorship implicite
  - ✅ Crédits mentionnés

**Solution requise**: CRÉDITS OBLIGATOIRES
- Ajouter mention légale: "Données de la Ligue de Football Professionnel (LFP), Premier League, etc."

---

#### C) **Cotes/Odds** (RISQUE FAIBLE)
- **Source**: The Odds API
- **Terms of Service**: Vérifier usage commercial autorisé
- **Risque légal**: 🟢 FAIBLE (si ToS respectées)

**Vérification nécessaire**: ✅ À FAIRE
```
Lire: https://theoddsapi.com/terms
Vérifier: "Commercial use allowed?"
```

---

### 📊 Données Fournisseur (API-Football)

| API | Utilisateur pour | Risque | ToS Commercial |
|-----|-----------------|--------|-----------------|
| **API-Football** | Scores, Stats, Logos | 🟡 Moyen | ❌ À vérifier |
| **The Odds API** | Cotes de paris | 🟢 Faible | ⚠️ À vérifier |
| **Football-Data.org** | Calendrier, équipes | 🟢 Faible | ✅ Oui (Premium) |
| **Wikimedia** | Drapeaux pays | 🟢 Faible | ✅ Oui (CC-BY) |

---

## 2️⃣ PARIS SPORTIFS (RÉGLEMENTATION)

### 🚨 RISQUE CRITIQUE

SafeBet est une **plateforme de paris**. Les réglementations varient par pays:

#### 🇫🇷 **France**
- ❌ **Illégal sans agrément** (sauf Française des Jeux)
- **Amende**: Jusqu'à €200K
- **Responsable**: Exploitant + propriétaire du site

**Exigences**:
- [ ] Demander agrément à l'Autorité Nationale de Régulation des Jeux (ARJEL)
- [ ] Respect des limites de mise/dépôt
- [ ] Vérification de l'âge (18+ strictement)
- [ ] Politique anti-blanchiment (KYC/AML)
- [ ] Contrôle de dépendance au jeu

**Coût**: 30K€-50K€ en frais administratifs + revenus versés à l'État

#### 🇬🇧 **UK**
- ✅ **Légal** avec licence UKGC
- **Coût**: £5K-15K + ongoing compliance

#### 🇪🇺 **UE** (autre que FR)
- Varie: Allemagne (strict), Pays-Bas (légal), Espagne (légal)

#### 🌍 **Autres pays**
- Risque très élevé (USA, Canada, etc.)

---

## 3️⃣ CONTENU UTILISATEUR & RESPONSABILITÉ

### 📱 Compte Utilisateur
- [ ] **Termes d'utilisation** - Document légal obligatoire
- [ ] **Politique de confidentialité** - RGPD (si EU)
- [ ] **Mentions légales** - Qui exploite le service?

### 💳 Transactions Stripe
- ✅ **Stripe est PCI-compliant** (bon)
- ⚠️ **Mais**: Vous êtes responsable du dépôt d'argent
- [ ] **Fonds bloqués**: Doivent être restitués légalement

---

## 4️⃣ DONNÉES PERSONNELLES (RGPD)

### 🔐 Actuellement Collectées:
- Email, nom d'utilisateur
- Pays, équipe favorite
- Historique de paris
- Transactions Stripe

**Risque**: 🟡 MOYEN
- [ ] **Politique de confidentialité** - OBLIGATION LÉGALE
- [ ] **Consentement explicite** - À demander à l'inscription
- [ ] **Droit d'oubli** - Capacité à supprimer compte
- [ ] **Portabilité des données** - À permettre

**Amende RGPD**: Jusqu'à 4% du chiffre d'affaires global

---

## 5️⃣ CHECKLIST LÉGALE AVANT LANCEMENT COMMERCIAL

### Documents Obligatoires:
- [ ] **Mentions légales** (nom, adresse, siège social)
- [ ] **Termes d'utilisation** (conditions de service)
- [ ] **Politique de confidentialité** (RGPD)
- [ ] **Politique de cookies** (ePrivacy)
- [ ] **Avis de conformité** (AML/KYC)

### Conformité API:
- [ ] Lire ToS de **The Odds API**
- [ ] Lire ToS de **API-Football**  
- [ ] Lire ToS de **Stripe**
- [ ] Lire ToS de **Supabase**

### Réglementation Jeux d'Argent:
- [ ] **Déterminer marché cible** (France? UK? Autre?)
- [ ] **Consulter expert juridique** spécialisé jeux d'argent
- [ ] **Demander agréments** si requis par pays
- [ ] **Implémenter vérification age** (18+ strictement)
- [ ] **Bloquer pays interdits** (géoblocking)

### Propriété Intellectuelle:
- [ ] **Logos clubs**: Décider stratégie (badges génériques vs. licence)
- [ ] **Noms équipes**: Ajouter crédits légaux
- [ ] **Données scores**: Vérifier droits API

---

## 6️⃣ RECOMMANDATIONS PRIORITAIRES

### 🔴 AVANT TOUT LANCEMENT COMMERCIAL:

1. **Consulter avocat spécialisé** (jeux d'argent + sports)
   - Coût: 1K-5K€ pour avis juridique
   - Temps: 1-2 semaines
   
2. **Déterminer marché légal**
   - France? → Agrément ARJEL requis (long)
   - UK? → Licence UKGC requise
   - Autres? → Chaque pays a ses règles

3. **Remplacer logos clubs** par badges génériques
   - Zéro risque légal
   - Coût: 0€
   - Temps: 1-2 jours

4. **Rédiger documents légaux**
   - Ou utiliser template légal (Legalstart, Legify)
   - Coût: 100-500€
   - Temps: 1 jour

5. **Vérifier tous ToS API**
   - Temps: 2-3 heures
   - Coût: 0€

---

## 7️⃣ RISQUES PAR SCÉNARIO

### Scénario 1: Lancer commercialement (AS IS) 
**Risque**: 🔴 TRÈS ÉLEVÉ
- Poursuites pour logos (clubs)
- Amendes réglementation jeux (État)
- Fermeture forcée
- Poursuites civiles utilisateurs

**Probabilité de problème**: 70-80% dans 6-12 mois

---

### Scénario 2: Badges génériques + Agrément
**Risque**: 🟢 FAIBLE
- Crédits légaux mentionnés
- Conforme réglementation
- Robuste légalement

**Coût supplémentaire**: 5K-100K€ (selon pays)
**Temps**: 2-6 mois (agrément)

---

### Scénario 3: Lancer gratuitement (pas commerce)
**Risque**: 🟡 MOYEN  
- Logos toujours à risque
- Pas besoin d'agrément (généralement)
- Meilleure base pour monétiser plus tard

---

## ⚖️ CONCLUSION

**SafeBet n'est PAS prête pour lancement commercial sans**:

1. ❌ Remplacement logos clubs → badges génériques
2. ❌ Agrément réglementaire jeux d'argent (si applicable)
3. ❌ Documents légaux (mentions, ToS, RGPD)
4. ❌ Avis juridique professionnel

**État actuel**: POC (Proof of Concept) viable pour:
- ✅ Test gratuit / beta
- ✅ Développement
- ✅ Présentation investisseurs

**Non viable pour**: ❌ Monétisation réelle avec vrais paris

---

## 📞 Prochaines Étapes

1. **Appelle un avocat** spécialisé jeux d'argent/sports
2. **Décide ton marché** (France → 6-12 mois, UK → 3-6 mois)
3. **Remplace logos** (immédiat, 1 jour)
4. **Rédige documents** (1 semaine)

