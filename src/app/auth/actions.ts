'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()
  
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  if (!data.email || !data.password) {
    redirect('/auth/login?error=missing-credentials')
  }
  
  const { error } = await supabase.auth.signInWithPassword(data)
  
  if (error) {
    console.error('Login error:', error.message)
    redirect(`/auth/login?error=${encodeURIComponent(error.message)}`)
  }
  
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('Logout error:', error.message)
    redirect('/auth/login?error=logout-failed')
  }
  
  revalidatePath('/', 'layout')
  redirect('/auth/login')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  if (!data.email || !data.password) {
    redirect('/auth/register?error=missing-credentials')
  }
  
  const { error } = await supabase.auth.signUp(data)
  
  if (error) {
    console.error('Signup error:', error.message)
    redirect(`/auth/register?error=${encodeURIComponent(error.message)}`)
  }
  
  revalidatePath('/', 'layout')
  redirect('/auth/login?message=check-email')
}