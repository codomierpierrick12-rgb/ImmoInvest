'use client';

import { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Input from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Edit, Trash2, Plus, Building, Users } from 'lucide-react';
import { FiscalRegime } from '@/lib/types/fiscal';

interface LegalEntity {
  id: string;
  name: string;
  type: FiscalRegime;
  properties_count?: number;
  incorporation_date?: string | null;
  created_at: string;
}

interface EntityManagerProps {
  portfolioId: string;
  selectedEntity?: LegalEntity | null;
  onEntitySelect?: (entity: LegalEntity) => void;
  className?: string;
}

export default function EntityManager({
  portfolioId,
  selectedEntity,
  onEntitySelect,
  className,
}: EntityManagerProps) {
  const [entities, setEntities] = useState<LegalEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEntity, setEditingEntity] = useState<LegalEntity | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'lmnp' as FiscalRegime,
    incorporation_date: '',
  });

  useEffect(() => {
    fetchEntities();
  }, [portfolioId]);

  const fetchEntities = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/portfolios/${portfolioId}/entities?include_properties=true`);

      if (!response.ok) {
        throw new Error('Failed to fetch entities');
      }

      const data = await response.json();
      setEntities(data.entities || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEntity = async () => {
    try {
      const response = await fetch(`/api/v1/portfolios/${portfolioId}/entities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newEntity = await response.json();
        setEntities(prev => [...prev, newEntity]);
        setShowForm(false);
        resetForm();
      } else {
        throw new Error('Failed to create entity');
      }
    } catch (error) {
      console.error('Error creating entity:', error);
      alert('Erreur lors de la création de l\'entité');
    }
  };

  const handleUpdateEntity = async () => {
    if (!editingEntity) return;

    try {
      const response = await fetch(`/api/v1/portfolios/${portfolioId}/entities/${editingEntity.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedEntity = await response.json();
        setEntities(prev => prev.map(e => e.id === editingEntity.id ? updatedEntity : e));
        setShowForm(false);
        setEditingEntity(null);
        resetForm();
      } else {
        throw new Error('Failed to update entity');
      }
    } catch (error) {
      console.error('Error updating entity:', error);
      alert('Erreur lors de la modification de l\'entité');
    }
  };

  const handleDeleteEntity = async (entity: LegalEntity) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'entité "${entity.name}" ?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/portfolios/${portfolioId}/entities/${entity.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setEntities(prev => prev.filter(e => e.id !== entity.id));
        if (selectedEntity?.id === entity.id) {
          onEntitySelect?.(entities.find(e => e.id !== entity.id) || null);
        }
      } else {
        throw new Error('Failed to delete entity');
      }
    } catch (error) {
      console.error('Error deleting entity:', error);
      alert('Erreur lors de la suppression de l\'entité');
    }
  };

  const handleEditEntity = (entity: LegalEntity) => {
    setEditingEntity(entity);
    setFormData({
      name: entity.name,
      type: entity.type,
      incorporation_date: entity.incorporation_date || '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'lmnp',
      incorporation_date: '',
    });
    setEditingEntity(null);
  };

  const getEntityTypeLabel = (type: FiscalRegime) => {
    const labels: Record<FiscalRegime, string> = {
      'lmnp': 'LMNP',
      'lmp': 'LMP',
      'sci_ir': 'SCI IR',
      'sci_is': 'SCI IS',
      'sarl': 'SARL',
      'sas': 'SAS',
    };
    return labels[type] || type;
  };

  const getEntityIcon = (type: FiscalRegime) => {
    if (type.includes('sci') || type === 'sarl' || type === 'sas') {
      return <Building className="h-4 w-4" />;
    }
    return <Users className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className={cn('border-red-200 bg-red-50', className)}>
        <CardContent>
          <div className="text-red-600 mb-4">Error: {error}</div>
          <Button variant="outline" onClick={fetchEntities}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Entités Légales ({entities.length})
        </h2>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une entité
        </Button>
      </div>

      {/* Entity Form */}
      {showForm && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base">
              {editingEntity ? 'Modifier l\'entité' : 'Nouvelle entité légale'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'entité
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: SCI Immobilier, LMNP Personnel..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type d'entité
              </label>
              <Select
                value={formData.type}
                onValueChange={(value: FiscalRegime) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lmnp">LMNP - Loueur Meublé Non Professionnel</SelectItem>
                  <SelectItem value="lmp">LMP - Loueur Meublé Professionnel</SelectItem>
                  <SelectItem value="sci_ir">SCI IR - Société Civile Immobilière à l'IR</SelectItem>
                  <SelectItem value="sci_is">SCI IS - Société Civile Immobilière à l'IS</SelectItem>
                  <SelectItem value="sarl">SARL - Société à Responsabilité Limitée</SelectItem>
                  <SelectItem value="sas">SAS - Société par Actions Simplifiée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de constitution (optionnel)
              </label>
              <Input
                type="date"
                value={formData.incorporation_date}
                onChange={(e) => setFormData(prev => ({ ...prev, incorporation_date: e.target.value }))}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={editingEntity ? handleUpdateEntity : handleCreateEntity}
                disabled={!formData.name.trim()}
              >
                {editingEntity ? 'Modifier' : 'Créer'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entities List */}
      {entities.length === 0 && !showForm ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-gray-500 mb-4">Aucune entité légale trouvée</div>
            <Button onClick={() => setShowForm(true)}>
              Créer votre première entité
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {entities.map((entity) => (
            <Card
              key={entity.id}
              className={cn(
                'cursor-pointer transition-all duration-200',
                'hover:shadow-md hover:border-blue-300',
                selectedEntity?.id === entity.id && 'border-blue-500 bg-blue-50'
              )}
              onClick={() => onEntitySelect?.(entity)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {getEntityIcon(entity.type)}
                      {entity.name}
                    </CardTitle>
                    <div className="text-sm text-gray-600 mt-1">
                      <Badge variant="outline" className="mr-2">
                        {getEntityTypeLabel(entity.type)}
                      </Badge>
                      {entity.properties_count !== undefined && (
                        <span>{entity.properties_count} bien(s)</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditEntity(entity);
                      }}
                      title="Modifier"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEntity(entity);
                      }}
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-2">
                  {entity.incorporation_date && (
                    <div className="text-xs text-gray-500">
                      Constituée le: {new Date(entity.incorporation_date).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    Créée le: {new Date(entity.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}