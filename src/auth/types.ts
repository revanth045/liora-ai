export type Role = "user" | "restaurant_owner" | "staff" | "admin";
export type Session = {
  user: {
    id: string;
    email: string;
    role: Role;
    name?: string;
    restaurantId?: string;   // populated for role === "staff"
  };
} | null;

export interface AuthAdapter {
  getSession(): Promise<Session>;
  onAuthStateChange(cb: (s: Session) => void): () => void;
  signUpUser(email: string, password: string, fullName?: string): Promise<void>;
  signInUser(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  signUpRestaurantOwner(email: string, password: string, ownerName: string, restaurantName?: string): Promise<void>;
  /** Register a staff member using an owner-generated staff access code. */
  signUpStaff?(email: string, password: string, name: string, staffCode: string): Promise<void>;
  signInFromSwitcher?(email: string): Promise<void>;
  /** Synchronous session read â ” only available on DemoAuth. */
  getSessionSync?(): Session;
  /** Sign in with Google OAuth â ” only available when Supabase is configured. */
  signInWithGoogle?(): Promise<void>;
  /** Send a password-reset email to the given address. */
  resetPassword?(email: string): Promise<void>;
  /** Update the currently signed-in user's password. */
  updatePassword?(newPassword: string): Promise<void>;
}