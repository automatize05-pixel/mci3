import { supabase } from "@/integrations/supabase/client";

export const XP_AMOUNTS = {
  CREATE_POST: 50,
  LIKE_POST: 5,
  COMMENT: 10,
  PLAN_MEAL: 15,
};

export const BADGES = [
  { id: 'novato', name: 'Novato', icon: '🌱', xp_required: 0, description: 'Iniciou a jornada culinária' },
  { id: 'cozinheiro', name: 'Cozinheiro', icon: '🍳', xp_required: 100, description: '100 XP acumulados' },
  { id: 'chef_amador', name: 'Chef Amador', icon: '👨‍🍳', xp_required: 500, description: '500 XP acumulados' },
  { id: 'mestre_cuca', name: 'Mestre Cuca', icon: '🔥', xp_required: 1000, description: '1000 XP acumulados' },
  { id: 'lenda', name: 'Lenda da Cozinha', icon: '👑', xp_required: 5000, description: 'Atingiu 5000 XP!' },
];

export const awardXP = async (userId: string, amount: number) => {
  try {
    const { data: profile } = await (supabase as any).from('profiles').select('xp').eq('id', userId).single();
    const currentXP = (profile as any)?.xp || 0;
    const newXP = currentXP + amount;

    await (supabase as any).from('profiles').update({ xp: newXP }).eq('id', userId);

    const earnedBadges = BADGES.filter(b => newXP >= b.xp_required);
    
    const { data: userBadges } = await (supabase as any).from('user_badges').select('badge_type').eq('user_id', userId);
    const existingBadgeTypes = new Set(userBadges?.map((b: any) => b.badge_type) || []);

    const newBadgesToAward = earnedBadges.filter(b => !existingBadgeTypes.has(b.id));

    if (newBadgesToAward.length > 0) {
      for (const badge of newBadgesToAward) {
        await (supabase as any).from('user_badges').insert({ user_id: userId, badge_type: badge.id });
      }
    }

    return { newXP, newBadgesAwarded: newBadgesToAward };
  } catch (error) {
    console.error("Error awarding XP:", error);
    return null;
  }
};
