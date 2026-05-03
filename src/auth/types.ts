export type Role = "user" | "restaurant_owner" | "hotel_owner" | "staff" | "front_desk" | "admin";
export type Session = {
  user: {
    id: string;
    email: string;
    role: Role;
    name?: string;
    restaurantId?: string;   // populated for role === "staff"
    hotelId?: string;        // populated for role === "front_desk"
    // Note: hotel_owner does not need a session-level hotelId — HotelPortal
    // looks hotels up by ownerId (one owner can have multiple).
  };
} | null;

export interface AuthAdapter {
  getSession(): Promise<Session>;
  onAuthStateChange(cb: (s: Session) => void): () => void;
  signUpUser(email: string, password: string, fullName?: string): Promise<void>;
  signInUser(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  signUpRestaurantOwner(email: string, password: string, ownerName: string, restaurantName?: string): Promise<void>;
  signUpHotelOwner?(email: string, password: string, ownerName: string, hotelName?: string): Promise<void>;
  /** Register a staff member using an owner-generated staff access code. */
  signUpStaff?(email: string, password: string, name: string, staffCode: string): Promise<void>;
  /** Register a hotel front-desk member using an owner-generated front-desk code. */
  signUpFrontDesk?(email: string, password: string, name: string, frontDeskCode: string): Promise<void>;
  signInFromSwitcher?(email: string): Promise<void>;
  /** Synchronous session read — only available on DemoAuth. */
  getSessionSync?(): Session;
  /** Sign in with Google OAuth — only available when Supabase is configured. */
  signInWithGoogle?(): Promise<void>;
  /** Send a password-reset email to the given address. */
  resetPassword?(email: string): Promise<void>;
  /** Update the currently signed-in user's password. */
  updatePassword?(newPassword: string): Promise<void>;
  /** Sign in the super-admin (hardcoded in DemoAuth). */
  signInAdmin?(email: string, password: string): Promise<void>;
}