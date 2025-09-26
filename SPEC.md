# Patrimoine immobilier — Stoneverse

> Baseline : **Own your property universe.**

---

## 1) Contexte et objectif

L’application vise à fournir un pilotage patrimonial immobilier **multi-biens**, intégrant à la fois (i) le **suivi en production** des biens existants (réels) et (ii) un **simulateur de scénarios** pour projeter l’impact d’acquisitions/cessions sur l’ensemble du portefeuille. Le produit doit permettre :
- la **modélisation** et la **mise à jour continue** des biens détenus (prix d’achat, prêts, loyers, charges, incidents, capex, indexations, vacance) ;
- la **visualisation consolidée** du patrimoine (valeur, dette, LTV, DSCR, cash-flows, fiscalité) au réel et en projection ;
- la **simulation d’achats/ventes** et la **comparaison d’options**, avec mesure de l’impact global sur le portefeuille ;
- la prise en compte de **plusieurs structures fiscales** (LMNP, SCI à l’IS) au niveau bien/entité ;
- des **exports auditables** pour partage et décision.

---

## 2) Périmètre

### Inclus (Phase 1)
- **Suivi opérationnel multi-biens (mode Réel)** : enregistrement des hypothèses et des événements mensuels (loyers encaissés, vacance, charges, capex, indexations IRL) et recalcul des KPI.
- **Baseline portefeuille à T0**, avec reprise d’historique simplifiée (soldes prêts, valeurs, loyers actuels).
- **Simulateur What if** : achats, ventes et refinancements (renégociation/rallongement, rachat, cash out), et comparaison jusqu’à **5 scénarios**.
- **Calcul détaillé des plus-values** de cession :  
  - **LMNP (non professionnel)** — régime des particuliers : PV immobilière privée avec abattements par durée (barèmes paramétrés), **sans** réintégration des amortissements.  
  - **SCI à l’IS** — PV professionnelle : Prix net – VNC, réintégration des amortissements, imposition à l’IS (barèmes paramétrés).
- **Vue consolidée** : patrimoine net, LTV, DSCR, cash-flow net d’impôt, TRI/VAN, impôts/IS, par bien, par entité (Perso/SCI IS) et global.
- **Impact de cession** : cash net vendeur (frais, IRA, remboursement dette) et effets portefeuille (LTV, DSCR, CF, impôts), PV calculée selon régime.
- **Budgets & écarts** : budget annuel/mensuel (loyers, charges, capex) et suivi Réel vs Budget (seuils, rolling forecast).
- **Exports PDF/Excel**, **gestion utilisateurs** et **partages**.

---

## 3) Acteurs et rôles

- **Investisseur particulier (Utilisateur final)** : crée des biens, scénarios, compare, exporte.
- **Admin** : gestion des référentiels (taux, tranches IS, paramètres par défaut), gestion RGPD et sauvegardes.

**Droits (principes)**
- Chaque portefeuille appartient à un **propriétaire**. Partage possible avec droits : **Lecture**, **Commentaire**, **Édition**.
- Un **Pro** peut créer des **dossiers clients** regroupant biens et scénarios.

---

## 4) Parcours utilisateurs détaillés

### 4.1 Onboarding & reprise des biens existants (mode Réel)
1. Création du **Portefeuille** et des **Entités** (Perso, SCI IS).
2. **Wizard Reprise** par bien : acquisition, soldes de prêts au T0, loyer courant & indexation, charges, taxe foncière, capex planifiés, vacance historique (optionnelle).
3. Définition de la **date T0** et des **valeurs de marché** (estimation manuelle) pour calcul LTV.
4. Enregistrement et **calcul immédiat** des KPI Réel à T0.

### 4.2 Saisie continue (Journal mensuel)
1. À chaque période, saisie/import (manuel Phase 1) : loyers encaissés, vacance (jours/mois), charges payées, capex, révisions IRL, incidents.
2. Recalcul : **cash-flow mensuel**, **DSCR**, agrégats annuels, projections glissantes.
3. **Alerte** en cas d’écart vs prévision > seuil (paramétrable).

### 4.3 Création d’un scénario What if (achat)
1. Depuis le Réel, création d’un scénario basé sur **baseline T0 (ou Tn)**.
2. Ajout de **nouveaux biens** avec options de financement, fiscalité, hypothèses de marché ; calcul.
3. Comparaison **Réel vs Réel+Scénario** sur 5–30 ans : cash-flow, LTV, TRI, VAN, impôts.

### 4.4 Scénario What if (vente)
1. Sélection d’un bien → **Simuler vente** (date, frais, décote, remboursement anticipé, IRA).
2. Calcul du **cash net vendeur**, remboursement de la dette, impact sur **patrimoine net**, **LTV**, **DSCR**, **cash-flow** et **fiscalité** (PV selon régime).
3. Sauvegarde et **comparaison** (vendre maintenant vs dans X ans).

### 4.5 Scénario What if (refinancement)
1. Depuis un bien : **Refinancer** (renégociation, rachat externe, rallongement, cash out).
2. Saisie : type, nouveau taux, durée, frais, garanties, **IRA**, **cash out** éventuel.
3. Remplacement de l’échéancier à la date effective ; calcul **coût total** et impact (**DSCR, CF, LTV, TRI/VAN**).
4. Sauvegarde (opération de scénario, réversible) + **comparaison** au status quo.

### 4.6 Comparaison & décision
- Tableau comparatif multi scénarios ; critères : **TRI net**, **VAN**, **CF cumulé**, **LTV cible**, **DSCR minimal** ; mise en évidence du **meilleur** selon un objectif.

### 4.7 Rapprochement bancaire (Phase 2)
1. Connexion compte bancaire (API agrégateur) ou import CSV.
2. **Mapping auto** vers Événements mensuels (loyers, charges, capex, intérêts, assurances).
3. Statuts : **Apparié**, **Partiel**, **Non apparié** (tolérance montant/date).
4. **Validation en lot**, exceptions et création d’événements manquants.

### 4.8 Budget & écarts
1. Définition d’un **budget** annuel/mensuel par bien/poste.
2. À la clôture mensuelle, calcul des **écarts** (montant, %) et **alertes** si dépassement.
3. **Rolling forecast** (projection fin d’année) et impact sur KPI portefeuille.

### 4.9 Export & partage
- **PDF/Excel** (hypothèses, échéanciers, flux réels, projections, PV, refi, écarts), **partage sécurisé**.

---

## 5) Fonctionnalités principales

1. **Mode Réel (Suivi)**
   - Journal mensuel par bien : loyers encaissés, vacance (jours/mois), charges (OPEX), CAPEX, IRL appliqué, impayés, remise en état.
   - Clôture mensuelle/annuelle : agrégats, **écarts vs budget**, alertes (loyer < cible, DSCR < 1,2, vacance > x%).
   - Mise à jour des **soldes de prêts** et **intérêts payés** (calcul interne ; import manuel relevés intérêts en option).

2. **Mode What if (Simulation)**
   - **Achats** (biens nouveaux), variantes de prêts, fiscalité **LMNP/SCI IS**, **ventes** (date, frais, IRA, prix), **refinancements** (renégociation, rachat, rallongement, cash out).
   - **Sensibilités** et **stress tests** au niveau portefeuille.

3. **Consolidation & Reporting**
   - Vue **portefeuille** (global/entité/bien), switch **Réel / What if / Réel+What if**.
   - KPI : **Valeur, Dette, Patrimoine net, LTV, DSCR, Cash-flow net d’impôts, TRI/VAN, impôts/IS**.

4. **Fiscalité**
   - **LMNP réel** : charges, **amortissements par composant**, plafonds d’imputation, PV privée paramétrée.
   - **SCI IS** : résultat imposable, IS, reports déficits ; PV professionnelle (VNC), **distribution de dividendes optionnelle** (simplifiée).

5. **Budgets & écarts**
   - Budgets par bien/poste, **seuils d’alerte**, **rolling forecast**, export.

6. **Productivité & UX**
   - **Wizards**, duplication, presets, validations live, **tags/recherche**, **historique versions**, **autosave**.

7. **Modèle de coûts d’acquisition**
   - Prix, frais notaire, agence, travaux initiaux, mobilier LMNP, frais dossier bancaire.

8. **Financement**
   - **Prêts multiples** par bien (amortissable, in fine), taux fixe/variable, assurance, **différé** partiel/total, **IRA**, garanties.

9. **Exploitation (OPEX)**
   - Charges copropriété, entretien, gestion locative, PNO,
