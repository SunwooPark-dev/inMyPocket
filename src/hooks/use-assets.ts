import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

type Asset = Database['public']['Tables']['assets']['Row'];

export function useAssets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    const fetchAssets = async () => {
      const { data, error } = await supabase
        .from('assets')
        .select('*');
      
      if (!error && data) {
        setAssets(data);
      }
      setLoading(false);
    };

    fetchAssets();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('assets_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'assets' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAssets(prev => [...prev, payload.new as Asset]);
          } else if (payload.eventType === 'UPDATE') {
            setAssets(prev => prev.map(a => a.id === payload.new.id ? payload.new as Asset : a));
          } else if (payload.eventType === 'DELETE') {
            setAssets(prev => prev.filter(a => a.id === payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { assets, loading };
}
