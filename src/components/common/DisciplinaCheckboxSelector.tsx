'use client';

/**
 * Seletor de disciplinas com checkboxes.
 * Wrapper do CheckboxSelector para disciplinas.
 */

import { useState, useEffect, useMemo } from 'react';
import { MenuBook } from '@mui/icons-material';
import { disciplinaService } from '@/services/firestore';
import { Disciplina } from '@/types';
import { CheckboxSelector, CheckboxOption } from './CheckboxSelector';

interface DisciplinaCheckboxSelectorProps {
  selected: string[];
  onChange: (disciplinaIds: string[]) => void;
  turmaId?: string;
  groupByParent?: boolean;
  columns?: 1 | 2 | 3;
  disabled?: boolean;
  minSelection?: number;
  helperText?: string;
}

export function DisciplinaCheckboxSelector({
  selected,
  onChange,
  turmaId,
  groupByParent = false,
  columns = 2,
  disabled = false,
  minSelection,
  helperText,
}: DisciplinaCheckboxSelectorProps) {
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const loadDisciplinas = async () => {
      setLoading(true);
      setError(undefined);
      try {
        let data: Disciplina[];
        if (turmaId) {
          data = await disciplinaService.getSelectableByTurma(turmaId);
        } else {
          data = await disciplinaService.getSelectable();
        }
        setDisciplinas(data);
      } catch (err) {
        console.error('Erro ao carregar disciplinas:', err);
        setError('Erro ao carregar disciplinas');
      } finally {
        setLoading(false);
      }
    };

    loadDisciplinas();
  }, [turmaId]);

  // Converter disciplinas em opcoes
  const options: CheckboxOption<Disciplina>[] = useMemo(() => {
    return disciplinas.map((d) => {
      // Buscar nome do grupo pai se existir
      let groupName: string | undefined;
      if (groupByParent && d.parentId) {
        const parent = disciplinas.find((p) => p.id === d.parentId);
        groupName = parent?.nome;
      }

      return {
        id: d.id,
        label: d.nome,
        description: d.codigo ? `Codigo: ${d.codigo}` : undefined,
        group: groupName,
        icon: <MenuBook fontSize="small" />,
        data: d,
      };
    });
  }, [disciplinas, groupByParent]);

  return (
    <CheckboxSelector
      options={options}
      selected={selected}
      onChange={onChange}
      columns={columns}
      loading={loading}
      error={error}
      disabled={disabled}
      groupBy={groupByParent}
      searchPlaceholder="Buscar disciplina..."
      minSelection={minSelection}
      helperText={helperText}
      size="small"
    />
  );
}
