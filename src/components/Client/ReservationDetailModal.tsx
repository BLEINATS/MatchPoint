import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reserva, Quadra, Profile, AtletaAluguel } from '../../types';
import { format, isBefore, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, MapPin, X, ShoppingBag, CreditCard, DollarSign, CheckCircle, AlertTriangle, User, Info, Users, UserPlus, Trash2, Lock, Unlock, MessageSquare, Star as StarIcon, Edit, Handshake } from 'lucide-react';
import { parseDateStringAsLocal } from '../../utils/dateUtils';
import Button from '../Forms/Button';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import ConfirmationModal from '../Shared/ConfirmationModal';
import Alert from '../Shared/Alert';
import Timer from '../Shared/Timer';
import { Link } from 'react-router-dom';

interface ReservationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  reserva: Reserva | null;
  quadra: Quadra | null;
  atleta: AtletaAluguel | null;
  arenaName?: string;
  onCancel: (reserva: Reserva) => void;
  onUpdateParticipantStatus: (reservaId: string, profileId: string, status: 'accepted' | 'declined') => void;
  onUpdateReservation: (reserva: Reserva) => void;
  friends: Profile[];
  onPay: (reserva: Reserva, amount: number, isPartial: boolean) => void;
  onAvaliarAtleta: (reserva: Reserva) => void;
  onContactAtleta: (atleta: AtletaAluguel) => void;
  onTrocarAtleta: (reserva: Reserva) => void;
  onCancelarAtleta: () => void;
  onPayAtleta: (reserva: Reserva, atleta: AtletaAluguel) => void;
  onAthletePaymentExpire: (reserva: Reserva) => void;
}

const ReservationDetailModal: React.FC<ReservationDetailModalProps> = ({ isOpen, onClose, reserva, quadra, atleta, arenaName, onCancel, onUpdateParticipantStatus, onUpdateReservation, friends, onPay, onAvaliarAtleta, onContactAtleta, onTrocarAtleta, onCancelarAtleta, onPayAtleta, onAthletePaymentExpire }) => {
  const { profile } = useAuth();
  const [isAddingFriends, setIsAddingFriends] = useState(false);
  const [isLockConfirmOpen, setIsLockConfirmOpen] = useState(false);
  const [lockAction, setLockAction] = useState<'lock' | 'unlock' | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsAddingFriends(false);
    }
  }, [isOpen]);

  if (!reserva || !quadra) return null;

  const isOrganizer = profile?.id === reserva.profile_id;
  const isAwaitingPayment = reserva.status === 'aguardando_pagamento';
  const isPaymentOverdue = isAwaitingPayment && reserva.payment_deadline && isBefore(new Date(reserva.payment_deadline), new Date());
  const isLocked = reserva.invites_closed === true;
  const isPastReservation = isPast(parseDateStringAsLocal(`${reserva.date}T${reserva.end_time}`));
  const isGroupBooking = useMemo(() => (reserva.participants?.length || 0) > 1, [reserva.participants]);

  const handleCancelClick = () => {
    onClose();
    setTimeout(() => onCancel(reserva), 150);
  };

  const handlePayMyPart = () => {
    if (!profile || !reserva.participants) return;
    const valorPorJogador = (reserva.total_price || 0) / (reserva.participants.filter(p => p.status === 'accepted').length || 1);
    onPay(reserva, valorPorJogador, true);
  };

  const handlePayFullAmount = () => {
    const amountToPay = (reserva.total_price || 0) - (reserva.credit_used || 0);
    onPay(reserva, amountToPay, false);
  };

  const handleAddParticipant = (friend: Profile) => {
    const newParticipant = {
        profile_id: friend.id, name: friend.name, avatar_url: friend.avatar_url,
        status: 'pending' as 'pending', payment_status: 'pendente' as 'pendente',
    };
    const updatedReserva = { ...reserva, participants: [...(reserva.participants || []), newParticipant] };
    onUpdateReservation(updatedReserva);
  };

  const handleRemoveParticipant = (profileIdToRemove: string) => {
    const updatedReserva = { ...reserva, participants: reserva.participants?.filter(p => p.profile_id !== profileIdToRemove) || [] };
    onUpdateReservation(updatedReserva);
  };
  
  const handleToggleLock = () => {
    if (!reserva) return;
    const willBeLocked = !reserva.invites_closed;
    let updatedReserva: Reserva = { ...reserva, invites_closed: willBeLocked };

    if (!willBeLocked) {
        updatedReserva = {
            ...updatedReserva,
            participants: updatedReserva.participants?.map(p => ({ ...p, payment_status: 'pendente' })),
            payment_status: 'pendente'
        };
    }
    onUpdateReservation(updatedReserva);
    setIsLockConfirmOpen(false);
    setLockAction(null);
  };

  const paymentStatus = useMemo(() => {
    switch (reserva.payment_status) {
      case 'pago': return { icon: CheckCircle, color: 'text-green-500', label: 'Pago' };
      case 'parcialmente_pago': return { icon: AlertCircle, color: 'text-blue-500', label: 'Parcialmente Pago' };
      case 'pendente': return { icon: AlertTriangle, color: 'text-yellow-500', label: 'Pendente' };
      default: return { icon: AlertTriangle, color: 'text-brand-gray-400', label: 'N/D' };
    }
  }, [reserva.payment_status]);

  const rentalItemsTotal = useMemo(() => reserva.rented_items?.reduce((acc, item) => acc + item.price * item.quantity, 0) || 0, [reserva.rented_items]);
  const reservationValue = (reserva.total_price || 0) - rentalItemsTotal - (reserva.atleta_cost || 0);
  const currentUserParticipant = reserva.participants?.find(p => p.profile_id === profile?.id);
  const confirmedParticipants = useMemo(() => reserva.participants?.filter(p => p.status === 'accepted') || [], [reserva.participants]);
  const numConfirmed = confirmedParticipants.length;
  const totalInvited = reserva.participants?.length || 1;
  const valorPorJogador = useMemo(() => {
    const totalCost = reserva.total_price || 0;
    const numPayers = isLocked ? Math.max(1, numConfirmed) : Math.max(1, totalInvited);
    return totalCost / numPayers;
  }, [reserva.total_price, numConfirmed, totalInvited, isLocked]);
  
  const amountToPay = (reserva.total_price || 0) - (reserva.credit_used || 0);

  const availableFriendsToInvite = useMemo(() => {
    if (!friends || !reserva.participants) return [];
    const participantIds = new Set(reserva.participants.map(p => p.profile_id));
    return friends.filter(f => !participantIds.has(f.id));
  }, [friends, reserva.participants]);

  const atletaJaAvaliado = useMemo(() => {
    if (!atleta || !profile) return false;
    return atleta.ratings?.some(r => r.reservationId === reserva.id && r.clientId === profile.id);
  }, [atleta, reserva.id, profile]);

  const getAtletaPaymentStatus = () => {
    switch (reserva.atleta_payment_status) {
        case 'pendente_cliente':
            return {
                label: 'Aguardando Pagamento',
                color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
                icon: Clock,
                action: isOrganizer ? () => atleta && onPayAtleta(reserva, atleta) : undefined,
            };
        case 'pendente_repasse':
        case 'pago':
            return {
                label: 'Atleta Pago',
                color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
                icon: CheckCircle,
            };
        default:
            return null;
    }
  };

  const atletaPaymentDisplay = getAtletaPaymentStatus();

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[60]" onClick={onClose}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-white dark:bg-brand-gray-900 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b border-brand-gray-200 dark:border-brand-gray-700">
                <h3 className="text-xl font-bold text-brand-gray-900 dark:text-white">Detalhes da Reserva</h3>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700"><X className="h-5 w-5 text-brand-gray-500" /></button>
              </div>

              <div className="p-4 sm:p-6 space-y-6 overflow-y-auto">
                {isAwaitingPayment && !isPaymentOverdue && (
                  <Alert type="warning" title="Pagamento Pendente" message={<span>Esta reserva expira em <Timer deadline={reserva.payment_deadline!} onExpire={onClose} />. Finalize o pagamento para confirmar.</span>} />
                )}
                {isPaymentOverdue && (<Alert type="error" title="Reserva Expirada" message="O tempo para pagamento desta reserva expirou. Ela foi cancelada." />)}
                
                <div className="space-y-3">
                  <InfoItem icon={MapPin} label="Local" value={`${quadra.name} • ${arenaName}`} />
                  <InfoItem icon={Calendar} label="Data" value={format(parseDateStringAsLocal(reserva.date), "EEEE, dd 'de' MMMM", { locale: ptBR })} />
                  <InfoItem icon={Clock} label="Horário" value={`${reserva.start_time.slice(0, 5)} - ${reserva.end_time.slice(0, 5)}`} />
                </div>

                <div className="border-t border-brand-gray-200 dark:border-brand-gray-700 pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-brand-gray-800 dark:text-white flex items-center"><Users className="h-5 w-5 mr-2 text-brand-blue-500" /> Participantes</h4>
                    {isOrganizer && !isLocked && <Button size="sm" onClick={() => setIsAddingFriends(prev => !prev)}><UserPlus className="h-4 w-4 mr-2"/> {isAddingFriends ? 'Fechar' : 'Adicionar'}</Button>}
                  </div>
                  
                  <AnimatePresence>{isAddingFriends && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 space-y-2 max-h-40 overflow-y-auto pr-2">{availableFriendsToInvite.length > 0 ? availableFriendsToInvite.map(friend => (<div key={friend.id} className="flex items-center justify-between p-2 bg-brand-gray-100 dark:bg-brand-gray-800 rounded-md"><div className="flex items-center gap-3"><img src={friend.avatar_url || `https://avatar.vercel.sh/${friend.id}.svg`} alt={friend.name} className="w-8 h-8 rounded-full object-cover" /><span className="text-sm font-medium">{friend.name}</span></div><Button size="sm" variant="outline" onClick={() => handleAddParticipant(friend)}>Convidar</Button></div>)) : <p className="text-sm text-center text-brand-gray-500 py-4">Nenhum amigo disponível para convidar.</p>}</motion.div>)}</AnimatePresence>

                  <div className="space-y-3">
                    {reserva.participants?.map(p => {
                      const isCurrentUser = p.profile_id === profile?.id;
                      const isParticipantOrganizer = p.profile_id === reserva.profile_id;
                      const canPay = isCurrentUser && p.status === 'accepted' && p.payment_status === 'pendente' && isLocked && !isPaymentOverdue;
                      return (
                        <div key={p.profile_id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 bg-brand-gray-50 dark:bg-brand-gray-800/50 rounded-md gap-2">
                          <div className="flex items-center gap-3"><img src={p.avatar_url || `https://avatar.vercel.sh/${p.profile_id}.svg`} alt={p.name} className="w-8 h-8 rounded-full object-cover" /><div><span className="text-sm font-medium">{p.name}</span>{isParticipantOrganizer && <span className="ml-2 text-xs font-bold text-blue-500 bg-blue-100 dark:bg-blue-900/50 px-1.5 py-0.5 rounded-full">Organizador</span>}</div></div>
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            {canPay ? (<Button size="sm" onClick={handlePayMyPart}>Pagar minha parte</Button>) : (<span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1.5 ${p.payment_status === 'pago' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300'}`}>{p.payment_status === 'pago' ? <CheckCircle className="h-3 w-3"/> : <AlertTriangle className="h-3 w-3"/>}{p.payment_status === 'pago' ? 'Pago' : 'Pendente'}</span>)}
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ p.status === 'accepted' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : p.status === 'declined' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' }`}>{p.status === 'pending' ? 'Pendente' : p.status === 'accepted' ? 'Confirmado' : 'Recusado'}</span>
                            {isOrganizer && !isLocked && !isParticipantOrganizer && <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-100" onClick={() => handleRemoveParticipant(p.profile_id)}><Trash2 className="h-4 w-4"/></Button>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {currentUserParticipant?.status === 'pending' && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/50 rounded-lg text-center">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-3">Você foi convidado para este jogo. Deseja participar?</p>
                    <div className="flex justify-center gap-3"><Button size="sm" onClick={() => onUpdateParticipantStatus(reserva.id, profile!.id, 'accepted')}>Aceitar</Button><Button size="sm" variant="outline" onClick={() => onUpdateParticipantStatus(reserva.id, profile!.id, 'declined')}>Recusar</Button></div>
                  </div>
                )}

                {isOrganizer && !isPastReservation && (!atleta || reserva.atleta_aceite_status === 'recusado') && reserva.status !== 'aguardando_aceite_profissional' && (
                    <Button onClick={() => onTrocarAtleta(reserva)} className="w-full mt-4">
                        <Handshake className="h-4 w-4 mr-2"/>
                        Contratar Atleta
                    </Button>
                )}

                {atleta && reserva.atleta_aceite_status !== 'recusado' && (
                  <div className="border-t border-brand-gray-200 dark:border-brand-gray-700 pt-4">
                    <h4 className="font-semibold text-brand-gray-800 dark:text-white mb-3 flex items-center"><StarIcon className="h-5 w-5 mr-2 text-yellow-500" /> Atleta Contratado</h4>
                    <div className="p-3 bg-brand-gray-50 dark:bg-brand-gray-800/50 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 group">
                          <img src={atleta.avatar_url || `https://avatar.vercel.sh/${atleta.id}.svg`} alt={atleta.name} className="w-10 h-10 rounded-full object-cover" />
                          <div>
                            <p className="font-bold group-hover:underline">{atleta.name}</p>
                            <p className="text-xs text-brand-gray-500">para {reserva.sport_type}</p>
                          </div>
                        </div>
                        {isOrganizer && !isPastReservation && (
                            <div className="flex items-center gap-1">
                                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onTrocarAtleta(reserva); }}><Edit className="h-4 w-4"/></Button>
                                <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-100" onClick={(e) => { e.stopPropagation(); onCancelarAtleta(); }}><Trash2 className="h-4 w-4"/></Button>
                            </div>
                        )}
                        {isOrganizer && isPastReservation && !atletaJaAvaliado && (
                          <Button size="sm" onClick={() => onAvaliarAtleta(reserva)}><StarIcon className="h-4 w-4 mr-1.5"/>Avaliar</Button>
                        )}
                      </div>
                      {reserva.atleta_aceite_status === 'aceito' && (
                        <>
                          {reserva.athlete_payment_deadline && reserva.atleta_payment_status === 'pendente_cliente' && (
                            <Alert type="warning" title="Pagamento do Atleta Pendente" message={<span>O pagamento da taxa do atleta expira em <Timer deadline={reserva.athlete_payment_deadline} onExpire={() => onAthletePaymentExpire(reserva)} />.</span>} />
                          )}
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-brand-gray-600 dark:text-brand-gray-400">Valor do Atleta:</span>
                            <span className="font-medium text-brand-gray-800 dark:text-white">{formatCurrency(reserva.atleta_cost)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-brand-gray-600 dark:text-brand-gray-400">Pagamento:</span>
                            {atletaPaymentDisplay ? (
                                <button
                                    onClick={atletaPaymentDisplay.action}
                                    disabled={!atletaPaymentDisplay.action}
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${atletaPaymentDisplay.color} ${atletaPaymentDisplay.action ? 'hover:brightness-90' : 'cursor-default'}`}
                                >
                                    <atletaPaymentDisplay.icon className="h-3 w-3 mr-1.5" />
                                    {atletaPaymentDisplay.label}
                                </button>
                            ) : null}
                          </div>
                          <div className="flex gap-2 pt-2 border-t border-brand-gray-200 dark:border-brand-gray-700">
                            <Button size="sm" variant="outline" className="w-full" onClick={() => onContactAtleta(atleta)}>
                                <MessageSquare className="h-4 w-4 mr-2"/> Contato
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="border-t border-brand-gray-200 dark:border-brand-gray-700 pt-4 space-y-2">
                  <h4 className="font-semibold text-brand-gray-800 dark:text-white mb-2 flex items-center"><DollarSign className="h-4 w-4 mr-2 text-brand-blue-500" /> Pagamento da Reserva</h4>
                  <div className="flex justify-between text-sm"><span className="text-brand-gray-600 dark:text-brand-gray-400">Valor da Reserva</span><span className="font-medium">{formatCurrency(reservationValue)}</span></div>
                  {rentalItemsTotal > 0 && (<div className="flex justify-between text-sm"><span className="text-brand-gray-600 dark:text-brand-gray-400">Itens Alugados</span><span className="font-medium">+ {formatCurrency(rentalItemsTotal)}</span></div>)}
                  {isGroupBooking && <div className="flex justify-between text-sm"><span className="text-brand-gray-600 dark:text-brand-gray-400">Valor por Jogador</span><div><span className="font-medium">{formatCurrency(valorPorJogador)}</span><span className="text-xs text-brand-gray-500"> ({numConfirmed}/{totalInvited} confirmados)</span></div></div>}
                  {(reserva.credit_used || 0) > 0 && (<div className="flex justify-between items-center text-sm"><span className="text-blue-600 dark:text-blue-400">Crédito Utilizado</span><span className="font-medium text-blue-600 dark:text-blue-400">- {formatCurrency(reserva.credit_used)}</span></div>)}
                  <div className="flex justify-between text-lg font-bold border-t-2 border-brand-gray-300 dark:border-brand-gray-600 pt-2 mt-2"><span className="text-brand-gray-800 dark:text-white">Total</span><span className="text-brand-blue-600 dark:text-brand-blue-300">{formatCurrency(reserva.total_price)}</span></div>
                  
                  {reserva.payment_status === 'pago' ? (
                    <div className="p-3 rounded-md bg-green-50 dark:bg-green-900/50 flex items-center gap-3 border border-green-200 dark:border-green-800 mt-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <p className="text-sm font-medium text-green-800 dark:text-green-300">Pagamento confirmado!</p>
                    </div>
                  ) : (
                    <div className="flex justify-end items-center text-xs mt-1">
                      <paymentStatus.icon className={`h-3 w-3 mr-1 ${paymentStatus.color}`} />
                      <span className={`font-medium ${paymentStatus.color}`}>{paymentStatus.label}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 sm:p-6 mt-auto border-t border-brand-gray-200 dark:border-brand-gray-700 flex flex-col sm:flex-row justify-between gap-3">
                {isOrganizer && (
                  isLocked ? (
                    <Button variant="outline" onClick={() => { setLockAction('unlock'); setIsLockConfirmOpen(true); }}><Unlock className="h-4 w-4 mr-2"/>Reabrir Convites</Button>
                  ) : (
                    <Button onClick={() => { setLockAction('lock'); setIsLockConfirmOpen(true); }}><Lock className="h-4 w-4 mr-2"/>Fechar Convites</Button>
                  )
                )}
                <div className="flex-1 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>Fechar</Button>
                    {isOrganizer && reserva.payment_status !== 'pago' && !isPaymentOverdue && amountToPay > 0 && (
                      <Button onClick={handlePayFullAmount} className="bg-green-600 hover:bg-green-700">
                        <DollarSign className="h-4 w-4 mr-2"/> Pagar Agora ({formatCurrency(amountToPay)})
                      </Button>
                    )}
                    {isOrganizer && <Button onClick={handleCancelClick} className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 focus:ring-red-500">Cancelar Reserva</Button>}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ConfirmationModal
        isOpen={isLockConfirmOpen}
        onClose={() => setIsLockConfirmOpen(false)}
        onConfirm={handleToggleLock}
        title={lockAction === 'lock' ? 'Fechar Reserva para Convites?' : 'Reabrir Reserva?'}
        message={
          lockAction === 'lock' 
            ? "Ao fechar, novos jogadores não poderão entrar e o pagamento será solicitado aos confirmados. Deseja continuar?" 
            : "Isso reabrirá a reserva para novos convites e reiniciará o status de pagamento de todos os participantes. Deseja continuar?"
        }
        confirmText={lockAction === 'lock' ? 'Sim, Fechar' : 'Sim, Reabrir'}
        icon={lockAction === 'lock' ? <Lock className="h-10 w-10 text-brand-blue-500" /> : <Unlock className="h-10 w-10 text-yellow-500" />}
        confirmVariant="primary"
      />
    </>
  );
};

const InfoItem: React.FC<{ icon: React.ElementType, label: string, value: string }> = ({ icon: Icon, label, value }) => (
  <div className="flex items-start">
    <Icon className="h-5 w-5 mr-3 mt-0.5 text-brand-gray-400 flex-shrink-0" />
    <div>
      <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">{label}</p>
      <p className="font-semibold text-brand-gray-800 dark:text-brand-gray-200">{value || 'Não informado'}</p>
    </div>
  </div>
);

export default ReservationDetailModal;
