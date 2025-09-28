'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/button';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Input from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building2, Users, Scale, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FiscalRegime } from '@/lib/types/fiscal';

interface LegalEntity {
  id: string;
  name: string;
  type: FiscalRegime;
  properties_count?: number;
  incorporation_date?: string | null;
  created_at: string;
}

interface EntitySelectorProps {
  portfolioId: string;
  selectedEntity?: LegalEntity | null;
  onEntitySelect: (entity: LegalEntity) => void;
  className?: string;
}

interface EntityCardProps {
  entity: LegalEntity;
  isSelected: boolean;
  onClick: () => void;
}

function EntityCard({ entity, isSelected, onClick }: EntityCardProps) {
  const getEntityIcon = (type: FiscalRegime) => {
    switch (type) {
      case 'personal':
        return <Users className="h-5 w-5" />;
      case 'lmnp':
        return <Building2 className="h-5 w-5" />;
      case 'sci_is':
        return <Scale className="h-5 w-5" />;
      default:
        return <Building2 className="h-5 w-5" />;
    }
  };

  const getEntityTypeLabel = (type: FiscalRegime) => {
    switch (type) {
      case 'personal':
        return 'Personnel';
      case 'lmnp':
        return 'LMNP';
      case 'sci_is':
        return 'SCI IS';
      default:
        return type;
    }
  };

  const getEntityTypeVariant = (type: FiscalRegime) => {
    switch (type) {
      case 'personal':
        return 'secondary';
      case 'lmnp':
        return 'default';
      case 'sci_is':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-md',
        isSelected ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {getEntityIcon(entity.type)}
            {entity.name}
          </CardTitle>
          <Badge variant={getEntityTypeVariant(entity.type)}>
            {getEntityTypeLabel(entity.type)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground">
          {entity.properties_count !== undefined && (
            <div className="flex justify-between">
              <span>Biens</span>
              <span className="font-medium">{entity.properties_count}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Créé le</span>
            <span className="font-medium">
              {new Date(entity.created_at).toLocaleDateString('fr-FR')}
            </span>
          </div>
          {entity.incorporation_date && (
            <div className="flex justify-between">
              <span>Constituée le</span>
              <span className="font-medium">
                {new Date(entity.incorporation_date).toLocaleDateString('fr-FR')}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CreateEntityDialog({ portfolioId, onEntityCreated }: {
  portfolioId: string;
  onEntityCreated: (entity: LegalEntity) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'personal' as FiscalRegime,
    incorporation_date: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/v1/portfolios/${portfolioId}/entities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          incorporation_date: formData.incorporation_date || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create entity');
      }

      const entity = await response.json();
      onEntityCreated(entity);
      setOpen(false);
      setFormData({ name: '', type: 'personal', incorporation_date: '' });
    } catch (error) {
      console.error('Error creating entity:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-full min-h-[120px] border-dashed">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Plus className="h-8 w-8" />
            <span>Créer une entité</span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer une nouvelle entité légale</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nom de l'entité"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="ex: Patrimoine Personnel, SCI Familiale..."
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type d'entité</label>
            <Select
              value={formData.type}
              onValueChange={(value: FiscalRegime) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">Personnel</SelectItem>
                <SelectItem value="lmnp">LMNP (Loueur Meublé Non Professionnel)</SelectItem>
                <SelectItem value="sci_is">SCI IS (SCI à l'Impôt sur les Sociétés)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.type === 'sci_is' && (
            <Input
              label="Date de constitution (optionnel)"
              type="date"
              value={formData.incorporation_date}
              onChange={(e) => setFormData({ ...formData, incorporation_date: e.target.value })}
            />
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !formData.name}>
              {loading ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function EntitySelector({
  portfolioId,
  selectedEntity,
  onEntitySelect,
  className
}: EntitySelectorProps) {
  const [entities, setEntities] = useState<LegalEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntities = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/portfolios/${portfolioId}/entities?include_properties=true`);

      if (!response.ok) {
        throw new Error('Failed to fetch entities');
      }

      const data = await response.json();
      setEntities(data.entities || []);

      // Auto-select first entity if none selected
      if (data.entities?.length > 0 && !selectedEntity) {
        onEntitySelect(data.entities[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntities();
  }, [portfolioId]);

  const handleEntityCreated = (newEntity: LegalEntity) => {
    setEntities(prev => [...prev, newEntity]);
    onEntitySelect(newEntity);
  };

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={cn('border-destructive bg-destructive/5', className)}>
        <CardContent className="pt-6">
          <div className="text-destructive text-center">
            Erreur lors du chargement des entités : {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Entités légales</h3>
        <Badge variant="secondary">{entities.length} entité(s)</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {entities.map((entity) => (
          <EntityCard
            key={entity.id}
            entity={entity}
            isSelected={selectedEntity?.id === entity.id}
            onClick={() => onEntitySelect(entity)}
          />
        ))}

        <CreateEntityDialog
          portfolioId={portfolioId}
          onEntityCreated={handleEntityCreated}
        />
      </div>

      {selectedEntity && (
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Entité sélectionnée : {selectedEntity.name}</h4>
          <p className="text-sm text-muted-foreground">
            Cette entité sera utilisée pour les calculs fiscaux et l'affichage des KPIs.
          </p>
        </div>
      )}
    </div>
  );
}