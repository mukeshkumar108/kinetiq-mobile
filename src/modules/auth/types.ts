export interface UserProfile {
  username: string | null;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  imageUrl: string | null;
  timezone: string | null;
  locale: string | null;
}

export interface User {
  id: string;
  clerkUserId: string;
  email: string | null;
  profile: UserProfile;
  preferences: {
    notifications: { push: boolean; email: boolean };
    communications: { marketing: boolean };
    privacy: { analytics: boolean };
  };
  onboarding: {
    completed: boolean;
    completedAt: string | null;
  };
  subscription: {
    isPro: boolean;
    plan: "free" | "pro";
    status: "active" | "trialing" | "none";
  };
  createdAt: string;
  updatedAt: string;
}
