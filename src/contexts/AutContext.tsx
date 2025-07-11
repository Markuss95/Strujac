// src/contexts/AutContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from "firebase/auth";
import { auth, db } from "../config/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { formatUsername } from "../utils/userUtils";

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userRole: "admin" | "regular" | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<"admin" | "regular" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user: FirebaseUser | null) => {
        setCurrentUser(user);
        if (user) {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data() as {
              role?: "admin" | "regular";
              disabled?: boolean;
            };
            if (data.disabled) {
              setUserRole(null);
            } else {
              setUserRole(data.role || "regular");
            }
          } else {
            setUserRole(null);
          }
        } else {
          setUserRole(null);
        }
        setLoading(false);
      }
    );

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
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user: FirebaseUser = userCredential.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        if (user.email) {
          await setDoc(userRef, {
            email: user.email,
            username: formatUsername(user.email),
            role: "regular",
            disabled: false,
          });
          setUserRole("regular");
          return;
        } else {
          throw new Error("Korisnički račun nije aktivan ili ne postoji.");
        }
      }
      const data = userSnap.data() as {
        role?: "admin" | "regular";
        disabled?: boolean;
      };
      if (data.disabled) {
        throw new Error("Korisnički račun je deaktiviran.");
      }
      setUserRole(data.role || "regular");
    } catch (err: any) {
      console.error("Full login error:", err.code, err.message, err);
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
    userRole,
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
