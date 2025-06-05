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
        .maybeSingle();

      if (fetchError) {
        console.error('Error checking existing profile:', fetchError);
<<<<<<< HEAD
        // Continue anyway, don't block the auth process
=======
        throw new Error('Failed to check existing profile');
>>>>>>> 6f70b98 (feat: enhance AuthProvider with improved profile creation and error handling)
      }

      if (!existingProfile) {
        console.log('Creating new profile for user:', user.id);
        
<<<<<<< HEAD
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

        const { error: insertError } = await supabase
          .from('profiles')
          .insert(profileData);

        if (insertError) {
          console.error('Error creating profile:', insertError);
          // Don't show error toast for profile creation failures, just log it
          console.warn('Profile creation failed, but user authentication succeeded');
        } else {
          console.log('Profile created successfully');
        }
      } else {
        console.log('Profile already exists for user:', user.id);
      }
    } catch (error) {
      console.error('Error in handleProfileCreation:', error);
      // Don't block authentication if profile creation fails
=======
        // Generate a random 6-digit ID if not provided
        const actualUserId = userId || Math.floor(100000 + Math.random() * 900000).toString();
        
        // Prepare profile data
        const profileData = {
          id: user.id,
          user_id: actualUserId,
          username: username || user.user_metadata?.username || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          avatar_url: user.user_metadata?.avatar_url || null,
          updated_at: new Date().toISOString()
        };

        console.log('Creating profile with data:', profileData);

        const { error: insertError } = await supabase
          .from('profiles')
          .insert([profileData])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError);
          throw new Error('Failed to create user profile');
        }
        
        console.log('Profile created successfully');
        return true;
      }
      
      console.log('Profile already exists for user:', user.id);
      return false;
    } catch (error: any) {
      console.error('Error in handleProfileCreation:', error);
      throw error; // Re-throw to handle in the signup flow
>>>>>>> 6f70b98 (feat: enhance AuthProvider with improved profile creation and error handling)
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
          console.log('Initial session check:', session?.user?.id || 'No session');
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
        console.log('Auth state change:', event, session?.user?.id || 'No session');
        
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
      
      // First validate the input
      if (!email || !password || !username) {
        throw new Error('Email, password and username are required');
      }

      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            user_id: userId
          }
        }
      });

      if (error) throw error;
      
      if (!data.user) {
        throw new Error('User creation failed');
      }

      if (data.session) {
        // User is immediately signed in (email confirmation disabled)
        console.log('User signed up and logged in immediately');
<<<<<<< HEAD
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
=======
        
        try {
          await handleProfileCreation(data.user, username, userId);
          
          toast({
            title: "Account created successfully",
            description: `Welcome to WispaChat! Your user ID: ${userId}`,
          });
          
          navigate('/chats');
        } catch (profileError: any) {
          // If profile creation fails, sign out the user and show error
          await supabase.auth.signOut();
          throw new Error('Failed to create user profile. Please try again.');
        }
      } else {
        // Email confirmation required
        console.log('User signed up, email confirmation required');
        
        // Still try to create the profile
        try {
          await handleProfileCreation(data.user, username, userId);
        } catch (profileError) {
          console.error('Profile creation failed during email verification flow:', profileError);
          // Don't block the signup process in this case
        }
        
        toast({
          title: "Account created successfully",
>>>>>>> 6f70b98 (feat: enhance AuthProvider with improved profile creation and error handling)
          description: "Please check your email to confirm your account before signing in.",
        });
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      
<<<<<<< HEAD
      // Handle specific database errors
      if (error.message?.includes('Database error')) {
        toast({
          title: "Database Error",
          description: "There was an issue creating your account. Please try again or contact support.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error creating account",
          description: error.message,
          variant: "destructive"
        });
      }
=======
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error.message?.includes('password')) {
        errorMessage = error.message;
      } else if (error.message?.includes('email')) {
        errorMessage = 'Invalid email address or email already registered';
      } else if (error.message?.includes('profile')) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error creating account",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw error;
>>>>>>> 6f70b98 (feat: enhance AuthProvider with improved profile creation and error handling)
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
