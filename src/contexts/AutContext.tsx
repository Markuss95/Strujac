// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Auth,
  User,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../config/firebase";

interface AuthContextType {
  currentUser: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const translateFirebaseError = (errorCode: string): string => {
    switch (errorCode) {
      case "auth/user-not-found":
        return "Korisnik s ovom email adresom nije pronađen.";
      case "auth/wrong-password":
        return "Neispravna lozinka.";
      case "auth/invalid-email":
        return "Neispravna email adresa.";
      case "auth/user-disabled":
        return "Ovaj korisnički račun je deaktiviran.";
      case "auth/email-already-in-use":
        return "Email adresa je već u uporabi.";
      case "auth/operation-not-allowed":
        return "Prijava s email adresom trenutno nije omogućena.";
      case "auth/weak-password":
        return "Lozinka je preslaba. Mora sadržavati najmanje 6 znakova.";
      case "auth/network-request-failed":
        return "Došlo je do mrežne pogreške. Provjerite vašu internetsku vezu.";
      case "auth/too-many-requests":
        return "Previše neuspješnih pokušaja prijave. Molimo pokušajte kasnije.";
      case "auth/invalid-credential":
        return "Nevažeći podaci za prijavu. Molimo provjerite unesene podatke.";
      default:
        return "Došlo je do pogreške prilikom prijave. Molimo pokušajte ponovno.";
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      const croatianError = translateFirebaseError(err.code);
      setError(croatianError);
      throw new Error(croatianError);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await firebaseSignOut(auth);
    } catch (err: any) {
      const croatianError =
        "Došlo je do pogreške prilikom odjave. Molimo pokušajte ponovno.";
      setError(croatianError);
      throw new Error(croatianError);
    }
  };

  const value = {
    currentUser,
    signIn,
    signOut,
    loading,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth mora biti korišten unutar AuthProvider-a");
  }
  return context;
};
