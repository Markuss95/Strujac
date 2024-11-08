// src/components/FirebaseTest/index.tsx
import React, { useState } from "react";
import { auth, db } from "../../config/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import styled from "styled-components";

const TestContainer = styled.div`
  padding: 20px;
  max-width: 500px;
  margin: 0 auto;
`;

const StatusMessage = styled.div<{ success?: boolean }>`
  padding: 10px;
  margin: 10px 0;
  border-radius: 4px;
  background-color: ${(props) => (props.success ? "#d4edda" : "#f8d7da")};
  color: ${(props) => (props.success ? "#155724" : "#721c24")};
`;

const Button = styled.button`
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin: 5px;

  &:hover {
    background-color: #0056b3;
  }
`;

const FirebaseTest = () => {
  const [authStatus, setAuthStatus] = useState<string>("");
  const [dbStatus, setDbStatus] = useState<string>("");

  const testAuth = async () => {
    try {
      const testEmail = "test@example.com";
      const testPassword = "Test123!";

      try {
        // Try to sign in first
        const userCredential = await signInWithEmailAndPassword(
          auth,
          testEmail,
          testPassword
        );
        setAuthStatus(
          `Authentication successful! Signed in user: ${userCredential.user.uid}`
        );
      } catch (signInError) {
        // If sign in fails, create a new user
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          testEmail,
          testPassword
        );
        setAuthStatus(
          `Authentication successful! Created new user: ${userCredential.user.uid}`
        );
      }
    } catch (error: any) {
      setAuthStatus(`Authentication error: ${error.message} (${error.code})`);
      console.error("Full error:", error);
    }
  };

  const testFirestore = async () => {
    try {
      // Check if user is authenticated
      if (!auth.currentUser) {
        setDbStatus(
          'Error: Please authenticate first by clicking "Test Authentication"'
        );
        return;
      }

      // Try to add a test document to Firestore
      const testCollection = collection(db, "test");
      const docRef = await addDoc(testCollection, {
        test: true,
        timestamp: new Date(),
        userId: auth.currentUser.uid, // Add user ID to the test document
      });
      setDbStatus(`Firestore connection successful! Document ID: ${docRef.id}`);
    } catch (error: any) {
      setDbStatus(`Firestore error: ${error.message} (${error.code})`);
      console.error("Full error:", error);
    }
  };

  return (
    <TestContainer>
      <h2>Firebase Connection Test</h2>

      <div>
        <h3>Authentication Test</h3>
        <Button onClick={testAuth}>Test Authentication</Button>
        {authStatus && (
          <StatusMessage success={authStatus.includes("successful")}>
            {authStatus}
          </StatusMessage>
        )}
      </div>

      <div>
        <h3>Firestore Test</h3>
        <Button onClick={testFirestore}>Test Firestore</Button>
        {dbStatus && (
          <StatusMessage success={dbStatus.includes("successful")}>
            {dbStatus}
          </StatusMessage>
        )}
      </div>
    </TestContainer>
  );
};

export default FirebaseTest;
