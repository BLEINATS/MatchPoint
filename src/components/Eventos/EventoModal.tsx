import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User, Calendar, Clock, Users, DollarSign, Plus, Trash2, Info, Home, AlertTriangle } from 'lucide-react';
import { Evento, Quadra, EventoTipoPrivado, EventoStatus, Reserva, PricingRule } from '../../types';
import Button from '../Forms/Button';
import Input from '../Forms/Input';
import { format, parse, isSameDay, isBefore, eachDayOfInterval, getDay, addDays } from 'date-fns';
import { maskPhone } from '../../utils/masks';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';
import { ToggleSwitch } from '../Gamification/ToggleSwitch';

interface EventoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (evento: Omit<Evento, 'id' | 'arena_id' | 'created_at'> | Evento) => void;
  initialData: Evento | null;
  quadras: Quadra[];
  reservas: Reserva[];
}

const timeToMinutes = (timeStr: string): number => {
  if (!timeStr || !timeStr.includes(':')) return -1;
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return -1;
    return hours * 60 + minutes;
  } catch (e) {
    return -1;
  }
};

const findMatchingRule = (
  rules: PricingRule[], date: Date, startTime: string
): PricingRule | null => {
  const reservationDay = getDay(date);
  const reservationStartTimeMinutes = timeToMinutes(startTime);

  const applicableRules = rules.filter(rule => {
    const ruleStartMinutes = timeToMinutes(rule.start_time);
    let ruleEndMinutes = timeToMinutes(rule.end_time);
    if (ruleEndMinutes === 0 && rule.end_time === '00:00') {
      ruleEndMinutes = 24 * 60;
    }

    let match = false;
    if (ruleStartMinutes < ruleEndMinutes) {
      match = reservationStartTimeMinutes >= ruleStartMinutes && reservationStartTimeMinutes < ruleEndMinutes;
    } else { // Overnight rule
      match = reservationStartTimeMinutes >= ruleStartMinutes || reservationStartTimeMinutes < ruleEndMinutes;
    }
    
    return rule.is_active &&
      rule.days_of_week.includes(reservationDay) &&
      match;
  });

  const specificRule = applicableRules.find(r => !r.is_default);
  const defaultRule = applicableRules.find(r => r.is_default);

  return specificRule || defaultRule || null;
};

const EventoModal: React.FC<EventoModalProps> = ({ isOpen, onClose, onSave, initialData, quadras, reservas }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'festa' as EventoTipoPrivado,
    status: 'orcamento' as EventoStatus,
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    startTime: '18:00',
    endTime: '23:00',
    courtStartTime: '19:00',
    courtEndTime: '20:00',
    expectedGuests: 50,
    chargePerGuest: false,
    pricePerGuest: '0,00',
    quadras_ids: [] as string[],
    additionalSpaces: [] as string[],
    services: [] as { name: string; price: string; included: boolean }[],
    depositValue: '',
    discount: '',
    paymentConditions: '50% de sinal, restante no dia do evento.',
    notes: '',
  });
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  const isEditing = !!initialData;

  const courtCost = useMemo(() => {
    if (!formData.quadras_ids.length || !formData.startDate || !formData.endDate || !formData.courtStartTime || !formData.courtEndTime) {
        return 0;
    }

    const start = parse(formData.courtStartTime, 'HH:mm', new Date());
    let end = parse(formData.courtEndTime, 'HH:mm', new Date());
    if (end <= start) end = addDays(end, 1);

    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (durationHours <= 0) return 0;

    const eventDays = eachDayOfInterval({
        start: parseDateStringAsLocal(formData.startDate),
        end: parseDateStringAsLocal(formData.endDate)
    });

    let totalCost = 0;

    for (const day of eventDays) {
        for (const quadraId of formData.quadras_ids) {
            const quadra = quadras.find(q => q.id === quadraId);
            if (!quadra || !quadra.pricing_rules) continue;

            const rule = findMatchingRule(quadra.pricing_rules, day, formData.courtStartTime);
            const pricePerHour = rule ? rule.price_single : 0;
            totalCost += pricePerHour * durationHours;
        }
    }

    return totalCost;
  }, [formData.quadras_ids, formData.startDate, formData.endDate, formData.courtStartTime, formData.courtEndTime, quadras]);

  const servicesCost = useMemo(() => {
    return formData.services.reduce((sum, service) => {
        const price = parseFloat(String(service.price).replace(',', '.')) || 0;
        return sum + (service.included ? price : 0);
    }, 0);
  }, [formData.services]);

  const guestCost = useMemo(() => {
    if (!formData.chargePerGuest) return 0;
    const pricePerGuest = parseFloat(String(formData.pricePerGuest).replace(',', '.')) || 0;
    return (formData.expectedGuests || 0) * pricePerGuest;
  }, [formData.chargePerGuest, formData.pricePerGuest, formData.expectedGuests]);

  const subtotal = useMemo(() => {
      return courtCost + servicesCost + guestCost;
  }, [courtCost, servicesCost, guestCost]);

  const depositAmount = useMemo(() => parseFloat(String(formData.depositValue).replace(',', '.')) || 0, [formData.depositValue]);

  const balanceDue = useMemo(() => {
    const discount = parseFloat(String(formData.discount).replace(',', '.')) || 0;
    return subtotal - discount - depositAmount;
  }, [subtotal, formData.discount, depositAmount]);

  useEffect(() => {
    if (!isOpen) {
      setConflictWarning(null);
      return;
    }
  
    const checkConflicts = () => {
      const { quadras_ids, startDate: startDateStr, endDate: endDateStr } = formData;
      const startTime = formData.courtStartTime || formData.startTime;
      const endTime = formData.courtEndTime || formData.endTime;
  
      if (!quadras_ids.length || !startDateStr || !endDateStr || !startTime || !endTime) {
        setConflictWarning(null);
        return;
      }
  
      const startDate = parseDateStringAsLocal(startDateStr);
      const endDate = parseDateStringAsLocal(endDateStr);
  
      if (isBefore(endDate, startDate)) {
        setConflictWarning("A data de fim não pode ser anterior à data de início.");
        return;
      }
  
      const newEventStartMinutes = timeToMinutes(startTime);
      const newEventEndMinutes = timeToMinutes(endTime);
      if (newEventStartMinutes === -1 || newEventEndMinutes === -1 || newEventStartMinutes >= newEventEndMinutes) {
        setConflictWarning(null);
        return;
      }
  
      const eventDays = eachDayOfInterval({ start: startDate, end: endDate });
  
      for (const day of eventDays) {
        const dayOfWeek = getDay(day);
  
        for (const existingReserva of reservas) {
          if (isEditing && existingReserva.evento_id === initialData?.id) continue;
          if (existingReserva.status === 'cancelada') continue;
  
          let isConflictDay = false;
          if (existingReserva.isRecurring) {
            const masterDate = parseDateStringAsLocal(existingReserva.date);
            const recurrenceEndDate = existingReserva.recurringEndDate ? parseDateStringAsLocal(existingReserva.recurringEndDate) : null;
            if ((getDay(masterDate) === dayOfWeek) && !isBefore(day, masterDate) && (!recurrenceEndDate || !isAfter(day, recurrenceEndDate))) {
              isConflictDay = true;
            }
          } else {
            if (isSameDay(parseDateStringAsLocal(existingReserva.date), day)) {
              isConflictDay = true;
            }
          }
  
          if (isConflictDay) {
            const overlapsQuadra = quadraIds.includes(existingReserva.quadra_id);
            if (overlapsQuadra) {
              const existingStartMinutes = timeToMinutes(existingReserva.start_time);
              const existingEndMinutes = timeToMinutes(existingReserva.end_time);
  
              if (existingStartMinutes !== -1 && existingEndMinutes !== -1 && newEventStartMinutes < existingEndMinutes && newEventEndMinutes > existingStartMinutes) {
                const quadra = quadras.find(q => q.id === existingReserva.quadra_id);
                setConflictWarning(`Conflito em ${format(day, 'dd/MM')}: A quadra "${quadra?.name}" já tem uma reserva (${existingReserva.clientName}) das ${existingReserva.start_time} às ${existingReserva.end_time}.`);
                return;
              }
            }
          }
        }
      }
  
      setConflictWarning(null);
    };
  
    checkConflicts();
  }, [formData.quadras_ids, formData.startDate, formData.endDate, formData.startTime, formData.endTime, formData.courtStartTime, formData.courtEndTime, reservas, quadras, isEditing, initialData?.id, isOpen]);


  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setFormData({
        name: initialData.name,
        type: initialData.type,
        status: initialData.status,
        clientName: initialData.clientName,
        clientPhone: initialData.clientPhone,
        clientEmail: initialData.clientEmail,
        startDate: initialData.startDate,
        endDate: initialData.endDate,
        startTime: initialData.startTime,
        endTime: initialData.endTime,
        courtStartTime: initialData.courtStartTime || initialData.startTime,
        courtEndTime: initialData.courtEndTime || initialData.endTime,
        expectedGuests: initialData.expectedGuests,
        chargePerGuest: initialData.chargePerGuest || false,
        pricePerGuest: String(initialData.pricePerGuest || '0').replace('.', ','),
        quadras_ids: initialData.quadras_ids,
        additionalSpaces: initialData.additionalSpaces || [],
        services: initialData.services.map(s => ({ ...s, price: String(s.price).replace('.', ',') })),
        depositValue: String(initialData.depositValue || '').replace('.', ','),
        discount: String(initialData.discount || '').replace('.', ','),
        paymentConditions: initialData.paymentConditions,
        notes: initialData.notes,
      });
    } else {
      setFormData({
        name: '', type: 'festa', status: 'orcamento',
        clientName: '', clientPhone: '', clientEmail: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        startTime: '18:00', endTime: '23:00',
        courtStartTime: '19:00', courtEndTime: '20:00',
        expectedGuests: 50,
        chargePerGuest: false,
        pricePerGuest: '0,00',
        quadras_ids: [], additionalSpaces: [],
        services: [
            { name: 'Limpeza Básica', price: '150,00', included: true },
            { name: 'Segurança (1)', price: '200,00', included: true },
        ],
        depositValue: '',
        discount: '',
        paymentConditions: '50% de sinal, restante no dia do evento.',
        notes: '',
      });
    }
  }, [initialData, isOpen]);

  const handleSave = () => {
    if (conflictWarning) {
      alert(conflictWarning);
      return;
    }
    
    const depositAmount = parseFloat(formData.depositValue.replace(',', '.')) || 0;
    
    let updatedPayments = [...(initialData?.payments || [])];
    const depositPaymentId = `deposit_${initialData?.id || 'new_event'}`;
    const existingDepositIndex = updatedPayments.findIndex(p => p.id === depositPaymentId);

    if (depositAmount > 0) {
        const depositPayment = {
            id: depositPaymentId,
            date: existingDepositIndex > -1 ? updatedPayments[existingDepositIndex].date : new Date().toISOString(),
            amount: depositAmount,
            method: 'Sinal',
        };
        if (existingDepositIndex > -1) {
            updatedPayments[existingDepositIndex] = depositPayment;
        } else {
            updatedPayments.push(depositPayment);
        }
    } else if (existingDepositIndex > -1) {
        updatedPayments.splice(existingDepositIndex, 1);
    }
    
    const dataToSave = { 
      ...formData, 
      totalValue: subtotal,
      pricePerGuest: parseFloat(formData.pricePerGuest.replace(',', '.')) || 0,
      services: formData.services.map(s => ({
          ...s,
          price: parseFloat(s.price.replace(',', '.')) || 0,
      })),
      depositValue: depositAmount,
      discount: parseFloat(formData.discount.replace(',', '.')) || 0,
      payments: updatedPayments,
    };
    
    if (isEditing && initialData) {
      onSave({ ...initialData, ...dataToSave });
    } else {
      onSave(dataToSave);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'additionalSpaces') {
        setFormData(prev => ({ ...prev, additionalSpaces: value.split(',').map(s => s.trim()) }));
        return;
    }

    if (name === 'expectedGuests') {
        setFormData(prev => ({ ...prev, expectedGuests: Number(value) }));
        return;
    }

    let finalValue = value;
    if (name === 'clientPhone') {
      finalValue = maskPhone(value);
    }
    
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };
  
  const handleServiceChange = (index: number, field: 'name' | 'price' | 'included', value: string | boolean) => {
    const newServices = [...formData.services];
    (newServices[index] as any)[field] = value;
    setFormData(p => ({ ...p, services: newServices }));
  };

  const addService = () => {
    setFormData(p => ({ ...p, services: [...p.services, { name: '', price: '0,00', included: false }] }));
  };
  
  const removeService = (index: number) => {
    setFormData(p => ({ ...p, services: p.services.filter((_, i) => i !== index) }));
  };

  const handleQuadraToggle = (quadraId: string) => {
    setFormData(prev => ({
      ...prev,
      quadras_ids: prev.quadras_ids.includes(quadraId)
        ? prev.quadras_ids.filter(id => id !== quadraId)
        : [...prev.quadras_ids, quadraId]
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-brand-gray-900 rounded-lg w-full max-w-4xl shadow-xl flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
              <h3 className="text-xl font-semibold text-brand-gray-900 dark:text-white">
                {isEditing ? `Orçamento: ${formData.name}` : 'Novo Orçamento de Evento'}
              </h3>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                <X className="h-5 w-5 text-brand-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Seção Cliente e Evento */}
              <Section title="Cliente e Evento">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Nome do Evento" name="name" value={formData.name} onChange={handleChange} placeholder="Aniversário da Maria" required />
                  <FormSelect label="Tipo de Evento" name="type" value={formData.type} onChange={handleChange} options={['festa', 'corporativo', 'aniversario', 'show', 'outro']} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input label="Nome do Cliente" name="clientName" value={formData.clientName} onChange={handleChange} required />
                  <Input label="E-mail do Cliente" name="clientEmail" type="email" value={formData.clientEmail} onChange={handleChange} />
                  <Input label="Telefone do Cliente" name="clientPhone" value={formData.clientPhone} onChange={handleChange} />
                </div>
              </Section>
              
              {/* Seção Data e Espaços */}
              <Section title="Data e Espaços">
                <p className="text-sm -mt-2 text-brand-gray-500 dark:text-brand-gray-400">Selecione data, hora e os espaços necessários para o evento. A reserva de quadras é opcional.</p>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Input label="Data de Início" name="startDate" type="date" value={formData.startDate} onChange={handleChange} />
                    <Input label="Data de Fim" name="endDate" type="date" value={formData.endDate} onChange={handleChange} />
                    <Input label="Início do Evento" name="startTime" type="time" value={formData.startTime} onChange={handleChange} />
                    <Input label="Fim do Evento" name="endTime" type="time" value={formData.endTime} onChange={handleChange} />
                 </div>
                 <Input label="Nº de Convidados" name="expectedGuests" type="number" value={formData.expectedGuests.toString()} onChange={handleChange} />
                 <div>
                    <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-2">Quadras a serem utilizadas (Opcional)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {quadras.length > 0 ? (
                            quadras.map(quadra => (
                                <label key={quadra.id} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${formData.quadras_ids.includes(quadra.id) ? 'bg-blue-50 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700' : 'bg-white dark:bg-brand-gray-800 border-brand-gray-200 dark:border-brand-gray-700'}`}>
                                <input type="checkbox" checked={formData.quadras_ids.includes(quadra.id)} onChange={() => handleQuadraToggle(quadra.id)} className="h-4 w-4 rounded text-brand-blue-600 border-brand-gray-300 focus:ring-brand-blue-500" />
                                <span className="ml-3 text-sm font-medium text-brand-gray-800 dark:text-brand-gray-200">{quadra.name}</span>
                                </label>
                            ))
                        ) : (
                            <div className="col-span-full text-center text-sm text-brand-gray-500 py-4 px-2 bg-brand-gray-50 dark:bg-brand-gray-800/50 rounded-lg">
                                Nenhuma quadra cadastrada. Vá para a seção de <Link to="/quadras" className="text-brand-blue-500 hover:underline font-medium">Quadras</Link> para adicionar uma.
                            </div>
                        )}
                    </div>
                 </div>
                 {formData.quadras_ids.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg border border-blue-200 dark:border-blue-800">
                        <Input 
                        label="Início Reserva da Quadra" 
                        name="courtStartTime" 
                        type="time" 
                        value={formData.courtStartTime} 
                        onChange={handleChange} 
                        icon={<Clock className="h-4 w-4 text-brand-gray-400"/>} 
                        />
                        <Input 
                        label="Fim Reserva da Quadra" 
                        name="courtEndTime" 
                        type="time" 
                        value={formData.courtEndTime} 
                        onChange={handleChange} 
                        icon={<Clock className="h-4 w-4 text-brand-gray-400"/>} 
                        />
                    </div>
                  )}
                 {conflictWarning && (
                    <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                        <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Atenção: Horário Indisponível</h3>
                            <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                            <p>{conflictWarning}</p>
                            </div>
                        </div>
                        </div>
                    </div>
                )}
                 <Input 
                    label="Outros Espaços (separar por vírgula)" 
                    name="additionalSpaces" 
                    value={formData.additionalSpaces.join(', ')} 
                    onChange={handleChange}
                    placeholder="Churrasqueira, Salão de Festas"
                    icon={<Home className="h-4 w-4 text-brand-gray-400" />}
                />
              </Section>

              {/* Seção Orçamento */}
              <Section title="Orçamento e Serviços">
                <div className="flex items-center justify-between p-3 bg-brand-gray-50 dark:bg-brand-gray-800/50 rounded-lg">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-brand-gray-500" />
                    <label htmlFor="charge-per-guest" className="text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">Cobrar por convidado?</label>
                  </div>
                  <ToggleSwitch enabled={formData.chargePerGuest} setEnabled={(val) => setFormData(p => ({ ...p, chargePerGuest: val }))} />
                </div>
                {formData.chargePerGuest && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <Input label="Valor por Convidado (R$)" name="pricePerGuest" type="text" inputMode="decimal" value={formData.pricePerGuest} onChange={handleChange} />
                  </motion.div>
                )}

                <div className="space-y-2">
                  {formData.services.map((service, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-6">
                        <Input placeholder="Nome do serviço" value={service.name} onChange={(e) => handleServiceChange(index, 'name', e.target.value)} />
                      </div>
                      <div className="col-span-3">
                        <Input type="text" inputMode="decimal" placeholder="Preço" value={service.price} onChange={(e) => handleServiceChange(index, 'price', e.target.value)} />
                      </div>
                      <div className="col-span-2 flex items-center justify-center">
                        <input type="checkbox" title="Serviço incluso no pacote?" checked={service.included} onChange={(e) => handleServiceChange(index, 'included', e.target.checked)} className="form-checkbox h-5 w-5 rounded text-brand-blue-600" />
                      </div>
                      <div className="col-span-1">
                        <Button variant="ghost" size="sm" onClick={() => removeService(index)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={addService}><Plus className="h-4 w-4 mr-2" /> Adicionar Serviço</Button>
                
                <div className="p-4 rounded-lg bg-brand-gray-50 dark:bg-brand-gray-800 space-y-3 border border-brand-gray-200 dark:border-brand-gray-700">
                    <div className="flex justify-between items-center text-sm"><span className="text-brand-gray-600 dark:text-brand-gray-400">Custo das Quadras</span><span className="font-medium text-brand-gray-800 dark:text-white">{formatCurrency(courtCost)}</span></div>
                    {guestCost > 0 && <div className="flex justify-between items-center text-sm"><span className="text-brand-gray-600 dark:text-brand-gray-400">Custo por Convidados</span><span className="font-medium text-brand-gray-800 dark:text-white">{formatCurrency(guestCost)}</span></div>}
                    <div className="flex justify-between items-center text-sm"><span className="text-brand-gray-600 dark:text-brand-gray-400">Custo dos Serviços</span><span className="font-medium text-brand-gray-800 dark:text-white">{formatCurrency(servicesCost)}</span></div>
                    <div className="flex justify-between items-center text-sm font-semibold pt-2 border-t border-brand-gray-200 dark:border-brand-gray-700"><span className="text-brand-gray-700 dark:text-brand-gray-300">Subtotal</span><span className="text-brand-gray-900 dark:text-white">{formatCurrency(subtotal)}</span></div>
                    <div className="flex justify-between items-center text-sm"><label htmlFor="discount" className="text-brand-gray-600 dark:text-brand-gray-400">Desconto (R$)</label><Input id="discount" name="discount" type="text" inputMode="decimal" value={formData.discount} onChange={handleChange} className="!w-28 !text-right !py-1" placeholder="0,00" /></div>
                    <div className="flex justify-between font-bold text-xl text-brand-gray-800 dark:text-white pt-3 border-t-2 border-brand-gray-300 dark:border-brand-gray-600"><span className="text-brand-gray-800 dark:text-white">Saldo Devedor:</span><span className="text-brand-blue-600 dark:text-brand-blue-300">{formatCurrency(balanceDue)}</span></div>
                </div>
              </Section>
              
              <Section title="Pagamento e Observações">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Sinal (R$)" name="depositValue" type="text" inputMode="decimal" value={formData.depositValue} onChange={handleChange} />
                    <Input label="Condições de Pagamento" name="paymentConditions" value={formData.paymentConditions} onChange={handleChange} />
                </div>
                <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Observações e requisitos especiais do cliente..." className="w-full form-textarea rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500" rows={3}></textarea>
              </Section>

              <div className="rounded-lg p-4 bg-blue-50 dark:bg-brand-blue-500/10 border border-blue-200 dark:border-brand-blue-500/20">
                <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center">
                  <Info className="h-4 w-4 mr-2 flex-shrink-0" />
                  Ao mover o evento para "Confirmado" ou "Realizado", os horários das quadras selecionadas serão bloqueados no Hub de Reservas.
                </p>
              </div>
            </div>

            <div className="p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex justify-between items-center">
                <div>
                    <label className="text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mr-2">Status:</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500">
                        <option value="orcamento">Orçamento</option>
                        <option value="pendente">Pendente</option>
                        <option value="confirmado">Confirmado</option>
                        <option value="realizado">Realizado</option>
                        <option value="concluido">Concluído</option>
                        <option value="cancelado">Cancelado</option>
                    </select>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={!!conflictWarning}>
                        <Save className="h-4 w-4 mr-2"/> {isEditing ? 'Salvar Alterações' : 'Criar Orçamento'}
                    </Button>
                </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="border-t border-brand-gray-200 dark:border-brand-gray-700 pt-6">
      <h4 className="text-lg font-semibold text-brand-gray-900 dark:text-white mb-4">{title}</h4>
      <div className="space-y-4">{children}</div>
    </div>
);

const FormSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string, options: string[] }> = ({ label, options, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">{label}</label>
    <select className="w-full form-select rounded-md border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-800 text-brand-gray-900 dark:text-white focus:border-brand-blue-500 focus:ring-brand-blue-500" {...props}>
      {options.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}
    </select>
  </div>
);

export default EventoModal;
