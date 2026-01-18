'use client';

/**
 * Seletor de turmas com checkboxes.
 * Wrapper do CheckboxSelector para turmas.
 */

import { useState, useEffect, useMemo } from 'react';
import { Class } from '@mui/icons-material';
import { turmaService } from '@/services/firestore';
import { Turma } from '@/types';
import { CheckboxSelector, CheckboxOption } from './CheckboxSelector';

interface TurmaCheckboxSelectorProps {
  selected: string[];
  onChange: (turmaIds: string[]) => void;
  ano?: number;
  groupBy?: 'serie' | 'turno';
  columns?: 1 | 2 | 3;
  disabled?: boolean;
  minSelection?: number;
  helperText?: string;
}

export function TurmaCheckboxSelector({
  selected,
  onChange,
  ano,
  groupBy,
  columns = 2,
  disabled = false,
  minSelection,
  helperText,
}: TurmaCheckboxSelectorProps) {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const loadTurmas = async () => {
      setLoading(true);
      setError(undefined);
      try {
        let data: Turma[];
        if (ano) {
          data = await turmaService.getByAno(ano);
        } else {
          const all = await turmaService.getAll();
          data = all.filter(t => t.ativo !== false);
        }
        setTurmas(data);
      } catch (err) {
        console.error('Erro ao carregar turmas:', err);
        setError('Erro ao carregar turmas');
      } finally {
        setLoading(false);
      }
    };

    loadTurmas();
  }, [ano]);

  // Converter turmas em opcoes
  const options: CheckboxOption<Turma>[] = useMemo(() => {
    return turmas.map((t) => {
      // Determinar grupo baseado no prop groupBy
      let groupName: string | undefined;
      if (groupBy === 'serie') {
        groupName = t.serie;
      } else if (groupBy === 'turno') {
        groupName = t.turno;
      }

      return {
        id: t.id,
        label: t.nome,
        description: `${t.serie} - ${t.turno}`,
        group: groupName,
        icon: <Class fontSize="small" />,
        data: t,
      };
    });
  }, [turmas, groupBy]);

  return (
    <CheckboxSelector
      options={options}
      selected={selected}
      onChange={onChange}
      columns={columns}
      loading={loading}
      error={error}
      disabled={disabled}
      groupBy={!!groupBy}
      searchPlaceholder="Buscar turma..."
      minSelection={minSelection}
      helperText={helperText}
      size="small"
    />
  );
}
