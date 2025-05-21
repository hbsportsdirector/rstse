import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: UserRole
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        console.log('Auth check: getting session...');
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) throw error;
        console.log('Auth check session:', session);
        
        if (session?.user) {
          const { data: userData, error: userErr } = await supabase
            .from('users')
            .select('id, email, first_name, last_name, role, team_id, profile_image_url, created_at')
            .eq('id', session.user.id)
            .maybeSingle();
            
          if (userErr) {
            console.error('Error fetching user data:', userErr);
            if (isMounted) setUser(null);
            return;
          }
          
          if (userData) {
            const formattedUser: User = {
              id: userData.id,
              email: userData.email,
              firstName: userData.first_name,
              lastName: userData.last_name,
              role: userData.role as UserRole,
              teamId: userData.team_id,
              profileImageUrl: userData.profile_image_url,
              createdAt: userData.created_at
            };
            if (isMounted) setUser(formattedUser);
          } else {
            if (isMounted) setUser(null);
          }
        } else {
          if (isMounted) setUser(null);
        }
      } catch (err) {
        console.error('Authentication check failed:', err);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      setLoading(false);
      
      if (session?.user) {
        // Defer database fetch to avoid internal locking issues
        setTimeout(async () => {
          try {
            const { data: userData, error: userErr } = await supabase
              .from('users')
              .select('id, email, first_name, last_name, role, team_id, profile_image_url, created_at')
              .eq('id', session.user.id)
              .maybeSingle();
              
            if (userErr) {
              console.error('Error fetching user after auth change:', userErr);
              if (isMounted) setUser(null);
              return;
            }
            
            if (userData) {
              const formattedUser: User = {
                id: userData.id,
                email: userData.email,
                firstName: userData.first_name,
                lastName: userData.last_name,
                role: userData.role as UserRole,
                teamId: userData.team_id,
                profileImageUrl: userData.profile_image_url,
                createdAt: userData.created_at
              };
              if (isMounted) setUser(formattedUser);
            } else {
              if (isMounted) setUser(null);
            }
          } catch (err) {
            console.error('Error fetching user after auth change:', err);
            if (isMounted) setUser(null);
          }
        }, 0);
      } else {
        setUser(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('Logging in:', email);
      const {
        data: { session },
        error: signInError,
      } = await supabase.auth.signInWithPassword({ email, password });
      
      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password');
        }
        throw signInError;
      }

      if (!session?.user) {
        throw new Error('Login failed - no session created');
      }

      console.log('Login successful, session user ID:', session.user.id);

      // Initial delay of 2 seconds to allow for database replication
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Multiple attempts to fetch user data with exponential backoff
      let attempts = 0;
      const maxAttempts = 5; // Maximum number of retry attempts
      let userData = null;
      let lastError = null;

      while (attempts < maxAttempts) {
        try {
          console.log(`Attempt ${attempts + 1}: Fetching user data for ID ${session.user.id}`);
          const { data, error: userErr } = await supabase
            .from('users')
            .select('id, email, first_name, last_name, role, team_id, profile_image_url, created_at')
            .eq('id', session.user.id)
            .maybeSingle();
            
          if (userErr) {
            lastError = userErr;
            console.error(`Attempt ${attempts + 1}: Error fetching user data:`, userErr);
            throw userErr;
          }
          
          if (data) {
            userData = data;
            console.log('User data successfully fetched:', data);
            break;
          } else {
            console.log(`Attempt ${attempts + 1}: User data not found, will retry`);
            lastError = new Error(`User record not found for email: ${email}`);
          }
        } catch (err) {
          lastError = err;
          console.error(`Attempt ${attempts + 1}: Failed to fetch user data:`, err);
        }

        attempts++;
        if (attempts < maxAttempts) {
          const delay = Math.pow(2, attempts) * 1000; // Exponential backoff: 2s, 4s, 8s, 16s
          console.log(`Waiting ${delay}ms before next attempt...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      if (!userData) {
        // Sign out the user to prevent a partially logged-in state
        await supabase.auth.signOut();
        
        // Create a more detailed error message
        const errorMessage = lastError instanceof Error ? lastError.message : 'Unknown error';
        throw new Error(
          `Unable to retrieve account data for ${email}. This could be due to a delay in account creation. ` +
          `Please try again in a few moments. If the problem persists, contact support with this error: ${errorMessage}`
        );
      }
      
      const formattedUser: User = {
        id: userData.id,
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        role: userData.role as UserRole,
        teamId: userData.team_id,
        profileImageUrl: userData.profile_image_url,
        createdAt: userData.created_at
      };
      
      setUser(formattedUser);
      console.log('Login process completed successfully');
    } catch (err) {
      console.error('Login failed:', err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      console.log('Signing out user');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
      throw err;
    }
  };

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: UserRole
  ) => {
    try {
      console.log('Registering user:', email);
      const {
        data: { user: authUser },
        error: signUpError,
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { first_name: firstName, last_name: lastName, role },
        },
      });
      if (signUpError) throw signUpError;
      console.log('Auth sign-up user:', authUser);

      if (authUser) {
        const newUser = {
          id: authUser.id,
          email,
          first_name: firstName,
          last_name: lastName,
          role,
          team_id: null,
          profile_image_url: null,
          created_at: new Date().toISOString()
        };
        
        const { error: insertError } = await supabase.from('users').insert([newUser]);
        if (insertError) {
          console.error('Error inserting user data:', insertError);
          throw new Error('Failed to create user account');
        }
        
        setUser({
          id: authUser.id,
          email,
          firstName,
          lastName,
          role,
          teamId: null,
          profileImageUrl: null,
          createdAt: newUser.created_at
        });
      }
    } catch (err) {
      console.error('Registration failed:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
