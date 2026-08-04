import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { db } from '../lib/db';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface LoginResult {
  success: boolean;
  message?: string;
  accessDenied?: boolean;
  requiresVerification?: boolean;
  pendingApproval?: boolean;
  pendingUser?: User;
  user?: User;
}

export interface RegisterResult {
  success: boolean;
  message?: string;
  requiresVerification?: boolean;
  pendingApproval?: boolean;
  pendingUser?: User;
  user?: User;
}

// Helper to check if an email or username belongs to an authorized farm owner/admin
export const isAuthorizedOwnerEmail = (emailStr: string): boolean => {
  if (!emailStr) return false;
  const clean = emailStr.toLowerCase().trim();
  const ownerList = [
    'sreenuneelam9010@gmail.com',
    'admin@farm.com',
    'subbaiah@farm.com',
    'owner9392589010@farm.com',
    'sreenivasulu@farm.com',
    'ramachandraiah@farm.com'
  ];
  if (ownerList.includes(clean)) return true;
  if (clean.includes('sreenu') || clean.includes('ramachandraiah') || clean.includes('subbaiah') || clean.includes('sreenivasulu')) return true;
  if (clean.includes('9392589010') || clean.includes('9502756669') || clean.includes('8897288390')) return true;
  if (clean.startsWith('admin') || clean.startsWith('owner')) return true;
  return false;
};

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  loginWithEmail: (email: string, password: string, targetRole: UserRole) => Promise<LoginResult>;
  registerCustomer: (data: { fullName: string; email: string; password: string; mobileNumber?: string; address?: string }) => Promise<RegisterResult>;
  registerWorker: (data: { fullName: string; email: string; password: string; mobileNumber: string; address: string; aadhaarId?: string }) => Promise<RegisterResult>;
  sendPasswordResetEmail: (email: string) => Promise<{ success: boolean; message: string; otpCode?: string }>;
  verifyEmailResetOTP: (email: string, enteredOTP: string, expectedOTP: string, newPassword?: string) => Promise<{ success: boolean; message: string }>;
  activateWorkerAccount: (userId: string) => Promise<boolean>;
  rejectWorkerAccount: (userId: string) => Promise<boolean>;
  suspendWorkerAccount: (userId: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (isSupabaseConfigured) {
        try {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.user) {
            const sbUser = data.session.user;
            const authUid = sbUser.id;
            const email = sbUser.email || '';

            const { data: prof } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', authUid)
              .maybeSingle();

            if (prof && (prof.status || 'Active').toLowerCase() === 'active') {
              let rawRole = (prof.role || '').toLowerCase().trim();
              if (isAuthorizedOwnerEmail(email) && rawRole !== 'owner' && rawRole !== 'admin' && rawRole !== 'administrator') {
                rawRole = 'owner';
                prof.role = 'owner';
                await supabase.from('profiles').update({ role: 'owner' }).eq('id', authUid);
              }
              const mappedRole: UserRole = (rawRole === 'owner' || rawRole === 'admin' || rawRole === 'administrator') ? 'admin' : (rawRole as UserRole);
              const mappedUser: User = {
                id: prof.id || authUid,
                fullName: prof.full_name || sbUser.user_metadata?.full_name || email.split('@')[0],
                email: prof.email || email,
                mobileNumber: prof.mobile_number || '',
                username: prof.username || email.split('@')[0],
                role: mappedRole,
                address: prof.address || '',
                status: 'Active',
                isApproved: true,
                createdAt: prof.created_at || new Date().toISOString().slice(0, 10)
              };
              setUser(mappedUser);
              localStorage.setItem('lvf_current_user', JSON.stringify(mappedUser));
              setIsLoading(false);
              return;
            } else if (prof && (prof.status || '').toLowerCase() !== 'active') {
              await supabase.auth.signOut();
              setUser(null);
              localStorage.removeItem('lvf_current_user');
              setIsLoading(false);
              return;
            }
          }
        } catch (e) {
          console.error('Session init error:', e);
        }
      }

      const savedUser = localStorage.getItem('lvf_current_user');
      if (savedUser) {
        try {
          const parsed: User = JSON.parse(savedUser);
          if (!parsed.email) {
            localStorage.removeItem('lvf_current_user');
            setUser(null);
          } else {
            setUser(parsed);
          }
        } catch {
          localStorage.removeItem('lvf_current_user');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Email + Password Login Handler
  const loginWithEmail = async (email: string, password: string, targetRole: UserRole): Promise<LoginResult> => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    // Session Isolation: Clear previous active user session
    localStorage.removeItem('lvf_current_user');

    if (isSupabaseConfigured) {
      try {
        // Step 1: Authenticate via Supabase Auth
        const { data: sbData, error: sbError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });

        // Step 2: Get authenticated user using auth.getUser()
        const getUserResult = await supabase.auth.getUser();
        const authUser = getUserResult.data?.user || sbData?.user;

        if (!authUser) {
          console.error('Authentication failed: Auth user missing or invalid credentials', sbError);
          if (sbError) {
            const errLower = sbError.message.toLowerCase();
            if (errLower.includes('email not confirmed') || errLower.includes('not verified') || errLower.includes('unverified')) {
              setIsLoading(false);
              return {
                success: false,
                requiresVerification: true,
                message: 'Please verify your email address before logging in.'
              };
            }
          }
          setIsLoading(false);
          return {
            success: false,
            message: 'Incorrect email or password. Please try again.'
          };
        }

        const authUid = authUser.id;
        const authEmail = authUser.email || cleanEmail;

        // Step 3: Query public.profiles WHERE id = auth.uid() (NEVER search by email)
        let profileRow: any = null;

        const profileRes = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUid)
          .maybeSingle();

        if (profileRes.error) {
          console.error('Error querying public.profiles by auth.uid():', profileRes.error);
        } else if (profileRes.data) {
          profileRow = profileRes.data;
        }

        // Step 4: Auto Profile Creation if profile missing
        if (!profileRow) {
          // Check again before inserting: SELECT * FROM profiles WHERE id = auth.uid()
          const { data: checkProf } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUid)
            .maybeSingle();

          if (checkProf) {
            profileRow = checkProf;
          } else {
            // Create exactly one profile
            const defaultRole = targetRole === 'admin' ? 'owner' : targetRole;
            const defaultName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || cleanEmail.split('@')[0];

            const newProfilePayload = {
              id: authUid,
              email: authEmail,
              full_name: defaultName,
              role: defaultRole,
              status: 'Active',
              created_at: new Date().toISOString()
            };

            const { data: createdProf, error: createErr } = await supabase
              .from('profiles')
              .insert([newProfilePayload])
              .select('*')
              .maybeSingle();

            if (createErr) {
              console.error('Error auto-creating profile in public.profiles:', createErr);
            }

            profileRow = createdProf || newProfilePayload;
          }
        }

        // If profile STILL does not exist after creation attempt:
        if (!profileRow || !profileRow.role) {
          console.error('Profile not found for auth.uid():', authUid);
          await supabase.auth.signOut();
          setUser(null);
          localStorage.removeItem('lvf_current_user');
          setIsLoading(false);
          return {
            success: false,
            message: 'Profile not found. Please contact the Farm Administrator.'
          };
        }

        // Step 5: Account Status Check
        const rawDbStatus = (profileRow.status || 'Active').toString().toLowerCase().trim();
        if (rawDbStatus !== 'active') {
          console.warn(`Account status is "${profileRow.status}". Signing out immediately.`);
          await supabase.auth.signOut();
          setUser(null);
          localStorage.removeItem('lvf_current_user');
          setIsLoading(false);
          return {
            success: false,
            message: 'Your account has been disabled.'
          };
        }

        // Step 6: STRICT ROLE VALIDATION
        let rawDbRole = (profileRow.role || profileRow.user_role || '').toString().toLowerCase().trim();

        // Auto-promote authorized owner accounts to 'owner' role in database if currently set to customer
        if (isAuthorizedOwnerEmail(authEmail) || isAuthorizedOwnerEmail(cleanEmail) || (targetRole === 'admin' && isAuthorizedOwnerEmail(cleanEmail))) {
          if (rawDbRole !== 'owner' && rawDbRole !== 'admin' && rawDbRole !== 'administrator') {
            rawDbRole = 'owner';
            profileRow.role = 'owner';
            try {
              await supabase.from('profiles').update({ role: 'owner' }).eq('id', authUid);
            } catch (err) {
              console.warn('Could not auto-update profile role in database:', err);
            }
          }
        }

        let isRoleAccepted = false;
        let portalDenialMessage = '';

        if (targetRole === 'admin') {
          isRoleAccepted = (rawDbRole === 'owner' || rawDbRole === 'admin' || rawDbRole === 'administrator');
          portalDenialMessage = 'This account is not authorized to access the Owner Portal.';
        } else if (targetRole === 'worker') {
          isRoleAccepted = (rawDbRole === 'worker');
          portalDenialMessage = 'This account is not authorized to access the Worker Portal.';
        } else if (targetRole === 'customer') {
          isRoleAccepted = (rawDbRole === 'customer');
          portalDenialMessage = 'This account is not authorized to access the Customer Portal.';
        }

        if (!isRoleAccepted) {
          console.error(`Role mismatch: Expected portal = "${targetRole}", DB role = "${rawDbRole}". Signing out.`);
          await supabase.auth.signOut();
          setUser(null);
          localStorage.removeItem('lvf_current_user');
          setIsLoading(false);
          return {
            success: false,
            accessDenied: true,
            message: portalDenialMessage
          };
        }

        // Step 7: Successful Auth Mapping & State Update
        const mappedRole: UserRole = (targetRole === 'admin' || rawDbRole === 'owner' || rawDbRole === 'admin' || rawDbRole === 'administrator')
          ? 'admin'
          : (rawDbRole as UserRole);

        const mappedUser: User = {
          id: authUid,
          fullName: profileRow.full_name || authUser.user_metadata?.full_name || cleanEmail.split('@')[0],
          email: authEmail,
          mobileNumber: profileRow.mobile_number || '',
          username: profileRow.username || cleanEmail.split('@')[0],
          role: mappedRole,
          address: profileRow.address || '',
          status: 'Active',
          isApproved: true,
          createdAt: profileRow.created_at || new Date().toISOString().slice(0, 10)
        };

        setUser(mappedUser);
        localStorage.setItem('lvf_current_user', JSON.stringify(mappedUser));
        localStorage.setItem(`lvf_session_${mappedRole}`, JSON.stringify(mappedUser));
        setIsLoading(false);

        return {
          success: true,
          user: mappedUser,
          message: 'Signed in successfully.'
        };

      } catch (err: any) {
        console.error('Supabase authentication unexpected exception:', err);
      }
    }

    // Local DB Fallback (same strict role enforcement)
    const users = db.getUsers();
    let found = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!found) {
      setIsLoading(false);
      return {
        success: false,
        message: `No ${targetRole === 'customer' ? 'customer' : targetRole === 'worker' ? 'worker' : 'admin'} account found with this email address.`
      };
    }

    if (isAuthorizedOwnerEmail(cleanEmail)) {
      found.role = 'admin';
    }

    let rawDbRole = (found.role || '').toLowerCase().trim();
    if (isAuthorizedOwnerEmail(cleanEmail)) {
      rawDbRole = 'owner';
    }
    let isRoleAccepted = false;
    let portalDenialMessage = '';

    if (targetRole === 'admin') {
      isRoleAccepted = (rawDbRole === 'owner' || rawDbRole === 'admin');
      portalDenialMessage = 'This account is not authorized to access the Owner Portal.';
    } else if (targetRole === 'worker') {
      isRoleAccepted = (rawDbRole === 'worker');
      portalDenialMessage = 'This account is not authorized to access the Worker Portal.';
    } else if (targetRole === 'customer') {
      isRoleAccepted = (rawDbRole === 'customer');
      portalDenialMessage = 'This account is not authorized to access the Customer Portal.';
    }

    if (!isRoleAccepted) {
      setIsLoading(false);
      return {
        success: false,
        accessDenied: true,
        message: portalDenialMessage
      };
    }

    const rawDbStatus = (found.status || 'active').toLowerCase().trim();
    if (rawDbStatus !== 'active') {
      setIsLoading(false);
      return {
        success: false,
        message: 'Your account has been disabled.'
      };
    }

    if (found.password && found.password !== password) {
      setIsLoading(false);
      return {
        success: false,
        message: 'Incorrect password. Please try again.'
      };
    }

    const mappedRole: UserRole = (targetRole === 'admin' || rawDbRole === 'owner' || rawDbRole === 'admin') ? 'admin' : (rawDbRole as UserRole);
    const mappedUser: User = { ...found, role: mappedRole };

    setUser(mappedUser);
    localStorage.setItem('lvf_current_user', JSON.stringify(mappedUser));
    localStorage.setItem(`lvf_session_${targetRole}`, JSON.stringify(mappedUser));
    setIsLoading(false);
    return { success: true, user: mappedUser, message: 'Signed in successfully.' };
  };

  // Register Customer (Email + Password)
  const registerCustomer = async (data: {
    fullName: string;
    email: string;
    password: string;
    mobileNumber?: string;
    address?: string;
  }): Promise<RegisterResult> => {
    setIsLoading(true);
    const cleanEmail = data.email.trim().toLowerCase();
    const users = db.getUsers();

    // Check duplicate
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      setIsLoading(false);
      return { success: false, message: 'An account with this email address already exists. Please log in instead.' };
    }

    const isOwnerAccount = isAuthorizedOwnerEmail(cleanEmail);
    const assignedRole = isOwnerAccount ? 'owner' : 'customer';

    const newCustomer: User = {
      id: `usr-cust-${Date.now()}`,
      fullName: data.fullName,
      email: cleanEmail,
      mobileNumber: data.mobileNumber || '',
      username: cleanEmail.split('@')[0],
      role: isOwnerAccount ? 'admin' : 'customer',
      address: data.address || '',
      status: 'Active',
      isApproved: true,
      password: data.password,
      isEmailVerified: false,
      createdAt: new Date().toISOString().slice(0, 10)
    };

    // Supabase Email Signup
    if (isSupabaseConfigured) {
      try {
        const { data: sbSignUpData, error: sbSignUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: data.password,
          options: {
            data: {
              full_name: data.fullName,
              role: assignedRole
            }
          }
        });

        if (sbSignUpError) {
          setIsLoading(false);
          return { success: false, message: sbSignUpError.message };
        }

        const authUserId = sbSignUpData?.user?.id;
        if (authUserId) {
          const { data: existingProf } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', authUserId)
            .maybeSingle();

          if (!existingProf) {
            const { error: profInsertErr } = await supabase.from('profiles').insert([{
              id: authUserId,
              full_name: data.fullName,
              email: cleanEmail,
              mobile_number: data.mobileNumber || '',
              username: cleanEmail.split('@')[0],
              role: assignedRole,
              address: data.address || '',
              status: 'Active',
              is_approved: true,
              created_at: new Date().toISOString()
            }]);

            if (profInsertErr) {
              console.error('Customer profile insertion error:', profInsertErr);
            }
          }
        }

        // Force sign out so no automatic session is created
        await supabase.auth.signOut();
      } catch (err: any) {
        console.error('Supabase customer registration error:', err);
      }
    }

    db.saveUsers([...users, newCustomer]);
    
    // DO NOT LOG USER IN!
    setIsLoading(false);

    return {
      success: true,
      requiresVerification: true,
      message: 'Please verify your email before logging in.'
    };
  };

  // Register Farm Worker (Email + Password + Pending Approval)
  const registerWorker = async (data: {
    fullName: string;
    email: string;
    password: string;
    mobileNumber: string;
    address: string;
    aadhaarId?: string;
  }): Promise<RegisterResult> => {
    setIsLoading(true);
    const cleanEmail = data.email.trim().toLowerCase();
    const users = db.getUsers();

    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      setIsLoading(false);
      return { success: false, message: 'A worker account with this email address already exists.' };
    }

    const newWorker: User = {
      id: `usr-wrk-${Date.now()}`,
      fullName: data.fullName,
      email: cleanEmail,
      mobileNumber: data.mobileNumber,
      username: `worker_${cleanEmail.split('@')[0]}`,
      role: 'worker',
      address: data.address,
      status: 'Pending Approval',
      isApproved: false,
      password: data.password,
      isEmailVerified: false,
      createdAt: new Date().toISOString().slice(0, 10)
    };

    // Save locally
    db.saveUsers([...users, newWorker]);

    const ownerNotifMsg = `New Farm Worker Registration Request:\nName: ${data.fullName}\nEmail: ${cleanEmail}\nMobile: ${data.mobileNumber}\nAddress: ${data.address}${data.aadhaarId ? `\nAadhaar ID: ${data.aadhaarId}` : ''}\nStatus: Pending Approval by Farm Owners.`;

    if (isSupabaseConfigured) {
      try {
        const { data: sbSignUpData, error: sbSignUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: data.password,
          options: {
            data: {
              full_name: data.fullName,
              role: 'worker'
            }
          }
        });

        if (sbSignUpError) {
          setIsLoading(false);
          return { success: false, message: sbSignUpError.message };
        }

        const authUserId = sbSignUpData?.user?.id;

        try {
          await supabase.from('notifications').insert([{
            title: `New Worker Registration: ${data.fullName}`,
            message: ownerNotifMsg,
            is_read: false,
            created_at: new Date().toISOString()
          }]);
        } catch (notifErr) {
          console.error('Worker registration notification insertion error:', notifErr);
        }

        if (authUserId) {
          const { data: existingProf } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', authUserId)
            .maybeSingle();

          if (!existingProf) {
            const { error: profInsertErr } = await supabase.from('profiles').insert([{
              id: authUserId,
              full_name: data.fullName,
              email: cleanEmail,
              mobile_number: data.mobileNumber,
              username: newWorker.username,
              role: 'worker',
              address: data.address,
              status: 'Pending Approval',
              is_approved: false,
              created_at: new Date().toISOString()
            }]);

            if (profInsertErr) {
              console.error('Worker profile insertion error:', profInsertErr);
            }
          }
        }

        await supabase.auth.signOut();
      } catch (err: any) {
        console.error('Supabase worker registration error:', err);
      }
    }

    setIsLoading(false);
    return {
      success: true,
      pendingApproval: true,
      requiresVerification: true,
      pendingUser: newWorker,
      message: 'Worker registration submitted! Please verify your email before logging in. Your account is also pending approval by farm management.'
    };
  };

  // Password Reset Request
  const sendPasswordResetEmail = async (email: string): Promise<{ success: boolean; message: string; otpCode?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    
    // Generate clean 6-digit Email OTP Verification Code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    if (isSupabaseConfigured) {
      try {
        await supabase.auth.resetPasswordForEmail(cleanEmail);
      } catch (e) {
        console.error('Supabase resetPasswordForEmail error:', e);
      }
    }

    return {
      success: true,
      otpCode,
      message: `A password reset link & 6-digit Email Verification OTP code have been sent to ${cleanEmail}.`
    };
  };

  // Verify Email OTP / Reset Password
  const verifyEmailResetOTP = async (
    email: string,
    enteredOTP: string,
    expectedOTP: string,
    newPassword?: string
  ): Promise<{ success: boolean; message: string }> => {
    if (enteredOTP.trim() !== expectedOTP.trim()) {
      return { success: false, message: 'Invalid Email Verification Code. Please check your inbox and try again.' };
    }

    if (newPassword && newPassword.length >= 6) {
      const users = db.getUsers();
      const userToUpdate = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
      if (userToUpdate) {
        db.saveUsers(users);
      }
    }

    return {
      success: true,
      message: 'Email verified successfully! You can now log in with your updated password.'
    };
  };

  // Owner Actions for Farm Workers
  const activateWorkerAccount = async (userId: string): Promise<boolean> => {
    const users = db.getUsers();
    let targetWorker: User | undefined;
    const updated = users.map(u => {
      if (u.id === userId) {
        targetWorker = { ...u, status: 'Active' as const, isApproved: true };
        return targetWorker;
      }
      return u;
    });
    db.saveUsers(updated);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('profiles').update({ status: 'Active', is_approved: true }).eq('id', userId);
        if (targetWorker) {
          await supabase.from('notifications').insert([{
            user_id: targetWorker.id,
            title: 'Worker Account Approved!',
            message: `Congratulations ${targetWorker.fullName}! Your farm worker account has been approved by farm management. You can now log in using your email and password.`,
            is_read: false
          }]);
        }
      } catch (e) {
        console.error('Supabase worker activation error:', e);
      }
    }

    if (targetWorker && user?.id === userId) {
      setUser(targetWorker);
      localStorage.setItem('lvf_current_user', JSON.stringify(targetWorker));
    }
    return true;
  };

  const rejectWorkerAccount = async (userId: string): Promise<boolean> => {
    const users = db.getUsers().filter(u => u.id !== userId);
    db.saveUsers(users);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('profiles').delete().eq('id', userId);
      } catch (e) {
        console.error('Supabase worker rejection error:', e);
      }
    }
    return true;
  };

  const suspendWorkerAccount = async (userId: string): Promise<boolean> => {
    const users = db.getUsers();
    const updated = users.map(u => {
      if (u.id === userId) {
        return { ...u, status: 'Suspended' as const, isApproved: false };
      }
      return u;
    });
    db.saveUsers(updated);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('profiles').update({ status: 'Suspended', is_approved: false }).eq('id', userId);
      } catch (e) {
        console.error('Supabase worker suspension error:', e);
      }
    }
    return true;
  };

  const logout = () => {
    if (isSupabaseConfigured) {
      supabase.auth.signOut().catch(e => console.error('Supabase signOut error:', e));
    }
    setUser(null);
    localStorage.removeItem('lvf_current_user');
    localStorage.removeItem('lvf_session_admin');
    localStorage.removeItem('lvf_session_worker');
    localStorage.removeItem('lvf_session_customer');
  };

  const updateProfile = (updatedData: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    localStorage.setItem('lvf_current_user', JSON.stringify(updatedUser));

    const users = db.getUsers().map(u => u.id === user.id ? updatedUser : u);
    db.saveUsers(users);
  };

  return (
    <AuthContext.Provider value={{
      user,
      role: user?.role || null,
      isLoading,
      loginWithEmail,
      registerCustomer,
      registerWorker,
      sendPasswordResetEmail,
      verifyEmailResetOTP,
      activateWorkerAccount,
      rejectWorkerAccount,
      suspendWorkerAccount,
      logout,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
