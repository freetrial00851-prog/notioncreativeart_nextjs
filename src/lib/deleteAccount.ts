import { supabase } from './supabase'

export async function deleteAccount(params: { password?: string; confirmEmail?: string }): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke('delete-account', {
    body: {
      password: params.password,
      confirmEmail: params.confirmEmail,
    },
  })

  if (error) {
    return { ok: false, error: 'Could not delete account. Please try again.' }
  }

  if (data?.error) {
    return { ok: false, error: String(data.error) }
  }

  return { ok: true }
}

export const ACCOUNT_DELETED_FLAG = 'nca_account_deleted'
