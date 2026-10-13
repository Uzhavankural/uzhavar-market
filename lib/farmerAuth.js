import { supabase } from './supabase'

/**
 * Ensures farmer access for a user.
 * - If user metadata or profile has role === 'farmer', confirms role is 'farmer',
 *   synchronizes profile with metadata, and persists to profiles table if needed.
 */
export async function ensureFarmerAccess(profile, user, roleOverride) {
  const meta = user?.user_metadata || {}
  const isFarmer =
    roleOverride === 'farmer' ||
    profile?.role === 'farmer' ||
    meta.role === 'farmer'

  const effectiveRole = isFarmer ? 'farmer' : (roleOverride || profile?.role || meta.role || 'customer')

  const effectiveProfile = {
    ...(profile || {}),
    id: user?.id || profile?.id,
    full_name: profile?.full_name || meta.full_name || user?.email?.split('@')[0] || 'Farmer',
    phone: profile?.phone || meta.phone || '',
    role: effectiveRole,
    is_banned: profile?.is_banned || false,
    address: profile?.address || meta.address || '',
    village: profile?.village || meta.village || '',
    district: profile?.district || meta.district || '',
    pincode: profile?.pincode || meta.pincode || '',
    isAllowed: effectiveRole === 'farmer',
  }

  // If user is a farmer and profile is missing or out of sync in database, sync it
  if (user?.id && isFarmer) {
    try {
      const { error: fullUpsertError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: effectiveProfile.full_name,
          phone: effectiveProfile.phone,
          role: 'farmer',
          is_banned: effectiveProfile.is_banned,
          address: effectiveProfile.address,
          village: effectiveProfile.village,
          district: effectiveProfile.district,
          pincode: effectiveProfile.pincode,
        })

      if (fullUpsertError) {
        console.warn('Full profile upsert error, trying minimal role upsert:', fullUpsertError)
        await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            full_name: effectiveProfile.full_name,
            phone: effectiveProfile.phone,
            role: 'farmer',
            is_banned: effectiveProfile.is_banned,
          })
      }
    } catch (e) {
      console.warn('Profile sync notice:', e)
    }
  }

  return effectiveProfile
}

export function isJanaranjana() {
  return false
}
