'use client'

import { SignUp } from "@clerk/nextjs";

export function CustomSignUp() {
  return (
    <SignUp
      afterSignUpUrl="/dashboard/onboarding"
      redirectUrl="/dashboard/onboarding"
      appearance={{
        elements: {
          formButtonPrimary: 
            "bg-primary hover:bg-primary/90 text-primary-foreground",
        },
      }}
    />
  );
} 