# Guide de Déploiement - Stoneverse

## Déploiement sur Vercel avec Supabase

### 1. Prérequis

- Compte Vercel
- Compte Supabase
- Repository Git (GitHub, GitLab, etc.)

### 2. Configuration Supabase

#### Étape 1: Créer un nouveau projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez les informations de connexion :
   - `Project URL`
   - `Anon public key`
   - `Service role key`

#### Étape 2: Configurer la base de données

1. Dans le dashboard Supabase, allez dans **SQL Editor**
2. Exécutez le script de migration :
   ```sql
   -- Copiez le contenu de supabase/migrations/001_initial_schema.sql
   ```
3. Optionnel : Insérez les données d'exemple :
   ```sql
   -- Copiez le contenu de supabase/seed.sql
   -- IMPORTANT: Remplacez 'demo-user-id' par un vrai UUID utilisateur
   ```

#### Étape 3: Configurer l'authentification

1. Dans **Authentication > Settings**
2. Configurez l'URL du site :
   - Site URL : `https://votre-app.vercel.app`
   - Redirect URLs : `https://votre-app.vercel.app/auth/callback`

### 3. Déploiement sur Vercel

#### Étape 1: Connecter le repository

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur "New Project"
3. Importez votre repository Git
4. Sélectionnez "Next.js" comme framework

#### Étape 2: Configurer les variables d'environnement

Dans les paramètres du projet Vercel, ajoutez ces variables :

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Next.js Configuration
NEXTAUTH_URL=https://votre-app.vercel.app
NEXTAUTH_SECRET=votre-secret-aleatoire-long

# Application Configuration
NODE_ENV=production
APP_URL=https://votre-app.vercel.app
```

#### Étape 3: Déployer

1. Cliquez sur "Deploy"
2. Attendez que le build se termine
3. Votre application sera disponible à l'URL fournie

### 4. Configuration post-déploiement

#### Mettre à jour les URLs Supabase

1. Retournez dans Supabase **Authentication > Settings**
2. Mettez à jour les URLs avec votre domaine Vercel :
   - Site URL : `https://votre-app.vercel.app`
   - Redirect URLs : `https://votre-app.vercel.app/auth/callback`

#### Créer un utilisateur de test

1. Dans Supabase **Authentication > Users**
2. Cliquez sur "Invite user"
3. Entrez un email de test
4. L'utilisateur recevra un email d'invitation

### 5. Test de l'application

1. Visitez votre app : `https://votre-app.vercel.app`
2. Testez l'authentification
3. Vérifiez les fonctionnalités CRUD :
   - Ajout/suppression de biens
   - Ajout/modification d'entités légales
   - Navigation entre les onglets

### 6. Mode Démo (Sans Supabase)

L'application peut aussi fonctionner en mode démo sans configuration Supabase :

1. Ne configurez pas les variables Supabase
2. L'app détectera automatiquement le mode démo
3. Les utilisateurs pourront utiliser l'app avec des données fictives

### 7. Monitoring et Logs

#### Logs Vercel
- Consultez les logs dans le dashboard Vercel
- Utilisez `vercel logs` en CLI

#### Monitoring Supabase
- Dashboard Supabase pour surveiller l'usage
- Logs des requêtes SQL
- Métriques d'authentification

### 8. Maintenance

#### Mises à jour
```bash
# Mettre à jour les dépendances
npm update

# Redéployer
git push origin main
```

#### Backup de base de données
1. Dans Supabase **Settings > Database**
2. Téléchargez un backup régulier
3. Conservez les migrations SQL pour reproduire la structure

### 9. Troubleshooting

#### Erreurs communes

1. **Build Failed**
   - Vérifiez les imports/exports
   - Contrôlez les types TypeScript
   - Consultez les logs de build

2. **Authentication Issues**
   - Vérifiez les URLs de redirection
   - Contrôlez les variables d'environnement
   - Vérifiez les politiques RLS dans Supabase

3. **API Errors**
   - Vérifiez les permissions Supabase
   - Contrôlez les politiques RLS
   - Consultez les logs Supabase

4. **Performance Issues**
   - Optimisez les requêtes Supabase
   - Utilisez la mise en cache Vercel
   - Minimisez les re-renders React

### 10. Sécurité

#### Variables d'environnement
- Ne jamais exposer la `SERVICE_ROLE_KEY` côté client
- Utilisez des secrets forts pour `NEXTAUTH_SECRET`
- Configurez HTTPS uniquement en production

#### Supabase Security
- Activez RLS sur toutes les tables
- Configurez des politiques restrictives
- Auditez régulièrement les accès

#### Vercel Security
- Configurez les headers de sécurité (déjà dans vercel.json)
- Utilisez des domaines personnalisés pour la production
- Configurez les redirections HTTPS

## Support

Pour tout problème, consultez :
- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Next.js](https://nextjs.org/docs)