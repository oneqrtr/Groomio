'use client';

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

const POLL_INTERVAL_MS = 25000;

export type NewAppointmentPayload = {
  start_at: string;
  customer_name: string;
};

function playNotificationSound(): void {
  if (typeof window === 'undefined') return;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const audioContext = new AC();

    const playBeep = () => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.frequency.value = 800;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.15, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
      osc.start(audioContext.currentTime);
      osc.stop(audioContext.currentTime + 0.15);
    };

    if (audioContext.state === 'suspended') {
      audioContext.resume().then(() => playBeep());
    } else {
      playBeep();
    }
  } catch {
    // Fallback: data URI short WAV (minimal beep)
    try {
      const wav = 'UklGRl9vAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAABggL+A4ID/gOCA/4DggP+A4ID/gOCA/4DggP+A4ID/gOCA/w==';
      const audio = new Audio('data:audio/wav;base64,' + wav);
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {
      // ignore
    }
  }
}

export function useNewAppointmentNotifier(
  barberId: string | null,
  options: {
    enabled: boolean;
    onNewAppointment: (payload: NewAppointmentPayload) => void;
  }
): void {
  const { enabled, onNewAppointment } = options;
  const baselineCreatedAtRef = useRef<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onNewAppointmentRef = useRef(onNewAppointment);
  onNewAppointmentRef.current = onNewAppointment;

  const playSoundAndNotify = useCallback((payload: NewAppointmentPayload) => {
    playNotificationSound();
    onNewAppointmentRef.current(payload);
  }, []);

  useEffect(() => {
    if (!barberId || !enabled) return;

    let mounted = true;

    const setBaselineFromLatest = async () => {
      const { data } = await supabase
        .from('appointments')
        .select('created_at')
        .eq('barber_id', barberId)
        .eq('status', 'booked')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (mounted && data?.created_at) {
        baselineCreatedAtRef.current = data.created_at;
      }
    };

    const handleNewAppointment = (payload: NewAppointmentPayload) => {
      playSoundAndNotify(payload);
    };

    (async () => {
      await setBaselineFromLatest();

      if (!mounted) return;

      try {
        const channel = supabase
          .channel(`appointments:${barberId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'appointments',
              filter: `barber_id=eq.${barberId}`,
            },
            async (payload) => {
              const row = payload.new as { status?: string; created_at?: string; start_at?: string; customer_name?: string };
              if (row?.status !== 'booked') return;
              const created = row.created_at;
              const baseline = baselineCreatedAtRef.current;
              if (baseline && created && created <= baseline) return;
              if (created) baselineCreatedAtRef.current = created;
              handleNewAppointment({
                start_at: row.start_at ?? '',
                customer_name: row.customer_name ?? '',
              });
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') return;
            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              startPolling();
            }
          });

        channelRef.current = channel;
      } catch {
        startPolling();
      }
    })();

    function startPolling() {
      if (pollIntervalRef.current) return;
      pollIntervalRef.current = setInterval(async () => {
        if (!mounted) return;
        const { data } = await supabase
          .from('appointments')
          .select('created_at, start_at, customer_name, status')
          .eq('barber_id', barberId)
          .eq('status', 'booked')
          .order('created_at', { ascending: false })
          .limit(5);

        const baseline = baselineCreatedAtRef.current;
        if (!data?.length) return;
        const latest = data[0];
        if (!latest?.created_at) return;
        if (baseline === null) {
          baselineCreatedAtRef.current = latest.created_at;
          return;
        }
        if (latest.created_at > baseline) {
          baselineCreatedAtRef.current = latest.created_at;
          handleNewAppointment({
            start_at: latest.start_at ?? '',
            customer_name: latest.customer_name ?? '',
          });
        }
      }, POLL_INTERVAL_MS);
    }

    return () => {
      mounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [barberId, enabled, playSoundAndNotify]);
}
