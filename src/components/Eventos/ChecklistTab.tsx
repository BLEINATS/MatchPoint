import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Evento } from '../../types';
import Button from '../Forms/Button';
import Input from '../Forms/Input';
import { Check, Plus, Trash2 } from 'lucide-react';

interface ChecklistTabProps {
  evento: Evento;
  setEvento: React.Dispatch<React.SetStateAction<Evento | null>>;
}

const ChecklistTab: React.FC<ChecklistTabProps> = ({ evento, setEvento }) => {
  const [newTask, setNewTask] = useState('');

  const toggleTask = (taskId: string) => {
    setEvento(prev => {
      if (!prev) return null;
      return {
        ...prev,
        checklist: prev.checklist.map(task =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        ),
      };
    });
  };

  const addTask = () => {
    if (newTask.trim() === '') return;
    setEvento(prev => {
      if (!prev) return null;
      const newTaskObj = { id: `task_${Date.now()}`, text: newTask, completed: false };
      return { ...prev, checklist: [...prev.checklist, newTaskObj] };
    });
    setNewTask('');
  };
  
  const removeTask = (taskId: string) => {
    setEvento(prev => {
      if (!prev) return null;
      return { ...prev, checklist: prev.checklist.filter(task => task.id !== taskId) };
    });
  };

  const completedTasks = evento.checklist.filter(t => t.completed).length;
  const totalTasks = evento.checklist.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-md p-6 border border-brand-gray-200 dark:border-brand-gray-700">
      <h3 className="text-xl font-semibold mb-4">Checklist do Evento</h3>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400">Progresso</span>
            <span className="text-sm font-medium text-brand-gray-800 dark:text-brand-gray-200">{completedTasks} de {totalTasks} concluídas</span>
        </div>
        <div className="w-full bg-brand-gray-200 dark:bg-brand-gray-700 rounded-full h-2.5">
          <motion.div
            className="bg-green-500 h-2.5 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {evento.checklist.map((task, index) => (
          <motion.div
            key={task.id}
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ delay: index * 0.05 }}
            className={`flex items-center justify-between p-3 rounded-lg transition-colors ${task.completed ? 'bg-green-50 dark:bg-green-900/30' : 'bg-brand-gray-50 dark:bg-brand-gray-900/50'}`}
          >
            <div className="flex items-center">
              <button
                onClick={() => toggleTask(task.id)}
                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center mr-3 flex-shrink-0 ${task.completed ? 'bg-green-500 border-green-500' : 'border-brand-gray-300 dark:border-brand-gray-600'}`}
              >
                {task.completed && <Check className="w-4 h-4 text-white" />}
              </button>
              <span className={`text-sm ${task.completed ? 'line-through text-brand-gray-500' : 'text-brand-gray-800 dark:text-brand-gray-200'}`}>
                {task.text}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => removeTask(task.id)} className="text-brand-gray-400 hover:text-red-500 p-1">
                <Trash2 className="h-4 w-4" />
            </Button>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Adicionar nova tarefa..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
          className="flex-grow"
        />
        <Button onClick={addTask}>
          <Plus className="h-4 w-4 mr-2" /> Adicionar
        </Button>
      </div>
    </div>
  );
};

export default ChecklistTab;
