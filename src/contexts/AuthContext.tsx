
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, userId?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Handle profile creation/update after authentication
  const handleProfileCreation = async (user: User, username?: string, userId?: string) => {
    try {
      console.log('Handling profile creation for user:', user.id);
      
      // Check if profile already exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id, user_id, username')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking existing profile:', fetchError);
        return;
      }

      if (!existingProfile) {
        console.log('Creating new profile for user:', user.id);
        
        // Prepare profile data
        const profileData: any = {
          id: user.id,
          username: username || user.user_metadata?.username || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          avatar_url: user.user_metadata?.avatar_url || null
        };

        // Add user_id if provided (for manual signup)
        if (userId) {
          profileData.user_id = userId;
        }
        // For OAuth users, let the trigger generate the user_id

        const { error: insertError } = await supabase
          .from('profiles')
          .insert(profileData);

        if (insertError) {
          console.error('Error creating profile:', insertError);
          toast({
            title: "Profile Error",
            description: "There was an issue creating your profile, but you can still use the app.",
            variant: "destructive"
          });
        } else {
          console.log('Profile created successfully');
        }
      } else {
        console.log('Profile already exists for user:', user.id);
      }
    } catch (error) {
      console.error('Error in handleProfileCreation:', error);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }
        
        if (mounted) {
          console.log('Initial session check:', session?.user?.id);
          setSession(session);
          setUser(session?.user ?? null);
          
          // Handle profile creation for existing session
          if (session?.user) {
            setTimeout(() => {
              handleProfileCreation(session.user);
            }, 100);
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          // Handle profile creation for new sessions
          if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
            setTimeout(() => {
              handleProfileCreation(session.user);
            }, 100);
          }
          
          // Only set loading to false after we've processed the auth change
          if (event === 'SIGNED_OUT' || session) {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, username: string, userId?: string) => {
    try {
      setLoading(true);
      
      console.log('Starting signup process for:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            user_id: userId
          },
          emailRedirectTo: `${window.location.origin}/chats`
        }
      });

      if (error) throw error;
      
      if (data.session) {
        // User is immediately signed in (email confirmation disabled)
        console.log('User signed up and logged in immediately');
        await handleProfileCreation(data.user, username, userId);
        
        toast({
          title: "Account created successfully",
          description: `Welcome to WispaChat! Your user ID: ${userId}`,
        });
        navigate('/chats');
      } else if (data.user) {
        // Email confirmation required
        console.log('User signed up, email confirmation required');
        toast({
          title: "Account created successfully", 
          description: "Please check your email to confirm your account before signing in.",
        });
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Error creating account",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      console.log('Starting signin process for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      console.log('User signed in successfully');
      
      // Navigation will be handled by auth state change listener
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
      
    } catch (error: any) {
      console.error('Signin error:', error);
      toast({
        title: "Error signing in",
        description: error.message,
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      console.log('User signed out successfully');
      navigate('/auth');
    } catch (error: any) {
      console.error('Signout error:', error);
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const value = {
    session,
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
