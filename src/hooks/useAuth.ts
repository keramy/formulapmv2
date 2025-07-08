'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { UserProfile, UserRole } from '@/types/auth'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        }
      } catch (error) {
        console.error('Error loading session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      // First try direct query with RLS
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile with RLS:', error)
        // If RLS fails, try using API endpoint
        try {
          const response = await fetch('/api/auth/profile', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          })
          
          if (response.ok) {
            const result = await response.json()
            const profileData = result.profile || result // Handle both formats
            setProfile({
              id: profileData.id,
              role: profileData.role as UserRole,
              first_name: profileData.first_name,
              last_name: profileData.last_name,
              email: profileData.email,
              phone: profileData.phone,
              company: profileData.company,
              department: profileData.department,
              permissions: profileData.permissions || {},
              is_active: profileData.is_active,
              created_at: profileData.created_at,
              updated_at: profileData.updated_at
            })
            return
          }
        } catch (apiError) {
          console.error('Error fetching profile via API:', apiError)
        }
        
        // If both fail, set profile to null
        setProfile(null)
        return
      }
      
      setProfile({
        id: data.id,
        role: data.role as UserRole,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        department: data.department,
        permissions: data.permissions || {},
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at
      })
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setProfile(null)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    })
    
    if (error) throw error
    
    if (data.user) {
      await fetchUserProfile(data.user.id)
    }
    
    return data
  }

  const signUp = async (email: string, password: string, userData: Partial<UserProfile>) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role
        }
      }
    })
    
    if (error) throw error
    
    // Create user profile
    if (data.user) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: data.user.id,
          role: userData.role,
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: email.trim().toLowerCase(),
          phone: userData.phone || null,
          company: userData.company || null,
          department: userData.department || null,
          permissions: {},
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        // Try to delete the auth user if profile creation failed
        await supabase.auth.admin.deleteUser(data.user.id)
        throw profileError
      }
      
      await fetchUserProfile(data.user.id)
    }
    
    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setProfile(null)
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return

    const { error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) throw error
    
    await fetchUserProfile(user.id)
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id)
    }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
    
    if (error) throw error
  }

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    
    if (error) throw error
  }

  return {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile,
    resetPassword,
    updatePassword,
    isAuthenticated: !!user,
    isManagement: profile ? ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin'].includes(profile.role) : false,
    isProjectRole: profile ? ['project_manager', 'architect', 'technical_engineer'].includes(profile.role) : false,
    isPurchaseRole: profile ? ['purchase_director', 'purchase_specialist'].includes(profile.role) : false,
    isFieldRole: profile ? ['field_worker'].includes(profile.role) : false,
    isExternalRole: profile ? ['client'].includes(profile.role) : false
  }
}