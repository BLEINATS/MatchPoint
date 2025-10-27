import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { localApi } from '../lib/localApi';
import { Plan, Subscription } from '../types';
import { isBefore, addDays, add, Duration } from 'date-fns';
import { parseDateStringAsLocal } from '../utils/dateUtils';

export const useSubscriptionStatus = () => {
  const { selectedArenaContext: arena, profile, quadraCount, teamMemberCount } = useAuth();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!arena || !profile || (profile.role !== 'admin_arena' && profile.role !== 'funcionario')) {
        setPlan(null);
        setSubscription(null);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const [subsRes, plansRes] = await Promise.all([
          localApi.select<Subscription>('subscriptions', 'all'),
          localApi.select<Plan>('plans', 'all'),
        ]);

        const currentSub = subsRes.data?.find(s => s.arena_id === arena.id);
        setSubscription(currentSub || null);

        if (currentSub) {
          const currentPlan = plansRes.data?.find(p => p.id === currentSub.plan_id);
          setPlan(currentPlan || null);
        } else {
          setPlan(null);
        }
      } catch (error) {
        console.error("Failed to fetch subscription status", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, [arena, profile]);

  const { nextBillingDate, isTrial, isExpired } = useMemo(() => {
    if (!subscription || !plan || !subscription.start_date) {
      return { nextBillingDate: null, isTrial: false, isExpired: false };
    }

    const startDate = parseDateStringAsLocal(subscription.start_date);
    if (isNaN(startDate.getTime())) {
      console.error("Invalid start_date in subscription:", subscription);
      return { nextBillingDate: null, isTrial: false, isExpired: true };
    }

    const effectiveDuration = plan.duration_days || plan.trial_days;
    if (effectiveDuration && effectiveDuration > 0) {
      const expiryDate = addDays(startDate, effectiveDuration);
      return {
        nextBillingDate: expiryDate,
        isTrial: plan.price === 0,
        isExpired: isBefore(expiryDate, new Date()),
      };
    } 
    else if (plan.billing_cycle) {
      const today = new Date();
      let nextBilling = startDate;
      let iterations = 0;

      while (isBefore(nextBilling, today) && iterations < 1200) {
        let increment: Duration | null = null;
        switch (plan.billing_cycle) {
          case 'monthly': increment = { months: 1 }; break;
          case 'quarterly': increment = { months: 3 }; break;
          case 'semiannual': increment = { months: 6 }; break;
          case 'annual': increment = { years: 1 }; break;
          default: break;
        }

        if (increment) {
          nextBilling = add(nextBilling, increment);
        } else {
          break; 
        }
        iterations++;
      }

      return {
        nextBillingDate: nextBilling,
        isTrial: false,
        isExpired: false,
      };
    } 
    else {
      return { nextBillingDate: null, isTrial: false, isExpired: true };
    }
  }, [subscription, plan]);

  const status = useMemo(() => {
    const isActive = subscription?.status === 'active';
    const isSuspended = arena?.status === 'suspended';
    const isPastDue = subscription?.status === 'past_due';
    
    const effectiveIsActive = isActive && !isExpired && !isSuspended;

    const limits = {
      maxQuadras: plan?.max_quadras ?? Infinity,
      maxTeamMembers: plan?.max_team_members ?? Infinity,
    };
    if (limits.maxQuadras === null) limits.maxQuadras = Infinity;
    if (limits.maxTeamMembers === null) limits.maxTeamMembers = Infinity;

    const canAddQuadra = quadraCount < limits.maxQuadras;
    const canAddTeamMember = teamMemberCount < limits.maxTeamMembers;

    return {
      plan,
      subscription,
      isLoading,
      isActive: effectiveIsActive,
      isSuspended,
      isPastDue,
      isExpired,
      limits,
      usage: {
        quadraCount,
        teamMemberCount,
      },
      canAddQuadra,
      canAddTeamMember,
      nextBillingDate,
      isTrial,
    };
  }, [plan, subscription, isLoading, quadraCount, teamMemberCount, arena?.status, nextBillingDate, isExpired]);

  return status;
};
