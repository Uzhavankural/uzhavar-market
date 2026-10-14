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

  const defaultName = effectiveRole === 'farmer' ? 'Farmer' : (user?.email?.split('@')[0] || 'User')

  const effectiveProfile = {
    ...(profile || {}),
    id: user?.id || profile?.id,
    full_name: profile?.full_name || meta.full_name || defaultName,
    phone: profile?.phone || meta.phone || '',
    role: effectiveRole,
    is_banned: profile?.is_banned || false,
    address: profile?.address || meta.address || '',
    village: profile?.village || meta.village || '',
    district: profile?.district || meta.district || '',
    pincode: profile?.pincode || meta.pincode || '',
    isAllowed: effectiveRole === 'farmer',
  }

  // Profile exists in DB if profile object has an id
  const profileExists = Boolean(profile?.id)

  // Persist profile to profiles table:
  // 1. If row does NOT exist in DB yet for ANY user (customer, farmer, admin), insert/upsert it!
  // 2. If row exists and user is a farmer whose DB role is not 'farmer', update it.
  if (user?.id) {
    try {
      if (!profileExists) {
        const newProfileData = {
          id: user.id,
          full_name: effectiveProfile.full_name,
          phone: effectiveProfile.phone,
          role: effectiveRole,
          is_banned: effectiveProfile.is_banned || false,
          address: effectiveProfile.address,
          village: effectiveProfile.village,
          district: effectiveProfile.district,
          pincode: effectiveProfile.pincode,
        }

        const { error: fullUpsertError } = await supabase
          .from('profiles')
          .upsert(newProfileData, { onConflict: 'id' })

        if (fullUpsertError) {
          console.warn('Full profile upsert notice, trying minimal upsert:', fullUpsertError)
          await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              full_name: effectiveProfile.full_name,
              phone: effectiveProfile.phone,
              role: effectiveRole,
              is_banned: false,
            }, { onConflict: 'id' })
        }
      } else if (isFarmer && profile?.role !== 'farmer') {
        // If profile exists and user is marked as farmer but role in DB is different, sync role
        await supabase
          .from('profiles')
          .update({
            role: 'farmer',
            full_name: effectiveProfile.full_name,
            phone: effectiveProfile.phone,
            address: effectiveProfile.address,
            village: effectiveProfile.village,
            district: effectiveProfile.district,
            pincode: effectiveProfile.pincode,
          })
          .eq('id', user.id)
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
