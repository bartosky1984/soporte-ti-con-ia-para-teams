import { User, UserRole } from '../types';
import { supabase } from './supabaseClient';

export const userService = {
  // Simulate Login linking to Supabase Profiles
  login: async (role: UserRole): Promise<User> => {
    // In a real app, this would use Microsoft Entra ID
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let profileId = '999'; // Default Employee
    if (role === UserRole.ADMIN) profileId = '1';
    else if (role === UserRole.TECHNICIAN) profileId = '2';

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (error || !data) {
      // Fallback in case seed didn't run or generic user
      return { 
        id: profileId, 
        name: role === UserRole.USER ? 'Empleado Demo' : 'Usuario Pro', 
        email: `${role.toLowerCase()}@company.com`, 
        role 
      };
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role as UserRole
    };
  },

  getAllUsers: async (): Promise<User[]> => {
    try {
      console.log("🔍 [UserService] Fetching all profiles from Supabase...");
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name');
      
      if (error) {
        console.error("❌ [UserService] Error fetching profiles:", error);
        throw error;
      }
      return (data || []).map(d => ({
        id: d.id,
        name: d.name,
        email: d.email,
        role: d.role as UserRole
      }));
    } catch (e) {
      console.error("❌ [UserService] Supabase getAllUsers failure:", e);
      return []; // Return empty array on error to match original function signature
    }
  },

  getTechnicians: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('role', [UserRole.TECHNICIAN, UserRole.LEAD_TECHNICIAN, UserRole.ADMIN])
      .order('role');
    
    if (error) return [];
    return data.map(d => ({
      id: d.id,
      name: d.name,
      email: d.email,
      role: d.role as UserRole
    }));
  },

  updateUserRole: async (userId: string, role: UserRole): Promise<void> => {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);
    
    if (error) throw error;
  },

  addTechnician: async (name: string, email: string): Promise<User> => {
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      role: UserRole.TECHNICIAN
    };

    const { data, error } = await supabase
      .from('profiles')
      .insert([newUser])
      .select()
      .single();
    
    if (error) throw error;
    return data as User;
  },

  removeTechnician: async (id: string): Promise<void> => {
    // We don't delete users, we just downgrade them to regular USER role
    // This maintains history of their tickets/comments
    await userService.updateUserRole(id, UserRole.USER);
  }
};