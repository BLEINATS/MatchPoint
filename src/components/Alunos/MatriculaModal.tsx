import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, UserPlus, Trash2, Search, GraduationCap, User } from 'lucide-react';
import { Aluno, PlanoAula } from '../../types';
import Button from '../Forms/Button';
import Input from '../Forms/Input';
import ConfirmationModal from '../Shared/ConfirmationModal';
import { useToast } from '../../context/ToastContext';
import { localApi } from '../../lib/localApi';
import AssignPlanModal from './AssignPlanModal';

interface MatriculaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (studentIds: string[]) => void;
  allAlunos: Aluno[];
  enrolledStudentIds: string[];
  capacity: number;
  planos: PlanoAula[];
  onDataChange: () => void;
}

const MatriculaModal: React.FC<MatriculaModalProps> = ({ isOpen, onClose, onSave, allAlunos, enrolledStudentIds, capacity, planos, onDataChange }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [studentToAssignPlan, setStudentToAssignPlan] = useState<Aluno | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isAssignPlanModalOpen, setIsAssignPlanModalOpen] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(enrolledStudentIds);
      setSearchTerm('');
    }
  }, [isOpen, enrolledStudentIds]);

  const isAlunoComPlano = (aluno: Aluno): boolean => {
    return !!(aluno.plan_name && aluno.plan_name.trim() !== '' && aluno.plan_name.toLowerCase() !== 'avulso');
  };

  const enrolledAlunos = useMemo(() => {
    return allAlunos.filter(a => selectedIds.includes(a.id));
  }, [selectedIds, allAlunos]);

  const availableAlunos = useMemo(() => {
    return allAlunos
      .filter(a => 
        !selectedIds.includes(a.id) && 
        a.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const aIsAluno = isAlunoComPlano(a);
        const bIsAluno = isAlunoComPlano(b);
        if (aIsAluno && !bIsAluno) return -1;
        if (!aIsAluno && bIsAluno) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [selectedIds, allAlunos, searchTerm]);

  const handleAdd = (aluno: Aluno) => {
    if (selectedIds.length >= capacity) {
      addToast({ message: 'A capacidade máxima para este horário foi atingida.', type: 'error' });
      return;
    }
    
    if (isAlunoComPlano(aluno)) {
      setSelectedIds(prev => [...prev, aluno.id]);
    } else {
      setStudentToAssignPlan(aluno);
      setIsConfirmOpen(true);
    }
  };

  const handleRemove = (alunoId: string) => {
    setSelectedIds(prev => prev.filter(id => id !== alunoId));
  };

  const handleSave = () => {
    onSave(selectedIds);
    onClose();
  };

  const handleAssignAndEnroll = async (planoId: string) => {
    if (!studentToAssignPlan || !studentToAssignPlan.arena_id) return;

    const plano = planos.find(p => p.id === planoId);
    if (!plano) {
      addToast({ message: 'Plano selecionado não encontrado.', type: 'error' });
      return;
    }

    const updatedAluno: Aluno = {
      ...studentToAssignPlan,
      plan_name: plano.name,
      monthly_fee: plano.price,
    };

    try {
      await localApi.upsert('alunos', [updatedAluno], studentToAssignPlan.arena_id);
      
      setSelectedIds(prev => [...prev, studentToAssignPlan.id]);
      
      addToast({ message: `${studentToAssignPlan.name} agora é um aluno e foi matriculado!`, type: 'success' });
      
      setIsAssignPlanModalOpen(false);
      setStudentToAssignPlan(null);
      
      onDataChange();

    } catch (error: any) {
      addToast({ message: `Erro ao atribuir plano: ${error.message}`, type: 'error' });
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[60]" onClick={onClose}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-3xl shadow-xl flex flex-col max-h-[80vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
                <h3 className="text-xl font-semibold">Gerenciar Alunos da Aula</h3>
                <Button variant="ghost" size="sm" onClick={onClose}><X className="h-5 w-5" /></Button>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
                <div className="space-y-4">
                  <h4 className="font-semibold">Adicionar Aluno</h4>
                  <Input 
                    placeholder="Buscar por nome..." 
                    icon={<Search className="h-4 w-4 text-brand-gray-400" />}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {availableAlunos.map(aluno => (
                      <div key={`avail-${aluno.id}`} className="flex items-center justify-between p-2 rounded-md bg-brand-gray-50 dark:bg-brand-gray-800/50">
                        <div className="flex items-center gap-2">
                          <span>{aluno.name}</span>
                          {isAlunoComPlano(aluno) ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 flex items-center gap-1">
                              <GraduationCap className="h-3 w-3" /> Aluno
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 flex items-center gap-1">
                              <User className="h-3 w-3" /> Cliente
                            </span>
                          )}
                        </div>
                        <Button size="sm" onClick={() => handleAdd(aluno)} disabled={selectedIds.length >= capacity}>
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold">Alunos Matriculados ({selectedIds.length}/{capacity})</h4>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
                    {enrolledAlunos.map(aluno => (
                      <div key={`enrolled-${aluno.id}`} className="flex items-center justify-between p-2 rounded-md bg-blue-50 dark:bg-blue-900/50">
                         <div className="flex items-center gap-2">
                          <span>{aluno.name}</span>
                          {isAlunoComPlano(aluno) ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 flex items-center gap-1">
                              <GraduationCap className="h-3 w-3" /> Aluno
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 flex items-center gap-1">
                              <User className="h-3 w-3" /> Cliente
                            </span>
                          )}
                        </div>
                        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleRemove(aluno.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-end gap-3">
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}><Save className="h-4 w-4 mr-2"/> Salvar Alunos</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setStudentToAssignPlan(null);
        }}
        onConfirm={() => {
          setIsConfirmOpen(false);
          setIsAssignPlanModalOpen(true);
        }}
        title="Atribuir Plano de Aulas?"
        message={
          <p>
            <strong>{studentToAssignPlan?.name}</strong> é um cliente avulso. Para matriculá-lo na turma, você precisa primeiro atribuir um plano de aulas a ele. Deseja fazer isso agora?
          </p>
        }
        confirmText="Sim, Atribuir Plano"
        cancelText="Cancelar"
        icon={<GraduationCap className="h-10 w-10 text-brand-blue-500" />}
      />
      <AssignPlanModal
        isOpen={isAssignPlanModalOpen}
        onClose={() => {
          setIsAssignPlanModalOpen(false);
          setStudentToAssignPlan(null);
        }}
        onConfirm={(planoId) => handleAssignAndEnroll(planoId)}
        alunoName={studentToAssignPlan?.name || ''}
        planos={planos}
      />
    </>
  );
};

export default MatriculaModal;
